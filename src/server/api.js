// Simple Express server setup to serve for local testing/dev API server
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const { getToken } = require('sf-jwt-token');
const jsforce = require('jsforce');
// const timeout = require('connect-timeout');
const DIST_DIR = './dist';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;

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
    console.log('before setting the timeout');
    // req.setTimeout(10000, () => {
    //     req.clearTimeout();
    //     res.send('Still processing');
    //     console.log('request timed out at 10secs');
    // }); //50secs
    // res.setTimeout(15000, () => {
    //     console.log('Response is timedout at 15sec');
    // });
    //  res.setTimeout(50000);//50secs
    const space = ' ';
    setTimeout(() => {
        console.log(
            'checking about the header sent or not in timeout func',
            res.headersSent
        );
        if (!res.headersSent) {
            console.log('writing the header just now');
            res.status(202); //res.writeHead(202);//try with status set setheader instead of using setHeader
            console.log(
                'wrote the head just now and sending the headers and space'
            );
            res.write(space);
        }
    }, 25000); //sending a whitespace to keep the connection alive at client
    console.log('after setting the timeout');
    try {
        console.log('Update request is received: ');
        const jsonBody = req.body;
        const records = jsonBody.records;
        const sObjectType = jsonBody.sObjectType;
        const results = await updateIntoSF(records, sObjectType);
        console.log('Checking about the header sent', res.headersSent);
        res.write(JSON.stringify(results)); //couldn't able to write data to the same response saying the headers have been already set
        res.end();
        console.log('Checking for the timeout', JSON.stringify(results));
    } catch (error) {
        console.log('Error while parsing the request', error);
    }
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
        console.log('N@ Got an error while getting an access token', error);
    }
}

async function establishConnectionToSF() {
    await getAccessTokenFromJWT();
    try {
        if (jwtToken) {
            console.log(
                'Got the access token ',
                jwtToken.instance_url,
                jwtToken.access_token
            );
            conn = new jsforce.Connection({
                instanceUrl: jwtToken.instance_url,
                accessToken: jwtToken.access_token
            });
            console.log('connection is succeeded');
        }
    } catch (error) {
        console.log('Connection is failed', error);
    }
}
async function queryDataFromSF() {
    console.log('Querying for records');
    let result = await conn.query(
        'select Id,Kilowatt_Hours__c,Name,Panel_Temperature__c,Percent_Obscured__c,Status_Date__c,Maintenance_Requested__c,SolarBot__r.Name,SolarBot__r.Account__r.Name from SolarBot_Status__c order by SolarBot__r.Account__r.Name '
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
    console.log('Started the updatation : ', records, sObjectType);
    let result = await conn.sobject(sObjectType).update(records, (err, ret) => {
        if (err) {
            console.error('Errro while updating the record: ', err);
            return err;
        }
        console.log('Updated successfully: ', JSON.stringify(ret));
        // if (err) { return console.error(err); }
        // for (let i = 0; i < ret.length; i++) {
        //     records[ret[i].id].result =
        //         ret[i].success === true ? 'success' : 'failed';
        // }
        return ret;
    });
    console.log('132', JSON.stringify(result));
    return result;
}

app.listen(PORT, () => console.log(`✅  API Server started:${HOST}:${PORT} `));
// server.setTimeout(60000, () => {
//     console.log('Server timeout and so socket will be closed ');
// });//doesn't handle the h12 error
