var request = require('request-promise');
var async = require('async');
var settings = require('../settings.js');


var criticalErrorSortVal = 0;
var numConcurrentConnections = 15;

function validateIp(ipAdd)
{
    var validIp = false;
    var ipParts = ipAdd.split(".");

	//Check that 4 . delimited strings that are digits only
    if(ipParts.length == 4)
    {
        for(var i=0;i<4;i++){ 
            if (((ipParts[i].length >= 1) && (ipParts[i].length <= 3)) && 
                (parseInt(ipParts[i]) <= 255) && (/^[0-9]*$/.test(ipParts[i])))
            { /* digits only, not more than 255 and with first digit not 0 means valid*/
                if (i == 0 && ipParts[i] == 0)
                    break;
            }
            else
                break;
        }
    }
    if(i==4)
		validIp=true; 
        
    return (validIp);
}

//Set list with valid IP addresses, remove duplicates for efficiency.
function setIpList(ipInput)
{
	var ipList = [];
	var isValidIp;
	var ipFound = false;
	
	var ipTempList = [];
	
	//If input is only 1 IP address, it is of object format and not array. As forEach receives an array we need to transform it */
	if (Array.isArray(ipInput))
		ipTempList = ipInput;
	else
	{
		ipTempList.push(ipInput);
	}

	for (var i=0; i < ipTempList.length; i++)
	{
		isValidIp = validateIp(ipTempList[i]);
		// Iterate through IP list and set only if IP doesn't exist
		if (isValidIp)
		{
			ipFound = false;
			for (j=0; j<ipList.length && ipFound == false; j++)
			{
				if (ipList[j] == ipTempList[i])
					ipFound = true;
			}
			if (!ipFound)
				ipList.push(ipTempList[i]);
		}
	}

	return (ipList)
}

function getIpReputationList(urlData, ipInput, informCaller, res, outSideCb)
{
	var ipReputationOutput = [];
	var ipList;

	ipList = setIpList(ipInput);
	// Run through list of IPs.
	if (ipList.length > 0)
	{
		async.forEachLimit(ipList, numConcurrentConnections, function(ip, cb){
			getIpReputation(urlData, ip, ipReputationOutput, cb);
			}, function(err){
			if (err){
				//deal with the error
				console.log("error in getting IPs")
				informCaller(ipReputationOutput, res, outSideCb);
				return;
			}

			informCaller(ipReputationOutput, res, outSideCb);
		});
	}
	else
	{
		ipReputationOutput.push({"ipAddress": 0, "status": "error",  "sortOrder": criticalErrorSortVal, "errMessage": "Empty List"});
		informCaller(ipReputationOutput, res, outSideCb);
	}
}


function getIpReputation(urlData, ipAddress, ipReputationOutput, informCaller)
{
	var sortOrder = criticalErrorSortVal;
	var urlString = 'https://api.imperva.com/ip-reputation/v1/reputation?api_key=' + urlData.api_key + 
		'&api_id=' + urlData.api_id + '&ip=' + ipAddress;
// form data
	var options = {
		method: 'GET',
		port: 443,
		uri: urlString,
		host: 'my.incapsula.com',
		resolveWithFullResponse: true, //Set to get HTTP error code
		simple: false,				   //Set to hand HTTP error code
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
				},
		path: '/api.imperva.com/analytics/v1/incidents',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
	}

	request(options)
	.then(function (response) {	
		 var errMessage = response.body;

		 if (settings.printDebugInfo)
		 {
			console.log("Response status code: " + response.statusCode);
			console.log("Response body: " + response.body);			 
		 }

		 if (response.statusCode == 200)
		 {
			var jResponse = JSON.parse(response.body);
			setIpReputationInfo( response.body, ipReputationOutput);
			informCaller();	
		 }
		 else
		 {
			if (response.statusCode == 401)
			{
				//Currently 2 cases
				if (response.body.includes('<html>')) /*Returned when number of calls exceed allowed */
				{	
					sortOrder = 10;
					errMessage = "Exceeded number of requests, please try again later";
				}
				else if (response.body.includes('errMsg')) //Most of the time wrong credentials
				{
					var jResponse = JSON.parse(response.body);
					sortOrder = criticalErrorSortVal;
					errMessage = jResponse.errMsg;
				}
			}
			else if (response.statusCode == 403)
			{
				sortOrder = criticalErrorSortVal;
				errMessage = "Missing credentials";			
			}
			ipReputationOutput.push({"ipAddress": ipAddress, "status": "error",  "sortOrder": sortOrder, "errMessage": errMessage});
			informCaller();
		}
	})
	.catch(function (err) {
		// Deal with the error
		console.log("Exception getting account ip-reputation info " + err);
		ipReputationOutput.push({"ipAddress": ipAddress, "status": "error",  "sortOrder": criticalErrorSortVal, "errMessage": errMessage});
		informCaller();
	})
}

function setIpReputationInfo(payload, ipReputationOutput)
{
	var jPayload = JSON.parse(payload);
	var riskScore = "NA";
	var riskDesc = "IP not found";
	var sortOrder;

	if (jPayload.risk)
	{
		riskScore = jPayload.risk.risk_score;
		riskDesc = jPayload.risk.risk_description;
	}

	if (riskScore == 'CRITICAL')
		sortOrder = 1;
	else if (riskScore == 'HIGH')
		sortOrder = 2;
	else if (riskScore == 'MEDIUM')
		sortOrder = 3;
	else if (riskScore == 'LOW')
	sortOrder = 5;
	else if (riskScore == 'NA')
		sortOrder = 5;


	ipReputationOutput.push({"ipAddress":  jPayload.ip, "status": "ok", "sortOrder": sortOrder, "riskScore": riskScore, "riskDesc": riskDesc, 
								"country": jPayload.origin.country, "city" : jPayload.origin.city,
								"orgName" : jPayload.asn.organization_name, "orgNumber" : jPayload.asn.organization_number,
								"knownToUse" : jPayload.known_to_use, "knownFor" : jPayload.known_for});

}

module.exports.criticalErrorSortVal = criticalErrorSortVal;
module.exports.getIpReputationList = getIpReputationList;
module.exports.getIpReputation = getIpReputation;
