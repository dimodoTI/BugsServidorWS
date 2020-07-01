const helpers = require("./helpers.js")
const macaddress = require('macaddress');
const {
  getJsonFile,
  saveLog
} = require("./helpers.js");
let licencia = null;
let config = null

try {
  licencia = helpers.decrypt(helpers.getFile("./bugs.license"))
  config = JSON.parse(licencia)
} catch {
  console.log("Licencia corrupta!!!")
  return
}

macaddress.all().then((all) => {
  console.log(JSON.stringify(all, null, 2));
  if (!all[config.macaddress.titulo]) throw "licencia caduca (name)"
  if (all[config.macaddress.titulo][config.macaddress.subtitulo] != config.macaddress.value) {
    throw "licencia caduca (value)"
  }
  iniciar()
}).catch(err => {
  console.log(err)
  return
});

const iniciar = () => {

  const escpos = require('escpos');
  const {
    exception
  } = require("console");
  escpos.USB = require('escpos-usb');
  const dispositivos = config.dispositivos
  const conectarDispositivos = require("./dispositivos").conectarDispositivos;
  const desconectarDispositivos = require("./dispositivos").desconectarDispositivos;
  const listarDispositivos = require("./dispositivos").listarDispositivos
  const impresoraConfig = require("./dispositivos").getDispositivosUsb(dispositivos, "impresora")
  const server = require("./httpServer.js").server;
  const WebSocketServer = require("websocket").server;
  const crearSocket = require("./socket.js").crearSocket;
  const abrirImpresora = require("./dispositivosUSB").abrirImpresora;
  const testOnline = require("./dispositivosUSB").testOnline;
  const imprimirBono = require("./dispositivosUSB").imprimirBono

  let dispositivosConectados = null;
  let socket = null;
  let connection = null

  const wsServer = new WebSocketServer({
    httpServer: server,
  });

  listarDispositivos()



  wsServer.on("request", function (request) {
    connection = request.accept(null, request.origin);
    if (impresoraConfig) abrirImpresora(connection, impresoraConfig.impresora.VID, impresoraConfig.impresora.PID)
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
            testOnline(connection)
          }
          if (mensaje.comando == "print") {
            imprimirBono(mensaje)
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
          if (mensaje.comando == "getJsonFile") {
            const resultado = getJsonFile(mensaje.subComando)
            connection.sendUTF(
              JSON.stringify({
                periferico: "aplicacion",
                comando: mensaje.comando,
                subComando: mensaje.subComando,
                data: resultado,
              })
            );
          }
          if (mensaje.comando == "saveLog") {
            saveLog(mensaje.subComando.path, mensaje.subComando.data, mensaje.subComando.separador)
          }


          break;
      }
    });
    connection.on("close", function (reasonCode, description) {
      console.log("Client has disconnected.");
    });
  });
}




/* 
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

      setInterval(e => {
        device.write(DLE + EOT + ST4, evt => {
          //console.log(evt)
        })
      }, 2000) 
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
 */

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