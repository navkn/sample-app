// Simple Express server setup to serve for local testing/dev API server
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const { getToken } = require('sf-jwt-token');
const jsforce = require('jsforce');
const jsonWebToken = require('jsonwebtoken');
const https = require('https');
// const timeout = require('connect-timeout');
const DIST_DIR = './dist';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;
const TIMEOUT = process.env.TIMEOUT || 60000;
const SESSION_ID = process.env.TOKEN;
const LOGIN_URL = process.env.LOGIN_URL;
const app = express();

var jwtToken;
var conn;
establishConnectionToSF();
app.use(express.json()); //available in new release of express else need to use body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.static(DIST_DIR)); //appends the dist folder to the root
app.use(helmet());
app.use(helmet({ crossOriginEmbedderPolicy: true }));
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(compression());
// app.use(timeout('60000')); //uses 60secs as timeout
app.use(loggingMiddleware);
app.get('/read', auth, async (req, res) => {
    try {
        let results = await queryDataFromSF();
        res.json(results);
    } catch (error) {
        console.warn('Uncaught exception', error);
    }
});

app.get('/create', async (req, res) => {
    try {
        const records = req.body.records;
        const sObjectType = req.body.sObjectType;
        let results = await insertIntoSF(records, sObjectType);
        console.log('Inserted successfully', results.length);
        res.json(results);
    } catch (error) {
        console.warn('Error while inserting record', error);
    }
});
//response will be timedout by default after 30sec
app.post('/update', auth, async (req, res) => {
    console.log('Update request is received:');
    // req.setTimeout(10000, () => {
    //     req.clearTimeout();
    //     res.send('Still processing');
    //     console.log('request timed out at 10secs');
    // }); //50secs
    const timeInterval = setInterval(() => {
        if (!res.headersSent || !res.writableFinished) {
            console.log('writing the header just now');
            res.status(202); //res.writeHead(202);//try with status set setheader instead of using setHeader
            res.write(' '); //sending a whitespace
            console.log(
                'wrote the header just now and sent the headers and space'
            );
        }
    }, 25000); //sending a whitespace to keep the connection alive at client
    res.setTimeout(TIMEOUT, () => {
        console.log('Response is timedout at 60sec');
        if (!res.headersSent || !res.writableFinished) {
            res.write("Processing more time So it's cancelled");
            res.end(); //res.writeHead(202);//try with status set setheader instead of using setHeader
            clearInterval(timeInterval);
        }
    });
    try {
        const results = await updateIntoSF(
            req.body.records,
            req.body.sObjectType
        );
        res.write(JSON.stringify(results)); //res.send() -- >couldn't able to write data to the same response saying the headers have been already set
        res.end();
        clearInterval(timeInterval);
        console.log('The result : ', JSON.stringify(results));
    } catch (error) {
        if (!res.headersSent || !res.writableFinished) {
            console.warn('Error while processing the request');
            res.status(400).send(JSON.stringify(error)); //res.writeHead(202);//try with status set setheader instead of using setHeader
        } else {
            console.warn(
                'Received the error after the cancellation of process due to defined response timeout ',
                JSON.stringify(error)
            );
        }
        clearInterval(timeInterval);
    }
});

app.post('/token', (req, resp) => {
    console.log(
        `got the request for accessToken in exchange of jwt token by passing it in the http body :${JSON.stringify(
            req.body
        )} and http headers are :${JSON.stringify(req.headers)}`
    );

    jsonWebToken.verify(
        req.body.assertion,
        process.env.PRIVATE_KEY,
        { algorithms: ['RS256'] },
        (error, body) => {
            if (body) {
                console.log(
                    `Body after verifying the jwt:,${JSON.stringify(body)}`
                );
                resp.status(200).send({
                    access_token:
                        '00D2w000003Ndfs!AQIAQOdu9MvIXstSKlE7WWv66OdASG_XrSkKAoo_IMyyh5y5Ajuz3M2gqKyRnxe8MuadkOBCT6ohgGXUYXPE9t8gpRAi0zVv'
                });
            }
            if (error) {
                console.error(
                    `error in verifying the jwt:, ${JSON.stringify(error)}`
                );
                resp.status(401).statusMessage('User not found'); //Use 401 only because named creds doesn't refresh the accesstoken automatically unless its 401
            }
        }
    );
});
app.get('/signin', async () => {
    if (jwtToken === undefined) await establishConnectionToSF();
    else console.log('Token is already present', jwtToken);
});

async function getAccessTokenFromJWT() {
    try {
        console.log('Fetching access token');
        jwtToken = await getToken({
            iss: process.env.CLIENT_ID,
            sub: process.env.USERNAME,
            aud: process.env.LOGIN_URL,
            privateKey: process.env.PRIVATE_KEY
        });
    } catch (error) {
        console.warn('Got an error while getting an access token', error);
    }
}

async function establishConnectionToSF() {
    console.log(
        `From env, the ID is: ${SESSION_ID}  and the URL is: ${LOGIN_URL}`
    );
    let url;
    let accessToken;
    if (SESSION_ID && LOGIN_URL) {
        url = LOGIN_URL;
        accessToken = SESSION_ID;
    } else {
        await getAccessTokenFromJWT();
        if (jwtToken) {
            url = jwtToken.instance_url;
            accessToken = jwtToken.access_token;
        }
    }
    console.log(`From JWT, the URL is : ${url} and Token is ${accessToken}`);
    try {
        conn = new jsforce.Connection({
            instanceUrl: url,
            accessToken: accessToken
        });
        console.log('connection is succeeded');
    } catch (error) {
        console.warn('Connection is failed', error);
    }
}
async function queryDataFromSF() {
    console.log('Querying for records');
    let result = await conn.query(
        'select Id,Kilowatt_Hours__c,Name,Panel_Temperature__c,Percent_Obscured__c,Status_Date__c,Maintenance_Requested__c,SolarBot__r.Name,SolarBot__r.Account__r.Name from SolarBot_Status__c order by SolarBot__r.Account__c Limit 100 '
    );
    return result;
}

async function insertIntoSF(records, sObjectType) {
    console.log('Inserting into sf', records, sObjectType);
    await conn.sobject(sObjectType).create(records, function (err, ret) {
        if (err || !ret.success) {
            return console.error(err, ret);
        }
        console.log('Created record id : ' + ret.id);
        return ret;
    });
}

async function updateIntoSF(records, sObjectType) {
    console.log(
        'Started the updatation : ',
        typeof records,
        records,
        sObjectType
    );
    let result = await conn.sobject(sObjectType).update(records, (err, ret) => {
        // if (err) {
        //     console.error('Errro while updating the record: ', err);
        //     return err;
        // }
        // console.log('Updated successfully: ', JSON.stringify(ret));
        if (err) {
            console.error(err);
            throw new Error(err);
        }
        return ret;
    });
    return result;
}
function loggingMiddleware(req, resp, next) {
    console.log(
        `From logging middleware,content of http request are :  body :${JSON.stringify(
            req.body
        )} and  headers  :${JSON.stringify(
            req.headers
        )} and  params :${JSON.stringify(
            req.params
        )} and query :${JSON.stringify(req.query)}`
    );
    next(); //The next line will be called after all the middlewares executed as we are not returning here
    console.log(
        `From logging middleware,content of http response are :  body :${JSON.stringify(
            resp.body
        )} and  headers  :${JSON.stringify(
            resp.headers
        )} and  params :${JSON.stringify(resp.params)}`
    );
}
function auth(req, resp, next) {
    const authToken = req.headers.authorization;
    if (!authToken) {
        return resp.status(401).send('Only Authorized people can access data');
    }
    // eslint-disable-next-line no-else-return
    else {
        const accessTokenType = authToken.split(' ')[0];
        const accessToken = authToken.split(' ')[1];
        if (accessTokenType === 'Basic') {
            // password flow
            console.warn(
                'Password and username from sf:',
                Buffer.from(accessToken, 'base64').toString()
            );
            const namePass = Buffer.from(accessToken, 'base64').toString();
            const username = namePass.split(':')[0];
            const password = namePass.split(':')[1];
            if (username === 'admin' && password === 'admin') {
                req.isValidUser = true;
                next();
            } else {
                return resp
                    .status(401)
                    .send(
                        'Credentials are incorrect !! Please retry with correct credentials'
                    );
            }
        } else if (accessTokenType === 'Bearer') {
            //might be jwt flow as we built jwt conn else it could also be a oauth 2.0 flow
            console.warn(
                'access Token from sf might be using oauth or jwt:',
                accessToken
            );
            const userInfoURL =
                'https://login.salesforce.com/services/oauth2/userinfo';
            const options = {
                headers: {
                    Authorization: authToken
                }
            };
            https
                .get(userInfoURL, options, (res) => {
                    let responseData = '';
                    res.on('data', function (chunk) {
                        responseData += chunk;
                    });
                    res.on('end', () => {
                        res.destroy();
                        console.log(
                            'responseData is ',
                            JSON.stringify(responseData)
                        );
                        try {
                            responseData = JSON.parse(responseData);
                            if (responseData) {
                                req.instanceUrl =
                                    responseData.urls.custom_domain;
                                console.log(
                                    'instance url is :',
                                    responseData.urls.custom_domain
                                );
                                next();
                            }
                        } catch (error) {
                            console.error(
                                'Error while parsing the data',
                                error
                            );
                        }
                    });
                })
                .on('error', (e) => {
                    console.error(e, ' while querying for userinfo');
                    return resp.status(401).send('Refresh the token');
                });
            // checkForTokenValidity(accessToken);
            // let isValid = await checkForTokenValidity(accessToken);
            // if (!isValid) {
            //     return resp.status(401).send('Token expired');
            // }
        }
        return null;
        // return next(); //Its not working as expected because it retunrs immediately here
    }
}

// async function checkForTokenValidity(accessToken) {
// const userInfoURL = 'https://login.salesforce.com/services/oauth2/userinfo';
// const bearerToken = 'Bearer ' + accessToken;
// const options = {
//     headers: {
//         Authorization: bearerToken
//     }
// };
// https
//     .get(userInfoURL, options, (res) => {
//         console.log('statusCode:', res.statusCode);
//         console.log('headers:', res.headers);

//         let responseData = '';
//         let headers = res.headers;

//         res.on('data', function (chunk) {
//             responseData += chunk;
//         });

//         res.on('end', () => {
//             res.destroy();
//             if (
//                 headers['content-type'] &&
//                 headers['content-type'].indexOf('application/json') !== -1
//             ) {
//                 try {
//                     responseData = JSON.parse(responseData);
//                 } catch (error) {
//                     console.log('Error while parsing the data', error);
//                     return false;
//                 }
//             }
//             console.log('responseData is ', JSON.stringify(responseData));
//             return true;
//         });
//     })
//     .on('error', (e) => {
//         console.error(e, ' while querying for userinfo');
//         return resp
//                 .status(401)
//                 .send(
//                     'Credentials are incorrect !! Please retry with correct credentials'
//                 );
//     });
// }
app.listen(PORT, () => console.log(`✅  API Server started:${HOST}:${PORT} `));
// server.setTimeout(60000, () => {
//     console.log('Server timeout and so socket will be closed ');
// });//doesn't handle the h12 error
