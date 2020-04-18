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
    desconectarDispositivos(dispositivosConectados);
  }
  setTimeout(() => {
    dispositivosConectados = conectarDispositivos(connection, dispositivos);
  }, 1000);

  connection.on("message", function (message) {

    let mensaje = JSON.parse(message.utf8Data)
    console.log(mensaje);

    switch (mensaje.periferico) {
      case "servidorBugs":
        if (mensaje.comando == "connect" && !socket) {
          socket = crearSocket(connection)
        }
        if (mensaje.comando == "send" && socket) {
          socket.write(mensaje.subComando);
        }
        break
      case "tarjetaChip":
        if (mensaje.comando == "write") {
          dispositivosConectados[dispositivo].write(mensaje.subComando);
        }
        if (mensaje.comando == "set") {
          dispositivosConectados[mensaje.periferico].set({
            rts: mensaje.subComando == "on",
            dtr: mensaje.subComando == "on"
          }, (error) => {
            connection.sendUTF(JSON.stringify({
              periferico: "tarjetaChip",
              comando: "info",
              data: (!error).toString() + String.fromCharCode(parseInt("10", 16))
            }))

          });
        }
        if (mensaje.comando == "get") {
          dispositivosConectados[mensaje.periferico].get((error, data) => {
            if (error) console.log(error);
            if (data) connection.sendUTF(JSON.stringify({
              periferico: "tarjetaChip",
              comando: "info",
              data: (!data).toString()
            }))
          })
        }
        break;
      case "posNET":
        break
      case "aplicacion":
        if (mensaje.comando == "info") {
          console.log(mensaje.data)
        }
        break

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