const express = require("express");
const request = require("sync-request");
const url = require("url");
const qs = require("qs");
const querystring = require('querystring');
const cons = require('consolidate');
const cors = require('cors');
let __ = require('underscore');
__.string = require('underscore.string');

const app = express();
app.use(cors());

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', 'ui');

const client = {
  "client_id": "client-1",
  "client_secret": "client-1-secret",
  "redirect_uri": "http://127.0.0.1:9009/callback"
}

const authServer = {
  authorizationEndpoint: "http://localhost:9008/authorize",
  tokenEndpoint: "http://localhost:9008/token"
};

app.get('/', function (req, res) {
  res.render('index', {
    access_token:'',
    token_type: '',
    scope: ''
  });
});

app.get('/authorize', function (req, res) {
  /*
	 * Redirect the user to the auth server
	 */
  const options = {
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: client.redirect_uri,
    scope: "read"
  };
  const authorizeURL = buildUrl(authServer.authorizationEndpoint, options);
  res.redirect(authorizeURL);

})

app.get('/callback', function (req, res) {
  /*
	 * Get token from auth server
	 */
  const code = req.query.code;
  const formData = qs.stringify({
    grant_type: "authorization_code",
    code,
    redirect_uri: client.redirect_uri

  });
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Authorization": "Basic " + encodeClientCredentials(client.client_id, client.client_secret)
  };

  const tokRes = request("POST", authServer.tokenEndpoint, {
    body: formData,
    headers
  });

  const body = JSON.parse(tokRes.getBody());
  console.log("!!!!!================",body)
  res.render("index", {
    access_token: body.access_token,
    token_type: body.token_type,
    scope: body.scope
  });

})

const server = app.listen(9009, 'localhost', function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('OAuth Client is listening at http://%s:%s', host, port);
});

const buildUrl = function(base, options) {
  const newUrl = url.parse(base, true);
  delete newUrl.search;
  if (!newUrl.query) {
    newUrl.query = {};
  }
  __.each(options, function(value, key, list) {
    newUrl.query[key] = value;
  });

  return url.format(newUrl);
};

const encodeClientCredentials = function(clientId, clientSecret) {
  return new Buffer(querystring.escape(clientId) + ':' + querystring.escape(clientSecret)).toString('base64');
};
