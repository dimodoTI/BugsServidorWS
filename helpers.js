const fs = require("fs")
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const ENCRYPTION_KEY = Buffer.from('YoCKddLseUuB4y344lKatr7XGo6tHs7i1Lm8qJH9jhs=', 'base64');
const IV_LENGTH = 16;

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
const getFile = (path) => {
    let output = {};
    try {

        output = fs.readFileSync(path, "utf8");
    } catch (e) {
        output = {};

        // console.log(e.message, e.stack);
    }
    return output;
};

const encrypt = (text) => {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

const decrypt = (text) => {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
const saveLog = (path, data, separador) => {
    fs.appendFile(path, data + separador, (err) => {
        if (err) throw err;
    });
}

const helpers = {
    getFile: getFile,
    getJsonFile: getJsonFile,
    encrypt: encrypt,
    decrypt: decrypt,
    saveLog: saveLog
}

module.exports = exports = helpers;