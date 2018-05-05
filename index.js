const AWS = require('aws-sdk');
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const async = require('async');
const fs = require('fs');
const path = require('path');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const randomstring = require("randomstring");
const dynamoose = require('dynamoose');


// docker template
let dockerfile = "FROM python:3.4-alpine\n" +
  "ADD . /code\n" +
  "WORKDIR /code\n" +
  "EXPOSE 5000\n" +
  "RUN pip install -r requirements.txt\n" +
  "CMD [\"python\", \"app.py\"]\n"


let finalArr = []; // for the combinations

// zipping part
var file_system = require('fs');
var archiver = require('archiver');

/* Dynamo */

const Run = dynamoose.model('Run', {
  id: {
    type: String,
    hashKey: false,
  },
  options: Object,
  s3: Object,
  err: Object,
  user: String
}, { update: false });


const saveRuns = (items, user, cb)=> {
  Run.batchPut(Object.values(items), function (err, p) {
    if (err) {
      console.log(err);
    } else {
    }
    return cb(err);
  })
}
/******************************************/

const createArray = (item) => {
  if (item.rangeOrType === "range") {
    const tmp = [];
    const from = parseFloat(item.range.from);
    const to = parseFloat(item.range.to);
    const jumps = parseFloat(item.jumps);
    for (let value = from; value <= to; value += jumps) {
      tmp.push({
        value: value.toFixed(3),
        key: item.key
      });
    }
    return tmp;
  } else if (item.rangeOrType === "options") {
    const tmp = item.values.split(",");
    return tmp.map(el => {
      return {
        value: el,
        key: item.key
      }
    })
  } else {
    return [];
  }
};
const allPossibleCombos = (options) => {
  let optionsArr = [];
  for(let k in options) { // create an array for each options
    optionsArr.push(options[k]);
  }

  optionsArr = optionsArr.map(el=>{ // convert each option to a range
    return createArray(el)
  });

  optionsArr = optionsArr.sort((a,b)=>{ // sort by length bigger first
    return b.length-a.length
  });

  optionsArr[0].forEach(item=>{
    finalArr.push([item]);
  });

  optionsArr = optionsArr.slice(1); // remove the first line

  optionsArr.forEach((opArr,a)=>{ // for each array of option

    const newSets = [];
    opArr.forEach((el,b)=>{ // for each element in the array

      const tmp = finalArr.map(el=>{
        return el.map(el2=>Object.assign(el2, {}));
      }); // deep clone

      tmp.forEach((arr,c)=>{ // for each set in the final array
        arr.push(el);
      }); // end adding element for each sub-set

      newSets.push(tmp);

    }); // end each element in the the range

    finalArr = [];
    newSets.forEach((item,d)=>{
      finalArr = finalArr.concat(item)
    })

  });

  return finalArr;
};


const renderFile = (codeArr, options)=>{
  options.forEach(item=>{
    const key = item.key.split("_");
    codeArr[key[0]][key[1]] = `RUNNER_${item.key}`
  });

  let finalFile = "";
  codeArr.forEach(line=>{
    line.forEach(word=>{
      finalFile += word.replace(/\&nbsp\;/g, "\t")
    });
    finalFile += "\n";
  });



  return {finalFile, options};
};

const createZipAndUpload = (fileObj, jobNum, cb)=>{
  const dir = '/tmp';
  const file = fileObj.finalFile;
  const options = fileObj.options;
  // inject the os and the:

  let split = file.split("\n");

  // find the last line with the import statment
  let lastImportLine = 0;
  split.forEach((el, line)=>{
    if(el.includes("import"))
      lastImportLine = line;
  });


  const envVarsArr = options.map(item=>{
    return `RUNNER_${item.key}=os.environ['RUNNER_${item.key}']`;
  });

  const envVarsArrForDocker = options.map(item=>{
    return `ENV RUNNER_${item.key}=os.environ['RUNNER_${item.key}']`;
  });


  // create the app.py
  const part1 = split.slice(0, lastImportLine+1).join("\n");
  const part2 = envVarsArr.join("\n");
  const part3 = split.slice(lastImportLine+1, split.length).join("\n");

  const finalFile = [].concat(part1).concat(part2).concat(part3).join("\n");
  dockerfile = dockerfile += envVarsArrForDocker.join("\n");
  //create the Dockerfile
  fs.writeFileSync("/tmp/Dockerfile", dockerfile);


  // save the file
  const rand = randomstring.generate(7);
  const fileName = `job_num_${jobNum}_rand_${rand}.zip`;
  const filePath = `/tmp/${fileName}`
  const output = file_system.createWriteStream(filePath);
  const archive = archiver('zip');

  output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
  });

  archive.on('error', function(err){
    console.log(err)
    // throw err;
  });

  archive.pipe(output);
  archive.file('/tmp/requirements.txt', { name: 'requirements.txt' })
  archive.file('/tmp/Dockerfile', { name: 'Dockerfile' })
  archive.file('/tmp/file.py', { name: 'file.py' })
  archive.file('/tmp/docker-compose.yml', { name: 'docker-compose.yml' })
  archive.finalize();



  // cb();
  const uploadParams = {Bucket: "docker-6998", Key: '', Body: ''};
  const fileStream = fs.createReadStream(filePath);

  fileStream.on('error', function(err) {
    console.log('File Error', err);
  });
  uploadParams.Body = fileStream;
  uploadParams.Key = path.basename(fileName);

// call S3 to retrieve upload file to specified bucket
  s3.upload (uploadParams, function (err, data) {
    if (err) {
      console.log("Error", err);
    } if (data) {
      console.log("Upload Success", data.Location);
    }
    cb(err, data, fileName);
  });

};

exports.handler = (event, context, callback) => {
  let options = event.options;
  let codeArr = event.codeArr;
  let user = event.user;
  const allCombos = allPossibleCombos(options);

  let i = 0;
  const re = {};
  async.eachSeries(allCombos, (op, cb)=>{
    const file = renderFile(codeArr, op);
    createZipAndUpload(file, i++, (err, data, fileName)=>{
      const id = `job_${i}`;
      re[id] = {
        file: file.finalFile,
        options: file.options,
        s3: data,
        err,
        id: fileName,
        user: user
      };
      console.log("return for ", id);
      cb();
    })
  }, (err1)=>{
    saveRuns(re, user, (err)=>{
      console.log("save err", err);
      return callback(null, {files: re});
    })
  });
};

exports.createArray = createArray;
exports.allPossibleCombos = allPossibleCombos;
