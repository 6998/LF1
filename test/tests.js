const chai = require('chai');
const assert = chai.assert;    // Using Assert style
const event = require("../event.json")
const func = require("../index")


const rangeOption = {
  "word": "custom_val",
  "values": "0",
  "type": "number",
  "key": "18-12",
  "rangeOrType": "range",
  "jumps": 0.1,
  "range": {
    "from": 0,
    "to": 1
  }
};

const optionsOption ={
  "word": "custom_val",
  "values": "1,2,3,4,5,6",
  "type": "number",
  "key": "19-12",
  "rangeOrType": "options",
  "jumps": 0.1,
  "range": {
    "from": 0,
    "to": 1
  }
};

const options = {
  "19-12": {
    "word": "custom_val",
      "values": "a,b",
      "type": "number",
      "key": "19-12",
      "rangeOrType": "options",
      "jumps": 0.1,
      "range": {
      "from": 0,
        "to": 1
    }
  },
  "19-18": {
    "word": "custom_val",
    "values": "X,Y",
    "type": "number",
    "key": "19-12",
    "rangeOrType": "options",
    "jumps": 0.1,
    "range": {
      "from": 0,
      "to": 1
    }
  },
  "18-12": {
    "word": "custom_val",
      "values": "0",
      "type": "number",
      "key": "18-12",
      "rangeOrType": "range",
      "jumps": 0.1,
      "range": {
      "from": 0.8,
        "to": 1
    }
  },
}
describe('Array', function () {
  it("should create an array for range", () => {
    const arr = func.createArray(rangeOption);
    assert.equal(arr[0].value, 0, `${arr[0].value} doesn't contains 0.1`);
    assert.equal(arr.length, 11, `${arr.length} - length should be 11`);
  })

  it("should create an array for options", () => {
    const arr = func.createArray(optionsOption);
    assert.equal(arr[0].value, 1, `${arr[0].value} doesn't contains 0.1`);
    assert.equal(arr.length, 6, `${arr.length} - length should be 11`);
  })

  it("should create an all possible combinations", () => {
    const arr = func.allPossibleCombos(options);
    assert.equal(arr.length, 3*2*2, `${arr.length} - length should be 11`);
  })
});
