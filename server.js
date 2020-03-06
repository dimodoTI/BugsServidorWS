const http = require('http');

const net = require('net');

const client = new net.Socket();

let response = null

client.on('data', (data) => {
    console.log('data received');
    //client.destroy(); // kill client after server's response
    response.write('Servidor: ' + data + "</br>");
    response.end();

});
client.on('close', () => {
    console.log('Closed');
    client.destroy();
    client = new net.Socket();
    response.end('Connection closed');

});

http.createServer((request, resp) => {
    response = resp
    const {
        headers,
        method,
        url
    } = request;
    let body = [];
    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {

        body = Buffer.concat(body).toString();
        // BEGINNING OF NEW STUFF

        response.on('error', (err) => {
            console.error(err);
        });

        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html');
        // Note: the 2 lines above could be replaced with this next one:
        // response.writeHead(200, {'Content-Type': 'application/json'})

        const responseBody = {
            headers,
            method,
            url,
            body
        };

        //response.write(JSON.stringify(responseBody));
        if (url.toUpperCase().indexOf("/INDEX.HTML") != -1) {
            response.write('<a href="http://localhost:5000/Connect">Conectar</a>')
            response.write('<a href="http://localhost:5000/Write?$PL01!">PINK</a>')
            response.end()
        }

        if (url.toUpperCase().indexOf("CONNECT") != -1) {
            client.connect(4000, '10.1.6.61', () => {
                console.log('Connected');
                response.write('Connectado al 10.1.6.61 port 4000</br>');
                response.end()
            })
        }
        if (url.toUpperCase().indexOf("WRITE") != -1) {
            console.log('writing');
            client.write(url.split("?")[1])
        }
        //response.end();
        // Note: the 2 lines above could be replaced with this next one:
        // response.end(JSON.stringify(responseBody))

        // END OF NEW STUFF
    });
}).listen(5000);