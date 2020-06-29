const escpos = require('escpos');
escpos.USB = require('escpos-usb');
const imprimirBono = require("./bonoAlmuerzo").imprimirBono
let device
const options = {}
let eventoTest = null
let printer = null
let testeo = 0
const RECONECCION_CADA = 5000
const PING_ONLINE_CADA = 5000

exports.abrirImpresora = (connection, VID, PID) => {
    //device = new escpos.USB("1208", "3605");
    try {
        device = new escpos.USB(VID, PID);
    } catch {
        connection.sendUTF(
            JSON.stringify({
                periferico: "impresora",
                comando: "info",
                data: "off"
            })
        );
        setTimeout(_ => {
            this.abrirImpresora(connection, VID, PID)
        }, RECONECCION_CADA)
        return
    }


    printer = new escpos.Printer(device, options);

    device.on("connect", (evt) => {
        console.log("impresora prendida")
        connection.sendUTF(
            JSON.stringify({
                periferico: "impresora",
                comando: "info",
                data: "on"
            })
        );
    })
    device.on("disconnect", (evt) => {
        console.log("impresora apagada")
        connection.sendUTF(
            JSON.stringify({
                periferico: "impresora",
                comando: "info",
                data: "off"
            })
        );
        setTimeout(_ => {
            this.abrirImpresora(connection, VID, PID)
        }, RECONECCION_CADA)
        clearInterval(testeo)
    })

    device.open((dev) => {

        device.device.interfaces[0].claim(); // claim interface

        try {

            device.device.interfaces[0].endpoints[1].startPoll(1, 8)

            device.device.interfaces[0].endpoints[1].on("data", (dataBuf) => {
                let dataArr = Array.prototype.slice.call(new Uint8Array(dataBuf, 0, 8)); // convert buffer to array

                if (dataArr.length > 0) {
                    console.log(dataArr)
                    if (dataArr[0] == 22) {
                        clearTimeout(eventoTest)
                        connection.sendUTF(
                            JSON.stringify({
                                periferico: "impresora",
                                comando: "info",
                                data: "online"
                            })
                        );
                    }

                }

            })

            device.device.interfaces[0].endpoints[1].on("error", function (evt) {
                console.log(evt)
            })
            device.device.interfaces[0].endpoints[1].on("detach", function (evt) {
                console.log(evt)
            })

            testeo = setInterval(_ => {
                this.testOnline(connection)
            }, PING_ONLINE_CADA)
        } catch {
            console.log("pool activo")

        }
    })
}

exports.imprimirBono = (mensaje) => {
    imprimirBono(printer, mensaje)
}

exports.testOnline = (connection) => {
    const ESC = String.fromCharCode(27);
    const GS = String.fromCharCode(29);
    const DLE = String.fromCharCode(16);
    const EOT = String.fromCharCode(4);
    const ST1 = String.fromCharCode(1); //22
    const ST2 = String.fromCharCode(2); //18
    const ST3 = String.fromCharCode(3); //18
    const ST4 = String.fromCharCode(4); //18
    device.write(DLE + EOT + ST1, evt => {})
    eventoTest = setTimeout(() => connection.sendUTF(
        JSON.stringify({
            periferico: "impresora",
            comando: "info",
            data: "offline"
        })), 1000)
}