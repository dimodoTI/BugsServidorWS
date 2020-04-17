const dispositivos = require("./dispositivos.json")
const conectarDispositivos = require("./dispositivos").conectarDispositivos
const desconectarDispositivos = require("./dispositivos").desconectarDispositivos
const server = require("./httpServer.js").server
const WebSocketServer = require("websocket").server;
const crearSocket = require("./socket.js").crearSocket
let dispositivosConectados = null
let socket = null

const wsServer = new WebSocketServer({
  httpServer: server,
});

wsServer.on("request", function (request) {
  connection = request.accept(null, request.origin);
  if (dispositivosConectados) {
    desconectarDispositivos(dispositivosConectados, configuracion);
  }
  setTimeout(() => {
    dispositivosConectados = conectarDispositivos(connection, dispositivos);
  }, 1000);

  connection.on("message", function (message) {
    console.log("Received Message:", message.utf8Data);

    if (message.utf8Data == "connect" && !socket) {
      socket = crearSocket(connection)
    }

    if (message.utf8Data.indexOf("$send") == 0) {
      console.log(message.utf8Data);
      const mensaje = message.utf8Data.replace("$send:", "$");
      console.log(mensaje);
      socket.write(mensaje);
    }

    if (message.utf8Data.indexOf("#") == 0) {
      const dispositivo = message.utf8Data.split("#")[1];
      const mensaje = message.utf8Data.split("#")[2];

      if (mensaje == ">g" + String.fromCharCode(parseInt("0A", 16))) {
        dispositivosConectados[dispositivo].get((error, data) => {
          if (error) console.log(error);
          if (data) connection.sendUTF("#" + dispositivo + "#" + JSON.stringify(data));;
        })
        return
      }
      if (mensaje == ">s1" + String.fromCharCode(parseInt("0A", 16))) {
        dispositivosConectados[dispositivo].set({
          rts: true,
          dtr: true
        }, (error) => {

          connection.sendUTF("#" + dispositivo + "#" + (!error).toString() + String.fromCharCode(parseInt("10", 16)));

        });
        return
      }
      if (mensaje == ">s0" + String.fromCharCode(parseInt("0A", 16))) {
        dispositivosConectados[dispositivo].set({
          rts: false,
          dtr: false
        }, (error) => {

          connection.sendUTF("#" + dispositivo + "#" + (!error).toString() + String.fromCharCode(parseInt("10", 16)));
        });
        return
      }

      dispositivosConectados[dispositivo].write(mensaje);

      console.log("dispositivo:" + dispositivo);
      console.log("mensaje:" + mensaje);
      console.log("length:" + mensaje.length);
    }
  });
  connection.on("close", function (reasonCode, description) {
    console.log("Client has disconnected.");
  });
});

const getJsonFile = (path) => {
  let output = {};
  try {
    let json = fs.readFileSync(path);
    output = JSON.parse(json);
  } catch (e) {
    output = {};

    // console.log(e.message, e.stack);
  }
  return output;
};

module.exports = exports = getJsonFile;