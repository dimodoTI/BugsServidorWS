const SerialPort = require("serialport");
let intervalo = 0
exports.conectarDispositivos = (connection, dispositivos) => {

    const resultado = {};
    dispositivos.forEach((dispositivo) => {
        if (dispositivo.config.conectado) {
            let sPort = new SerialPort("COM" + dispositivo.config.com, {
                baudRate: dispositivo.config.velocidad,
                dataBits: dispositivo.config.datos,
                parity: dispositivo.config.paridad,
                stopBits: dispositivo.config.parada,
                rtscts: dispositivo.config.rtscts
            });
            sPort.on("error", function (err) {
                // connection.sendUTF("#" + conf.dispositivo + "#" + "Error: " + err.mensaje);
                connection.sendUTF(JSON.stringify({
                    periferico: dispositivo.nombre,
                    comando: "info",
                    data: encodeURIComponent(err)
                }));
                console.log(err);
            });
            sPort.on("open", function () {
                console.log(dispositivo.nombre, "Abierto");
                clearInterval(intervalo)
                connection.sendUTF(JSON.stringify({
                    periferico: dispositivo.nombre,
                    comando: "info",
                    data: encodeURIComponent(",conectado,1" + String.fromCharCode(parseInt("10", 16)))
                }));
            });
            sPort.on("close", function () {
                console.log(dispositivo.nombre, "Cerrado");
                connection.sendUTF(JSON.stringify({
                    periferico: dispositivo.nombre,
                    comando: "info",
                    data: encodeURIComponent(",desconectado,9" + String.fromCharCode(parseInt("10", 16)))
                }));
                clearInterval(intervalo)
                intervalo = setInterval(() => {
                    sPort.open();
                }, 1000);
            });
            sPort.on("data", function (data) {
                console.log("Data:", data);
                //connection.sendUTF("#" + dispositivo.nombre + "#" + data);
                connection.sendUTF(JSON.stringify({
                    periferico: dispositivo.nombre,
                    comando: "info",
                    data: encodeURIComponent(data)
                }));
            });

            resultado[dispositivo.nombre] = sPort;
        }
    });

    return resultado;
};

exports.desconectarDispositivos = (dispositivosConectados) => {
    Object.keys(dispositivosConectados).forEach((prop) => {
        dispositivosConectados[prop].close()
        dispositivosConectados[prop] = null
        console.log("cerrando " + prop);
    })
};

exports.listarDispositivos = () => {
    SerialPort.list().then(
        ports => {
            ports.forEach(port => {
                console.log(`${port.path}\t${port.pnpId || ''}\t${port.manufacturer || ''}`)
            })
        },
        err => {
            console.error('Error listing ports', err)
        }
    )
}