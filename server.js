const os = require('os');
const hostname = os.hostname()

const escpos = require('escpos');
escpos.USB = require('escpos-usb');

let device


const options = {}
let contador = 0


const abrirImpresora = () => {

  try {

    device = new escpos.USB("1208", "3605");

    const printer = new escpos.Printer(device, options);

    device.on("connect", function (evt) {
      console.log("impresora prendida")
    })
    device.on("disconnect", function (evt) {
      console.log(evt)
      setTimeout(abrirImpresora, 1000)
    })

    device.open(function (dev) {

      device.device.interfaces[0].claim(); // claim interface

      device.device.interfaces[0].endpoints[1].startPoll(1, 8)

      device.device.interfaces[0].endpoints[1].on("data", function (dataBuf) {
        let dataArr = Array.prototype.slice.call(new Uint8Array(dataBuf, 0, 8)); // convert buffer to array

        if (dataArr.length > 0) {
          console.log(dataArr)
          if (dataArr[0] == 22) {
            contador++
            console.log("On line" + contador)
          }

        }

      })

      device.device.interfaces[0].endpoints[1].on("error", function (evt) {
        console.log(evt)
        //abrirImpresora()
      })
      device.device.interfaces[0].endpoints[1].on("detach", function (evt) {
        console.log(evt)
        //abrirImpresora()
      })

      const ESC = String.fromCharCode(27);
      const GS = String.fromCharCode(29);
      const DLE = String.fromCharCode(16);
      const EOT = String.fromCharCode(4);
      const ST1 = String.fromCharCode(1); //22
      const ST2 = String.fromCharCode(2); //18
      const ST3 = String.fromCharCode(3); //18
      const ST4 = String.fromCharCode(4); //18

      /* setInterval(e => {
        device.write(DLE + EOT + ST4, evt => {
          //console.log(evt)
        })
      }, 2000) */
      setInterval(e => {
        device.write(GS + "a" + ST1, evt => {
          //console.log(evt)
        })
      }, 2000)



    })


  } catch {
    console.log("impresora apagado")
    setTimeout(abrirImpresora, 2000)
  }
}
abrirImpresora()


/* const escpos = require('escpos');
escpos.USB = require('escpos-usb');

let device
try {
  device = new escpos.USB("1208", "3605");
} catch {
  console.log("impresora apagado")
  return

}


const options = {}


const printer = new escpos.Printer(device, options);

device.open(x => {

  device.device.interfaces[0].claim(); // claim interface

  device.device.interfaces[0].endpoints[1].startPoll(1, 8, e => {
    console.log(e)
  }); // start polling the USB for data event to fire

  // when new data comes in a data event will be fired on the receive endpoint
  device.device.interfaces[0].endpoints[1].on("data", function (dataBuf) {
    let dataArr = Array.prototype.slice.call(new Uint8Array(dataBuf, 0, 8)); // convert buffer to array
    if (dataArr.length) {
      console.log(`data byte 3 is ${dataArr[3]}`); // print data byte 3
    }

  })


})
setTimeout(p => {
  const EOL = String.fromCharCode(4);
  const DLE = String.fromCharCode(16);
  const ST1 = String.fromCharCode(1);

  printer.text(EOL + DLE + ST1)
  console.log("Ya")
  printer.text("Hola Mundo!").close()
}, 2000)

return */

/* device.open(function (error) {
  printer
    .text('hola')
    .cut()
    .close()


}); */



/* var SerialPort = require('serialport');

let impresora = new SerialPort("COM8", {
  baudRate: 38400,
  parity: "none",
  dataBits: 8,
  stopBits: 1,
  autoOpen: false
});
//let st = String.fromCharCode(16) + String.fromCharCode(14) + String.fromCharCode(1)
impresora.on("open", function () {
  console.log("Abierto");
});
impresora.on("close", function () {
  console.log("Cerrado");
});
impresora.on("data", function (data) {
  console.log("Data:", data);
});
impresora.on("error", function (data) {
  console.log("error", data);
});


const esc = String.fromCharCode(27);
const ff = String.fromCharCode(12);
impresora.open()
impresora.write("hola Mundo!")
impresora.close() */
/* 
const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;
let printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: "\\\\" + hostname + "\\Termica",
});

printer.isPrinterConnected().then(f => {
  if (f) {
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
  } else {
    console.log("Impresora desconectada")
  }
}) */



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

listarDispositivos()
wsServer.on("request", function (request) {
  connection = request.accept(null, request.origin);

  if (dispositivosConectados) {
    desconectarDispositivos(dispositivosConectados);
  }
  setTimeout(() => {
    dispositivosConectados = conectarDispositivos(connection, dispositivos);
  }, 1000);

  connection.on("message", async function (message) {
    let mensaje = JSON.parse(message.utf8Data);
    console.log(mensaje);

    switch (mensaje.periferico) {
      case "impresora":
        if (mensaje.comando == "status") {
          let isConnected = await printer.isPrinterConnected();
          if (!isConnected) {
            connection.sendUTF(
              JSON.stringify({
                periferico: "impresora",
                comando: "info",
                data: "no se encuentra o sin papel"
              })
            );
          }
          return
        }

        if (mensaje.comando == "print") {
          let isConnected = await printer.isPrinterConnected();
          if (!isConnected) {
            connection.sendUTF(
              JSON.stringify({
                periferico: "impresora",
                comando: "info",
                data: "no se encuentra o sin papel"
              })
            );
            return
          }
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
        break;

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