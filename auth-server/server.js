const express = require("express");
const request = require("sync-request");
const url = require("url");
const qs = require("qs");
const bodyParser = require('body-parser');
const querystring = require('querystring');
const randomstring = require("randomstring");
const cons = require('consolidate');
const cors = require('cors');
let __ = require('underscore');
__.string = require('underscore.string');

var app = express();
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support form-encoded bodies (for the token endpoint)

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('json spaces', 4);

const authServer = {
  authorizationEndpoint: "http://localhost:9008/authorize",
  tokenEndpoint: "http://localhost:9008/token"
};

const client = {
  "client_id": "client-1",
  "client_secret": "client-1-secret",
  "redirect_uri": "http://127.0.0.1:9009/callback"
}

// Generate code
app.get("/authorize", function(req, res){
  const code = randomstring.generate(8)
  const redirectURL = `${client.redirect_uri}?code=${code}`
  res.redirect(redirectURL);
});

// Get token by code
app.post("/token", function(req, res){

  const auth = req.headers['authorization'];
  console.log("auth ",req.headers);

  // Assume Authorization is in the header
  if (!auth) {
    res.status(401).json({error: 'no_authorization'});
  }

  const clientCredentials = new Buffer(auth.slice('basic '.length), 'base64').toString().split(':');
  const clientId = querystring.unescape(clientCredentials[0]);
  const clientSecret = querystring.unescape(clientCredentials[1]);

  if (clientId != client.client_id) {
    console.log('Unknown client %s', clientId);
    res.status(401).json({error: 'invalid_client'});
    return;
  }

  if (client.client_secret != clientSecret) {
    console.log('Mismatched client secret, expected %s got %s', client.client_secret, clientSecret);
    res.status(401).json({error: 'invalid_client'});
    return;
  }

  if (req.body.grant_type == 'authorization_code') {

    // TODO: The code should be delete after consume
    const code = req.body.code;

    if(!code) {
      console.log('Unknown code, %s', req.body.code);
      res.status(400).json({error: 'invalid_grant'});
    } else {
      const access_token = randomstring.generate();
      const token_response = { access_token: access_token, token_type: 'Bearer',  scope: 'read' };
      console.log('Issued tokens for code %s', req.body.code);
      res.status(200).json(token_response);
    }
  } else {
    console.log('Unknown grant type %s', req.body.grant_type);
    res.status(400).json({error: 'unsupported_grant_type'});
  }
  return;
});

const server = app.listen(9008, 'localhost', function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log('OAuth Authorization Server is listening at http://%s:%s', host, port);
});
