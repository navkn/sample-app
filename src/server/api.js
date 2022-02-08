// Simple Express server setup to serve for local testing/dev API server
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const { getToken } = require('sf-jwt-token');
const jsforce = require('jsforce');

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

app.post('/update', async (req, res) => {
    try {
        console.log('Update is hit');
        console.log(
            'req details',
            req.params,
            req.body,
            req.headers,
            req.query
        );
        const jsonBody = req.body;
        const records = jsonBody.records;
        const sObjectType = jsonBody.sObjectType;
        const results = await updateIntoSF(records, sObjectType);
        console.log('Updated successfully', results.length);
        res.json(results);
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
    await conn.sobject(sObjectType).update(records, (err, rets) => {
        if (err) {
            return console.error('Errror while updating', err);
        }
        for (let i = 0; i < rets.length; i++) {
            records[rets[i].id].result =
                rets[i].success === true ? 'success' : 'failed';
        }
        return records;
    });
}

app.listen(PORT, () => console.log(`✅  API Server started:${HOST}:${PORT} `));
