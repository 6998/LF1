const async = require('async');

/*
 @req {object} is an object contains array of messages
 @callback {function} is the callback in form of cb(error, value)
*/
const startProcess = (req, callback)=>{
  if(!req || !req.messages || !req.messages.length){
    return callback("Error parsing the request");
  }

  async.waterfall([

  ], (err, re)=>{
    console.log(err, re);
    callback(err, re);
  })

  /* TODO: Process each message
  * for now, all we need is a single good message to proceed
  */

};

const filterMessages = (msgs, cb)=>{
  if(!msgs)
   return  cb("No messages to filter", null);
  const filter = msgs.filter(el=>verifySingleMessage(el));
  cb(null, filter);
}

const verifySingleMessage = (msg)=>{
  if(msg
    && msg.type
    && typeof msg.type === "string"
    && msg.unstructured
    && typeof msg.unstructured === "object"
    && msg.unstructured.id
    && typeof msg.unstructured.id === "string"
    && msg.unstructured.text
    && typeof msg.unstructured.text === "string"
    && msg.unstructured.timestamp
    && typeof msg.unstructured.timestamp === "string"
  )
    return true;
  return false;
}


module.exports = {
  startProcess
}
