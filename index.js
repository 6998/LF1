const AWS = require('aws-sdk');
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

exports.handler = (event, context, callback) => {
  console.log("events", event)
  const badResponse = {
    "dialogAction": {
      "type": "Close",
      "fulfillmentState": "Failed",
      "message": {
        "contentType": "PlainText",
        "content": "Sorry, I'm having some issues"
      }
    }
  }
  const goodResponse = {
    "dialogAction": {
      "type": "Close",
      "fulfillmentState": "Fulfilled",
      "message": {
        "contentType": "PlainText",
        "content": "You’re all set. Expect my recommendations shortly! Have a good day"
      }
    }
  }
  if(
    !event.currentIntent.slots.city        ||
    !event.currentIntent.slots.cuisine     ||
    !event.currentIntent.slots.party_size  ||
    !event.currentIntent.slots.date        ||
    !event.currentIntent.slots.time        ||
    !event.currentIntent.slots.number
  ){
    return callback(null, badResponse);
  }

  const MessageAttributes = {
    City: {
      DataType: "String",
      StringValue: event.currentIntent.slots.city
    },
    Cuisine: {
      DataType: "String",
      StringValue: event.currentIntent.slots.cuisine
    },
    PartySize: {
      DataType: "Number",
      StringValue: event.currentIntent.slots.party_size
    },
    Date: {
      DataType: "String",
      StringValue: event.currentIntent.slots.date
    },
    Time: {
      DataType: "String",
      StringValue: event.currentIntent.slots.time
    },
    Number: {
      DataType: "String",
      StringValue: event.currentIntent.slots.number
    }
  }

  var params = {
    DelaySeconds: 1,
    MessageAttributes,
    MessageBody: "New Request",
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/906385631751/chatbot"
  };

  sqs.sendMessage(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });


    return callback(null, goodResponse)

};
