const net = require("net");
const IP = "10.1.6.61" //IP donde esta el servidor de Bugs
const PORT = 4000 //PORT del servidor Bugs

exports.crearSocket = (connection) => {
    const client = new net.Socket();

    client.on("data", (data) => {
        console.log("data received");
        connection.sendUTF(data);

    });
    client.on("close", () => {
        console.log("Closed");
        client.destroy();
        client = new net.Socket();
        response.end("Connection closed");
    });

    client.connect(PORT, IP, () => {
        console.log("Connected");
        connection.sendUTF("Connectado al " + IP + " port " + PORT);
    });

    return client
}