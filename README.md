# multi-ip-rep-retriever
This **nodejs** tool provides an html interface to get IP reputation for multiple IPs using the Imperva Reputation Intelligence service API. This enhances the existing UX functionality that allows to check one IP address at a time.
The tool uses the [Incapsula API](https://docs.incapsula.com/Content/API/api.htm).
In order to use this tool you must have valid API credentials and be subscribed to the service.

# Usage
## Installation
1. Install [nodejs](https://nodejs.org/en/download/) 
2. Download the project files from the github repository and save them locally in a directory of your choice (aka project directory).
3. In the project directory open a command prompt and run **npm install**
## Configuration
4. In setting.js set the following:
   - **apiId** (mandatory)- your API ID which you can generate as described in the [API Key Management](https://docs.incapsula.com/Content/management-console-and-settings/api-keys.htm) page
   - **apiKey** (mandatory) - Your API_KEY which you can generate as described in the [API Key Management](https://docs.incapsula.com/Content/management-console-and-settings/api-keys.htm) page
   - **listeningPort** (default 3000)- The multi-ip-rep-retriever will use this port to communicate with your web-browser
   - **ipListLengthLimit** (default 10)- This will limit the number of IPs you can submit in the same time. This is due to the fact that the  Imperva Reputation Intelligence service has a built in limit for requests over a period of time
   - **printDebugInfo** - (default false) - *true* to print debug info during execution	
   
## Start web service
5. In the project directory run the following command in command line: 
- **node version <12** - *node app*
- **node version >=12** - *node --http-parser=legacy app* due to issue listed [here](https://github.com/nodejs/node/issues/27711)

## Get IP reputation
6. Open web browser and set 127.0.0.1:<port number>. For example 127.0.0.1:3000
7. Set required IP addresses in text box separated a by space or comma
8. Press the 'Submit' button
9. If you want to drill down to a specific IP select it's link from the list and you will be directed to the Reputation Intelligence GUI.
   You need to be logged in to the Cloud WAF console in order to be able to see this information.

# Dependencies
- nodejs
- packages
  - aysnc
  - express
  - fs
  - ip
  - request
  - request-promise

# Contributions & Bug reports
## Contribution
- You can create your own branch and add features, fix bugs.
If you have to merge your changes into the master branch, please reach out to me via mail doron.tzur@imperva.com.
- You can also reach out to me with suggestions which I might implement.

## Reporting Bugs
Please open a Git Issue and include as much information as possible. If possible, provide sample code that illustrates the problem you're seeing. If you're seeing a bug only on a specific repository, please provide a link to it if possible.

Please do not open a Git Issue for help, leave it only for bug reports.
