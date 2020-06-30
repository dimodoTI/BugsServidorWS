const helpers = require("./helpers.js")

const fs = require("fs")

let config = fs.readFileSync("config.json");

const mkey = helpers.encrypt(config);

fs.writeFile("./bugs.License", mkey, null, (err) => {
    if (err) {
        console.log(err)
    } else {
        console.log("licencia generada!!")
    }
})