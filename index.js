const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const mysql = require('mysql');
const btoa = require('btoa');
require('dotenv').config();

const scope = 'identify';
const redirecturi = `http%3A%2F%2Flocalhost%3A3000%2Fcallback`;

const app = express();
app.use(express.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));

const connection = setupSQL();
let awaitingLinking = {};

function addCode(code, uuid) {
    awaitingLinking[code] = { 'uuid': uuid };
}

app.get('/', (req, res) => {
    res.json({
        'message': 'Who goes there?!'
    });
    console.log(`awaiting linking ${JSON.stringify(awaitingLinking)}`);
});

app.get('/api/islinked/:uuid', async (req, res) => {
    const uuid = req.params.uuid;

    if (!uuid) {
        res.status(200);
        res.json({
            'message': 'Invalid uuid!'
        });
    }
    res.status(200);
    let message = await isLinked(uuid);
    res.json({
        'message': message
    });
});

app.post('/discordlink', (req, res) => {
    console.log('call to old stuff?')
});

app.get('/discord', (req, res) => {
    const code = req.query.code;
    if (!code) {
        res.status(200).send('No Code! Uh oh!');
        return;
    }

    if (!awaitingLinking[code]) {
        res.status(200).send('An error occured, try again later!');
        return;
    }

    res.redirect(`https://discord.com/oauth2/authorize?client_id=735301490838863912&redirect_uri=${redirecturi}&response_type=code&scope=${scope}&state=${code}`)
});

app.get('/api/link', async (req, res) => {
    if (!req.query.uuid) {
        res.status(200).json({ 'message': 'No UUID Specified!' });
        return;
    }
    if (await isLinked(req.query.uuid)) {
        res.status(200).json({ 'message': 'Already Linked!' });
        return;
    }

    const code = createRandCode(32);
    addCode(code, req.query.uuid);

    res.status(200).json({ 'message': 'Okay', 'code': `?code=${code}` });
});

app.get('/callback', async (req, res) => {
    const discCode = req.query.code;
    const code = req.query.state;
    if (!discCode) {
        res.status(200);
        res.send("Error, try again later!");
        return;
    }
    if (!awaitingLinking[code]) {
        res.status(200).send('An error occured, try again later!');
        return;
    }
    const token = await getToken(discCode);
    const user = await getUser(token);

    res.status(200);
    res.send(`All done linking, ${user.username}, Thanks!`);

    insertUser(awaitingLinking[code].uuid, user.id);
    delete awaitingLinking[code];
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App listening on http://localhost:${port}`));


async function getToken(discCode) {
    const creds = btoa(`${process.env.CLIENTID}:${process.env.CLIENTSECRET}`);
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', discCode);
    params.append('redirect_uri', 'http://localhost:3000/callback');
    params.append('scope', 'identify');

    const response = await fetch(`https://discord.com/api/oauth2/token`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${creds}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
    const json = await response.json();

    return json['access_token'];
}

async function getUser(token) {
    const params = new URLSearchParams();
    //params.append('grant_type', 'authorization_code');
    //params.append('code', discCode);
    //params.append('redirect_uri', 'http://localhost:3000/callback');
    //params.append('scope', 'identify');

    const response = await fetch(`https://discord.com/api/users/@me`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    const json = await response.json();

    return json;
}

function isLinked(uuid) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM linkedUsers WHERE mcUUID = '${uuid}'`, (err, results) => {
            if (err) throw err;
            resolve(results.length > 0);
        });
    });
}

function setupSQL() {
    const con = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'discordusers'
    });
    con.connect(err => {
        if (err) throw err;
        console.log('Connected!');
    })
    return con;
}

function createRandCode(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function deleteUser(uuid) {
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM linkedUsers WHERE mcUUID = '${uuid}'`, (err, results) => {
            if (err) throw err;
            resolve();
        });
    });
}

function insertUser(uuid, discordID) {
    return new Promise(async (resolve, reject) => {
        if (await isLinked(uuid)) deleteUser(uuid);
        connection.query(`INSERT INTO linkedUsers VALUES ('${uuid}', '${discordID}')`, (err, results) => {
            if (err) {
                throw err;
                reject(err);
            }
            resolve();
        });
    });
}