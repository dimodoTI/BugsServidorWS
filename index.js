// Include Nodejs' net module.
var net = require('net');

var client = new net.Socket();
client.connect(4000, '10.1.6.61.0.0.1', function () {
    console.log('Connected');
    client.write('Hello, server! Love, Client.');
});

client.on('data', function (data) {
    console.log('Received: ' + data);
    client.destroy(); // kill client after server's response
});

client.on('close', function () {
    console.log('Connection closed');
});