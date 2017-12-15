const express = require('express');
const bodyParser = require('body-parser');
const Sha256 = require('./sha256.js');
const CODEC = require('./encode.js');
const PORT = process.env.PORT || 5000;
const SECRET = process.env.SECRET;
const MACHINE_NAME = process.env.MACHINE_NAME;

const INSTRUCTIONS = () => {return `Send a POST with the following json: {'name': String, 'token': String}. `+
  `(Remember to set Content-type header in postman to application/json) `+
  `If its your first time, you can set 'token' to 'NEW'.`;}
const INVALID_TOKEN_MESSAGE = () => "INVALID TOKEN. " + INSTRUCTIONS();
const WELCOME_MESSAGE = (name, origin) => `Hello ${name}. Your token came from box# ${origin}.`
const NEW_NAME_MESSAGE = (name) => `Your new name is ${name}.`

const salted = (str) => {
  return SECRET+str;
};

const makeToken = (name) => {
  let payload = {
    name: name,
    origin: MACHINE_NAME,
  };
  payload = CODEC.btoa(JSON.stringify(payload));
  let signature = Sha256.hash(salted(payload));
  return `${payload}.${signature}`;
};

const readToken = (token) => {
  let payload = token.split(".")[0];
  let signature = token.split(".")[1];
  if ( !(typeof payload === "string" && typeof signature === "string") ) {return null;}
  if ( Sha256.hash(salted(payload) === signature) ) {
    return JSON.parse(CODEC.atob(payload));
  } else {
    return null;
  }
};

const main = function (req, res) {
  //body is empty or "token" property is missing
    //send instructions as 404
  if (!(req.body) || (typeof req.body.token !== "string")) {
    res.status(404);
    return res.json({message: INSTRUCTIONS()});
  }

  //body "token" property is "NEW"
    //make token
    //status 201
  if (req.body.token === "NEW") {
    res.status(201);
    let name = req.body.name || "no-name";
    return res.json({message: NEW_NAME_MESSAGE(name), newToken: makeToken(name)});

  //body "token" property is anything else
    //try to hash
  } else {
    let contents = readToken(req.body.token); //will be null if invalid token, otherwise {name, origin}

    //if signature matches
      //message += welcome sentence
      //message += token came from sentence
      //if submitted name is different then token name
        //message += new name sentence
        //status 204
      //else
        //status 200
    if (contents !== null) {
      if (req.body.name && req.body.name !== contents.name) {
        res.status(201);
        return res.json({
          message: WELCOME_MESSAGE(contents.name, contents.origin) +" "+ NEW_NAME_MESSAGE(req.body.name),
          newToken: makeToken(req.body.name),
        });
      } else {
        res.status(200);
        return res.json({
          message: WELCOME_MESSAGE(contents.name, contents.origin),
          newToken: makeToken(contents.name),
        });
      }

    //if signature does not match
      //send error message as 403
      //invalid hash
    } else {
      res.status(403);
      return res.json({message: INVALID_TOKEN_MESSAGE()});
    }
  }
};

express()
  .use(bodyParser.raw())
  .use(bodyParser.json())
  .use(main)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));


