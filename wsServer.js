const http = require('http');
const WebSocketServer = require('websocket').server;
const net = require('net');
const client = new net.Socket();
const url = require('url');
const fs = require('fs');
const path = require('path');
// you can pass the parameter in the command line. e.g. node static_server.js 3000
const port = process.argv[2] || 9000;
// maps file extention to MIME types
const mimeType = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.eot': 'appliaction/vnd.ms-fontobject',
    '.ttf': 'aplication/font-sfnt'
};
const SerialPort = require('serialport')
const sPort = new SerialPort('COM3', {
    baudRate: 9600
})

/* sPort.write('main screen turn on', function (err) {
    if (err) {
        return console.log('Error on write: ', err.message)
    }
    console.log('message written')
}) */

// Open errors will be emitted as an error event
sPort.on('error', function (err) {
    console.log('Error: ', err.message)
})
sPort.on('open', function () {
    console.log('COM1: ', 'Abierto')
})
sPort.on('data', function (data) {
    console.log('Data:', data)
})
let response = null
client.on('data', (data) => {
    console.log('data received');
    connection.sendUTF(data)
    /* response.write('Servidor: ' + data + "</br>");
    response.end(); */
});
client.on('close', () => {
    console.log('Closed');
    client.destroy();
    client = new net.Socket();
    response.end('Connection closed');
});
const server = http.createServer(
    (req, res) => {
        response = res
        let body = [];
        req.on('error', (err) => {
            console.error(err);
        }).on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            const parsedUrl = url.parse(req.url);

            // extract URL path
            // Avoid https://en.wikipedia.org/wiki/Directory_traversal_attack
            // e.g curl --path-as-is http://localhost:9000/../fileInDanger.txt
            // by limiting the path to current directory only
            const sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
            let pathname = path.join(__dirname, sanitizePath);

            fs.exists(pathname, function (exist) {
                if (!exist) {
                    // if the file is not found, return 404
                    res.statusCode = 404;
                    res.end(`File ${pathname} not found!`);
                    return;
                }

                // if is a directory, then look for index.html
                if (fs.statSync(pathname).isDirectory()) {
                    pathname += '/index.html';
                }

                // read file from file system
                fs.readFile(pathname, function (err, data) {
                    if (err) {
                        res.statusCode = 500;
                        res.end(`Error getting the file: ${err}.`);
                    } else {
                        // based on the URL path, extract the file extention. e.g. .js, .doc, ...
                        const ext = path.parse(pathname).ext;
                        // if the file is found, set Content-type and send data
                        res.setHeader('Content-type', mimeType[ext] || 'text/plain');
                        res.end(data);
                    }
                });
            });
        });
    }
).listen(port);

const wsServer = new WebSocketServer({
    httpServer: server
});
let connection = null
wsServer.on('request', function (request) {
    connection = request.accept(null, request.origin);
    connection.on('message', function (message) {
        console.log('Received Message:', message.utf8Data);
        if (message.utf8Data == "connect") {
            client.connect(4000, '10.1.6.61', () => {
                console.log('Connected');
                connection.sendUTF('Connectado al 10.1.6.61 port 4000');
            })
        }
        if (message.utf8Data == "$PL01!") {
            client.write(message.utf8Data)
        }

        if (message.utf8Data == "hey") {
            connection.sendUTF('WebSocket Conectado!!!');
        }
    });
    connection.on('close', function (reasonCode, description) {
        console.log('Client has disconnected.');
    });
});