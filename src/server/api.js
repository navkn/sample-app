// Simple Express server setup to serve for local testing/dev API server
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const { getToken } = require('sf-jwt-token');
const jsforce = require('jsforce');
const jsonWebToken = require('jsonwebtoken');
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
app.get('/read', async (req, res) => {
    try {
        let results = await queryDataFromSF();
        res.json(results);
        console.log('#records size : ', results.totalSize);
    } catch (error) {
        console.log('Uncaught exception', error);
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
        console.log('Error while inserting record', error);
    }
});
//response will be timedout by default after 30sec
app.post('/update', async (req, res) => {
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
            console.log('Error while processing the request');
            res.status(400).send(JSON.stringify(error)); //res.writeHead(202);//try with status set setheader instead of using setHeader
        } else {
            console.error(
                'Received the error after the cancellation of process due to defined response timeout ',
                JSON.stringify(error)
            );
        }
        clearInterval(timeInterval);
    }
});

app.post('/token', (req, resp) => {
    console.log('got the token access request from body', req.body.assertion);
    jsonWebToken.verify(
        req.body.assertion,
        process.env.PRIVATE_KEY,
        { algorithms: ['RS256'] },
        (error, body) => {
            console.log('error', error);
            console.log('body ', body);
        }
    );
    resp.json(
        '00D2w000003Ndfs!AQIAQOdu9MvIXstSKlE7WWv66OdASG_XrSkKAoo_IMyyh5y5Ajuz3M2gqKyRnxe8MuadkOBCT6ohgGXUYXPE9t8gpRAi0zVv'
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
        console.log('Got an error while getting an access token', error);
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
        console.log('Connection is failed', error);
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

app.listen(PORT, () => console.log(`✅  API Server started:${HOST}:${PORT} `));
// server.setTimeout(60000, () => {
//     console.log('Server timeout and so socket will be closed ');
// });//doesn't handle the h12 error
