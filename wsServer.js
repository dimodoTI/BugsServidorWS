//import { TARJETACHIP, POST, LECTORLED } from "./dispositivos.mjs"
const TARJETACHIP = "tarjetaChip"
const POST = "postNet"
const LECTORLED = "lectorLed"

const configuracion = [{
        id: "1",
        com: 1,
        dispositivo: TARJETACHIP,
        velocidad: 9600,
        datos: 8,
        paridad: "N",
        parada: 1,
        conectado: false
    },
    {
        id: "3",
        com: 3,
        dispositivo: POST,
        velocidad: 19200,
        datos: 8,
        paridad: "N",
        parada: 1,
        conectado: true
    },
    {
        id: "2",
        com: 2,
        dispositivo: LECTORLED,
        velocidad: 9600,
        datos: 8,
        paridad: "N",
        parada: 1,
        conectado: false
    }
]


const http = require('http');
const WebSocketServer = require('websocket').server;
const net = require('net');
const client = new net.Socket();
let clientConectado = false;
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


let connection = null
let dispositivos = null
const conectarDispositivos = (connection, configuracion) => {
    const disp = {}
    // comentario
    configuracion.forEach(conf => {

        if (conf.conectado) {
            let sPort = new SerialPort("COM" + conf.id, {
                baudRate: conf.velocidad
            })
            sPort.on('error', function (err) {
                // connection.sendUTF("#" + conf.dispositivo + "#" + "Error: " + err.mensaje);
                console.log('Error: ', err.message)
            })
            sPort.on('open', function () {

                console.log(conf.dispositivo, 'Abierto')
            })
            sPort.on('data', function (data) {
                connection.sendUTF("#" + conf.dispositivo + "#" + data);
                console.log('Data:', data);
            })

            disp[conf.dispositivo] = sPort
        }

    })

    return disp
}



let response = null
client.on('data', (data) => {
    console.log('data received');
    connection.sendUTF(data)
    /* response.write('Servidor: ' + data + "</br>");
    response.end(); */
});
client.on('close', () => {
    clientConectado = false;
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

wsServer.on('request', function (request) {
    connection = request.accept(null, request.origin);
    if (dispositivos) {
        console.log("cerrando posNet")
        dispositivos.postNet.close()
        dispositivos.postNet = null
    }
    setTimeout(() => {
        dispositivos = conectarDispositivos(connection, configuracion)
    }, 1000)


    connection.on('message', function (message) {
        console.log('Received Message:', message.utf8Data);
        if (message.utf8Data == "connect" && !clientConectado) {
            client.connect(4000, '192.168.0.21', () => {
                clientConectado = true;
                console.log('Connected');
                connection.sendUTF('Connectado al 192.168.1.107 port 4000');
            })
        }

        if (message.utf8Data.indexOf("$send") == 0) {
            console.log(message.utf8Data);
            const mensaje = message.utf8Data.replace("$send:", "$")
            console.log(mensaje);
            client.write(mensaje)
        }
        if (message.utf8Data.indexOf("#") == 0) {

            const dispositivo = message.utf8Data.split("#")[1]
            const mensaje = message.utf8Data.split("#")[2]
            console.log("dispositivo:" + dispositivo);
            console.log("mensaje:" + mensaje);
            dispositivos[dispositivo].write(mensaje)
        }
    });
    connection.on('close', function (reasonCode, description) {
        console.log('Client has disconnected.');
    });



});