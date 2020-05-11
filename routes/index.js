var express = require('express');
var router = express.Router();
var fs = require('fs')
var ipReputation = require('./getIpInfo.js');
var settings = require('../settings.js');

var htmlFileName = 'data/ipReputation.html'

var urlData = {
	api_id: settings.apiId,
  api_key: settings.apiKey,
  account_id: settings.accountId,
	page_size: settings.pageSize,
	page_num: 0
  };

/* GET home page. */
router.get('/', function(req, res, next) {
  //If no query params, provide empty html page
  if (settings.printDebugInfo)
    console.log("Received GET URL: " + req.url);
  else 
    console.log("Received GET");

  if (!Object.keys(req.query).length)
  {
    createInitialPage(res, cb)
  }
  else
  {
    getPageWithQuery(req.query, res, cb);
  }
});


function cb(res, body) 
{
  res.send(body);
}

function createInitialErrorPage(failureMsg, res, outSideCb)
{
  var body = '<html><p>' + failureMsg + '</p></html>'
  outSideCb(res, body);
}


function createInitialPage(res, cb)
{
  var body;
  fs.readFile(htmlFileName, "utf8", function(err, content) {
    if (err)
    {
      console.log(err);
      res.send(err);
    }
   
    //Set listening port number and IP list limit from settings.
    body = content.replace(/\$portNum/g, settings.listeningPort);
    body = body.replace(/\$ipListLengthLimit/g, settings.ipListLengthLimit);

    cb(res, body);
  });
}


function getPageWithQuery(query, res, cb)
{
  var body = "empty";
  if (query.ip.length)
  {
    ipReputation.getIpReputationList(urlData, query.ip, buildHtmlCb, res, cb);
  }
  else
  {
    console.log("empty")
    cb(res, body);
  }
}

function buildHtmlCb(ipReputationOutput, res, cb)
{
  var body;
  body = getIpReputationHtmlTable(ipReputationOutput);
  cb(res, body);
}

function getIpReputationHtmlTable(ipReputationOutput)
{
  var urlPrefix = 'https://my.imperva.com/ip-reputation/ui/dashboard/?accountId='+ settings.accountId + '&ip=';
  var body = '<table border="1">\n';
  body += '<tr><th align="left">IP Address</th><th align="left">Risk*</th><th align="left">Risk Description</th>' +
          '<th align="left">ASN</th><th align="left">Organization Name</th><th align="left">Country</th><th align="left">City</th>' +
          '<th align="left">Known to use</th><th align="left">Known for</th></tr>\n';

  //Sort according to riskScore and IP
  ipReputationOutput.sort(function (a,b) {
    if ((a.riskScore < b.riskScore) || 
        (a.riskScore == b.riskScore) && (a.ipAddress > b.ipAddress))
        return (1);
    if ((a.riskScore > b.riskScore) || 
        (a.riskScoree == b.riskScoree) && (a.ipAddress < b.ipAddress))
        return (-1);  
    });

  if (ipReputationOutput[0].riskScore == ipReputation.criticalErrorSortVal)
    body = '<h2 style="color:red">' + ipReputationOutput[0].errMessage + '</h2>';
  else
  {
    for (var i = 0; i < ipReputationOutput.length; i++)
    {
      var riskSeverityStr;
      var riskStr;
      var backGroundColor;
    
      
      if (ipReputationOutput[i].status == "ok")
      {
        backGroundColor = 'gray';
        riskStr = ipReputationOutput[i].riskSeverity;
        
        if (ipReputationOutput[i].riskSeverity == 'CRITICAL')
        {
          backGroundColor = 'DarkRed';
          riskStr = ipReputationOutput[i].riskSeverity + ' (' + ipReputationOutput[i].riskScore + ')';
        }
        else if (ipReputationOutput[i].riskSeverity == 'HIGH')
        {
          backGroundColor = 'red';
          riskStr = ipReputationOutput[i].riskSeverity + ' (' + ipReputationOutput[i].riskScore + ')';
        }
        else if (ipReputationOutput[i].riskSeverity == 'MEDIUM')
        {
          backGroundColor = 'orange';
          riskStr = ipReputationOutput[i].riskSeverity + ' (' + ipReputationOutput[i].riskScore + ')';
        }
        else if (ipReputationOutput[i].riskSeverity == 'LOW')
        {
          backGroundColor = 'green';
          riskStr = ipReputationOutput[i].riskSeverity + ' (' + ipReputationOutput[i].riskScore + ')';
        }
        
        riskSeverityStr = '</td><td align="left"style="background-color:' + backGroundColor + ';color:white;">' + riskStr + '</td>';
        body += '<tr><td align="left"><a href="'+ urlPrefix + ipReputationOutput[i].ipAddress + '">' + ipReputationOutput[i].ipAddress +  '</td>' + 
          riskSeverityStr +
          '<td align="left">' + ipReputationOutput[i].riskDesc +  '</td><td align="left">' + ipReputationOutput[i].orgNumber + '</td>' +
          '<td align="left">' + ipReputationOutput[i].orgName +  '</td><td align="left">' + ipReputationOutput[i].country + '</td>' +
          '<td align="left">' + ipReputationOutput[i].city +  '</td><td align="left">' + ipReputationOutput[i].knownToUse + '</td>' +
          '</td><td align="left">' + ipReputationOutput[i].knownFor + '</td></tr>\n' ;
      }
      else
      {
        body += '<tr><td align="left">' + ipReputationOutput[i].ipAddress +  '</td>' + 
          '<td align="left"style="background-color:black;color:white"> Error</td>' +
          '<td align="left">' + ipReputationOutput[i].errMessage + '</td><td align="left"></td> <td align="left"></td>' + 
          '<td align="left"></td><td align="left"></td><td align="left"></td><td align="left"></td></tr>\n';
      }
    }
    body += '</table>\n';
    body += '<p style="font-size: 14px;">*Based on Imperva-wide customer statistics for the previous 14 days</p>\n';
  }
  return (body);
}
module.exports = router;
