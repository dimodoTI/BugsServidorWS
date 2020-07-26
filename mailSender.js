var nodemailer = require('nodemailer');
const fs = require("fs")

let reintents = 0
let interval = null

const activeMailSender = (config) => {
    const delay = (60 - (new Date()).getMinutes()) * 60 * 1000
    setTimeout(verifyHour, delay, config)
}

const verifyHour = (config) => {
    if (config.hour == (new Date()).getHours()) {
        getAttachmentsAndSendMail(config)
        interval = setInterval(getAttachmentsAndSendMail, 1000 * 60 * config.interval, config)
    }
}

const getAttachmentsAndSendMail = (config) => {
    try {
        reintents++
        if (reintents > config.intents) {
            clearInterval(interval)
            return
        }

        let attachments = []
        fs.readdirSync(config.sourceFolder).forEach(file => {
            attachments.push({
                fileName: file,
                path: config.sourceFolder + "/" + file
            })
        });
        config.attachments = attachments
        if (attachments.length > 0) {
            trySendMail(config)
        }

    } catch (err) {

        console.log(err)

    }
}


const trySendMail = (config) => {
    let transporter = nodemailer.createTransport({
        host: config.host,
        secure: false,
        tls: {
            rejectUnauthorized: false
        },
        auth: {
            user: config.user,
            pass: config.password
        }
    });

    let mailOptions = {
        from: config.from,
        to: config.to,
        subject: "BUGS - Sistemas de Almuerzos",
        text: "Archivos del día :" + (new Date()).toLocaleDateString(),
        attachments: config.attachments
    };


    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            throw error
        } else {
            console.log('Email sent: ' + info.response);
            config.attachments.forEach((attachment) => {
                fs.rename(attachment.path, config.backupFolder + "/" + attachment.fileName, (err) => {
                    if (err) throw err

                })
            })

        }
    });

}

module.exports = exports = activeMailSender;