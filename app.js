var express = require('express');
var getRequest = require('./routes/index');
var ip = require("ip");

var settings = require('./settings.js');

const app = express()

app.get('/*',function(req,res,next){
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Index page
app.use('/', getRequest);


/* Version control */
var appVersion = "1.0";
var requiredSettingsVersion = "1.0";
if (requiredSettingsVersion != settings.version)
{
  console.log("Aborting - Required settings version is " + requiredSettingsVersion + " wherease actual settings version is "+ settings.version);
  process.exit();
}
console.log("multi-ip-rep-retriever version: " + appVersion );

app.listen(settings.listeningPort);
console.log("listening to " + ip.address() + ":" + settings.listeningPort);