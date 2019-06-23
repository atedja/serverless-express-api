"use strict";

const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const express = require('express')
const AWS = require('aws-sdk')
const app = express()

const USERS_TABLE = process.env.USERS_TABLE;
const OFFLINE = process.env.IS_OFFLINE === "true";
let dynamoDbParams;
if (OFFLINE) {
  dynamoDbParams = {
    region: "localhost",
    endpoint: "http://localhost:8000"
  };
} else {
  dynamoDbParams = {};
}

let dynamoDb = new AWS.DynamoDB.DocumentClient(dynamoDbParams);
app.use(bodyParser.json({ strict: false }));

app.get('/', function(req, res) {
  res.send(process.env.SERVICE_NAME)
})

app.get('/user/:userId', function(req, res) {
  let params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    }
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: "Error in retrieving user" });
    }

    if (result && result.Item) {
      let {userId, name} = result.Item;
      res.json({ userId, name });
    } else {
      res.json({});
    }
  });
})

app.post("/users", function(req, res) {
  let { userId, name } = req.body;
  if (typeof userId !== "string" || typeof name !== "string") {
    res.status(400).json({ error: "fields must be string" });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
    }
  }

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: "Could not create user" });
    }
    res.json({ userId, name });
  });
})

module.exports.handler = serverless(app);
