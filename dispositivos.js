const SerialPort = require("serialport");

exports.conectarDispositivos = (connection, dispositivos) => {
    const resultado = {};
    dispositivos.forEach((dispositivo) => {
        if (dispositivo.config.conectado) {
            let sPort = new SerialPort("COM" + dispositivo.config.com, {
                baudRate: dispositivo.config.velocidad,
                dataBits: dispositivo.config.datos,
                parity: dispositivo.config.paridad,
                stopBits: dispositivo.config.parada,
                rtscts: dispositivo.config.rtscts,
            });
            sPort.on("error", function (err) {
                // connection.sendUTF("#" + conf.dispositivo + "#" + "Error: " + err.mensaje);
                console.log(err);
            });
            sPort.on("open", function () {
                console.log(dispositivo.nombre, "Abierto");
            });
            sPort.on("data", function (data) {
                console.log("Data:", data);
                connection.sendUTF("#" + dispositivo.nombre + "#" + data);
            });

            resultado[dispositivo.nombre] = sPort;
        }
    });

    return resultado;
};

exports.desconectarDispositivos = (dispositivosConectados) => {
    Object.entries(dispositivosConectados).forEach((nombre, dispositivo => {
        dispositivo.close()
        dispositivo = null
        console.log("cerrando " + nombre);
    }))
};