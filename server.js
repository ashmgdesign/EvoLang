const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);



// Serve the static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', __dirname + '/public');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const {google} = require('googleapis');

const serviceAccountKeyFile = "./ashtest-385009-52c76af6eff8.json";
const sheetId = '1Ui5uGoJsIRSU--oxID0ETfxIFDpMqsQ8R3YVJyxyjAU'
const tabName = 'Sheet1'
const range = 'A:E'

// Listen for incoming connections from clients
io.on('connection', (socket) => {
    console.log('A user has connected');

    // Listen for incoming chat messages from clients
    socket.on('chat message', (msg) => {
        console.log(`Message: ${msg}`);
        io.emit('chat message', msg); // Broadcast the message to all connected clients
    });

    // Listen for disconnections from clients
    socket.on('disconnect', () => {
        console.log('A user has disconnected');
    });
});

app.get('/', (req, res) => {
    res.render("index.html")
});

app.get('/fetchKeys', async (req, res) => {
    let data = await getSheets();
    console.log(data);
    res.json(data)
});

async function getSheets() {
  // Generating google sheet client
  const googleSheetClient = await _getGoogleSheetClient();

  // Reading Google Sheet from a specific range
  return await _readGoogleSheet(googleSheetClient, sheetId, tabName, range);
}

async function _getGoogleSheetClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({
    version: 'v4',
    auth: authClient,
  });
}

async function _readGoogleSheet(googleSheetClient, sheetId, tabName, range) {
  const res = await googleSheetClient.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!${range}`,
  });

  return res.data.values;
}

async function _writeGoogleSheet(googleSheetClient, sheetId, tabName, range, data) {
  await googleSheetClient.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tabName}!${range}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      "majorDimension": "ROWS",
      "values": data
    },
  })
}

// Start the server
server.listen(3000, () => {
    console.log('Server started on port 3000');
});
