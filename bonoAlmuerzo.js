const TEST = true
exports.imprimirBono = (printer, mensaje) => {

    if (!TEST) {
        const hoy = new Date()
        const fecha = hoy.getDay().toString().padStart(2, "0") + "/" + (hoy.getMonth() + 1).toString().padStart(2, "0") + "/" + hoy.getFullYear().toString()
        const hora = hoy.getHours().toString().padStart(2, "0") + ":" + hoy.getMinutes().toString().padStart(2, "0")
        const ESC = String.fromCharCode(27);
        const C39 = String.fromCharCode(39);


        //printer.drawLine()
        printer.text(ESC + "t" + C39) // seleccionado el codec ISO-8859-2
        printer.control("lf")
        printer.align("ct")
        printer.text("|X|")
        printer.control("lf")
        printer.align("ct")
        printer.text("Comprobante no válido como factura", 'ISO-8859-2')
        printer.control("lf")
        printer.control("lf")

        printer.tableCustom(
            [{
                    text: "Fecha",
                    align: "LEFT"
                },
                {
                    text: fecha,
                    align: "RIGHT"
                }
            ], {
                encoding: 'ISO-8859-2'
            }
        )
        printer.control("lf")

        printer.tableCustom(
            [{
                    text: "Hora",
                    align: "LEFT"
                },
                {
                    text: hora,
                    align: "RIGHT"
                }
            ], {
                encoding: 'ISO-8859-2'
            }
        )
        printer.control("lf")
        printer.tableCustom(
            [{
                    text: "Usuario Nro.",
                    align: "LEFT"
                },
                {
                    text: mensaje.subComando.usuario,
                    align: "RIGHT"
                }
            ], {
                encoding: 'ISO-8859-2'
            }
        )
        printer.control("lf")

        printer.tableCustom(
            [{
                    text: "Nombre",
                    align: "LEFT"
                },
                {
                    text: mensaje.subComando.nombre,
                    align: "RIGHT"
                }
            ], {
                encoding: 'ISO-8859-2'
            }
        )
        printer.control("lf")

        printer.tableCustom(
            [{
                    text: "Pedido para el día",
                    align: "LEFT"
                },
                {
                    text: mensaje.subComando.fecha,
                    align: "RIGHT"
                }
            ], {
                encoding: 'ISO-8859-2'
            }
        )
        printer.control("lf")

        printer.control("lf")
        printer.align("ct")
        printer.size(1, 1)
        printer.text(mensaje.subComando.descripcion, 'ISO-8859-2');
        printer.size(0, 0)
        printer.control("lf")
        printer.control("lf")
        printer.align("ct")
        printer.size(2, 2)
        printer.text(mensaje.subComando.numero, 'ISO-8859-2')
        printer.size(0, 0)
        printer.control("lf")
        printer.align("ct")
        printer.text("Presentar para retirar", 'ISO-8859-2')
        printer.control("lf")
        //printer.drawLine()
        printer.cut()
        printer.close()
    }
}