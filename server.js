const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;
let printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: "\\\\192.168.1.100\\Termica",
});


const dispositivos = require("./dispositivos.json");
const conectarDispositivos = require("./dispositivos").conectarDispositivos;
const desconectarDispositivos = require("./dispositivos")
  .desconectarDispositivos;
const listarDispositivos = require("./dispositivos").listarDispositivos
const server = require("./httpServer.js").server;
const WebSocketServer = require("websocket").server;
const crearSocket = require("./socket.js").crearSocket;
let dispositivosConectados = null;
let socket = null;

const wsServer = new WebSocketServer({
  httpServer: server,
});

wsServer.on("request", function (request) {
  connection = request.accept(null, request.origin);
  listarDispositivos()
  if (dispositivosConectados) {
    desconectarDispositivos(dispositivosConectados);
  }
  setTimeout(() => {
    dispositivosConectados = conectarDispositivos(connection, dispositivos);
  }, 1000);

  connection.on("message", function (message) {
    let mensaje = JSON.parse(message.utf8Data);
    console.log(mensaje);

    switch (mensaje.periferico) {
      case "impresora":
        if (mensaje.comando == "print") {
          const hoy = new Date()
          const fecha = hoy.getDay().toString().padStart(2, "0") + "/" + (hoy.getMonth() + 1).toString().padStart(2, "0") + "/" + hoy.getFullYear().toString()
          const hora = hoy.getHours().toString().padStart(2, "0") + ":" + hoy.getMinutes().toString().padStart(2, "0")

          printer.drawLine()
          printer.newLine()
          printer.alignCenter()
          printer.print("|X|")
          printer.newLine()
          printer.alignCenter()
          printer.print("Comprobante no válido como factura")
          printer.newLine()
          printer.newLine()
          printer.leftRight("Fecha", fecha);
          printer.newLine()
          printer.leftRight("Hora", hora);
          printer.newLine()
          printer.leftRight("Usuario Nro.", mensaje.subComando.usuario);
          printer.newLine()
          printer.leftRight("Nombre", mensaje.subComando.nombre);
          printer.newLine()
          printer.leftRight("Pedido comida para el día", mensaje.subComando.fecha);
          printer.newLine()
          printer.newLine()
          printer.alignCenter()
          printer.setTextDoubleWidth();
          printer.print(mensaje.subComando.descripcion);
          printer.setTextNormal();
          printer.newLine()
          printer.newLine()
          printer.alignCenter()
          printer.setTextSize(2, 2)
          printer.print(mensaje.subComando.numero)
          printer.setTextSize(0, 0)
          printer.newLine()
          printer.alignCenter()
          printer.print("Presentar para retirar")
          printer.newLine()
          printer.drawLine()
          printer.cut()

          try {
            let execute = printer.execute();
            printer.clear();
            console.log("Print done!");
          } catch (error) {
            console.log("Print failed:", error);
          }
        }

        case "servidorBugs":
          if (mensaje.comando == "connect" && !socket) {
            socket = crearSocket(connection);
          }
          if (mensaje.comando == "send" && socket) {
            socket.write(mensaje.subComando);
          }
          break;
        case "tarjetaChip":
          if (mensaje.comando == "write") {
            dispositivosConectados[mensaje.periferico].write(mensaje.subComando + String.fromCharCode(10));
          }
          if (mensaje.comando == "set") {
            dispositivosConectados[mensaje.periferico].set({
                rts: mensaje.subComando == "on",
                dtr: mensaje.subComando == "on",
              },
              (error) => {
                connection.sendUTF(
                  JSON.stringify({
                    periferico: "tarjetaChip",
                    comando: "info",
                    data: (!error).toString() +
                      String.fromCharCode(parseInt("10", 16)),
                  })
                );
              }
            );
          }
          if (mensaje.comando == "get") {
            dispositivosConectados[mensaje.periferico].get((error, data) => {
              if (error) console.log(error);
              if (data)
                connection.sendUTF(
                  JSON.stringify({
                    periferico: "tarjetaChip",
                    comando: "info",
                    data: (!data).toString(),
                  })
                );
            });
          }
          break;
        case "posNet":
          if (mensaje.comando == "write") {

            /*  let hexmess = ["02", "56", "45", "4E", "68", "00", "30", "30", "30", "30", "30", "30", "30", "30", "30", "31", "30", "30", "31", "30", "30", "30", "30", "30", "30", "38", "39", "30", "31", "32", "30", "31", "30", "56", "49", "30", "30", "30", "30", "30", "30", "30", "30", "30", "30", "30", "30", "30", "30", "33", "36", "35", "39", "33", "30", "37", "20", "20", "20", "20", "20", "20", "20", "50", "52", "49", "53", "4D", "41", "20", "4D", "50", "20", "20", "20", "20", "20", "20", "20", "20", "20", "20", "20", "20", "20", "20", "33", "30", "2D", "35", "39", "38", "39", "31", "30", "30", "34", "2D", "35", "20", "20", "20", "20", "20", "20", "20", "20", "20", "20", "01", "03", "11"]
             let textmess = ""
             hexmess.forEach(i => {
               textmess += String.fromCharCode(parseInt(i, 16))

             })


             console.log("ms:" + decodeURIComponent(mensaje.subComando))
             console.log("ok:" + textmess) */
            let hexmess = ["02", "43", "49", "45", "00", "00", "03", "4C"]
            let textmess = ""
            hexmess.forEach(i => {
              textmess += String.fromCharCode(parseInt(i, 16))

            })
            console.log("ms:" + decodeURIComponent(mensaje.subComando))
            console.log("ok:" + textmess)

            dispositivosConectados[mensaje.periferico].write(decodeURIComponent(mensaje.subComando));
          }
          break;
        case "aplicacion":
          if (mensaje.comando == "info") {
            console.log(mensaje.data);
          }

          break;
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