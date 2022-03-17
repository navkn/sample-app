# sample-app

Here will be some information about the app.

## How to start?

Start simple by running `yarn watch` (or `npm run watch`, if you set up the project with `npm`). This will start the project with a local development server.

The source files are located in the [`src`](./src) folder. All web components are within the [`src/client/modules`](./src/modules) folder. The folder hierarchy also represents the naming structure of the web components. The entry file for the custom Express configuration can be found in the ['src/server'](./src/server) folder.

Find more information on the main repo on [GitHub](https://github.com/muenzpraeger/create-lwc-app).

Project Info:

Process request only from specified endpoint urls-->
How workbench processes requests
This server is setup with a user configured with jwtToken Exchange and processses all the requests as that Integration user
This server needs to either accept the requests from multiple orgs.
Hence a separate IU need to created with jwtTokens specific to those orgs.
It needs to accept the sessionID from the incoming request and validate them such that the requesting user is having an active session otherwise the server shouldn't process them.
Also it shouldn't accept the requests from all Domains and only specific to pre-configured orgs. Cors should be managed dynamically.
The requesting user need not to have any api access perm which is very high level of perm which we shouldn't assign to every user in the org.
-----or-----
Now consider a workbench scenario where it performs the data updates as that logged in person taking the sessionID
If the req is coming out of the configured urls then also it needs to start processing the request.
But the req should contain a SessionID which is validated and also that requesting person should have the necessary scopes attached onto that user.
If the server doesn't have any sessionId or invalid then the request results in the error.
/api/org/orgID/service/service_name/Operation_name?params_key=value -->jwtToken config between your
/ui/Operation_name?params_key=value
micro-services as jwt is not suitable between diff platforms as it requires additional config, storing of cert on both platforms. Oauth is better as the both relys on same provider.

What I have learnt in this project
1.Learnt about the connected apps
2.creating a new express server and hosting it on Heroku with git in place.
3.Connecting the sf and server using jwt flow , oauth 2.0 and jwtToken exchange and also even username and password
4.How to pick the correct flow according to the senarios
5.Hands-on creating the LWC-OSS app
6.Created apex timeout execution error and handling it by a batch considering the server bounded to a criteria like each request results in handling of multiple sub-requests processing in separate threads where the responses are queued up.

To do in this project:
build the Heroku pipeline
Make the project able to run perfectly in a local server environment
Make this server able to meet the above requirement
able to refresh the jwt token automatically instead of redeploying if there is any error while retrieving the jwtToken
