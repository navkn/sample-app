// Simple Express server setup to serve for local testing/dev API server
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const { getToken } = require('sf-jwt-token');
const jsforce = require('jsforce');
const path = require('path');

const DIST_DIR = './dist';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;

const app = express();

var jwtToken;
var conn;
console.log('Path of dir :', path.join(DIST_DIR, '/SLDS/assets')); //      --->  dist
console.log('Path of __dirname', path.join(__dirname, '/../dist')); // -- >  app/src/server
establishConnectionToSF();

app.use(express.static(DIST_DIR)); //appends the dist folder to the root
app.use(helmet());
app.use(helmet({ crossOriginEmbedderPolicy: true }));
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(compression());
//app.use('/home', express.static(DIST_DIR));
app.get('/read', async (req, res) => {
    try {
        let results = await queryDataFromSF();
        res.json(results);
        console.log('Priniting the accounts: ', results);
    } catch (error) {
        console.log('Uncaught exception', error);
    }
});

app.get('/create', async (req, res) => {
    try {
        let results = await insertIntoSF();
        console.log('Inserted successfully', results);
        res.json(results);
    } catch (error) {
        console.log('Error while inserting record', error);
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
        console.log('success', jwtToken);
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
            console.log('connection request is initialized');
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
    console.log('Querying for accounts');
    let result = await conn.query('Select Id,Phone,Site,Name from Account');
    return result;
}

async function insertIntoSF() {
    console.log('Inserting into sf');
    await conn
        .sobject('Account')
        .create({ Name: 'My Account #1' }, function (err, ret) {
            if (err || !ret.success) {
                return console.error(err, ret);
            }
            console.log('Created record id : ' + ret.id);
            return ret;
        });
}

app.listen(PORT, () => console.log(`✅  API Server started:${HOST}:${PORT} `));
