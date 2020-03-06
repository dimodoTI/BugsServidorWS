const url = 'ws://10.1.6.11:9000/'
const connection = new WebSocket(url)

connection.onopen = () => {
    connection.send('hey')
}

connection.onerror = (error) => {
    console.log(`WebSocket error: ${error}`)
}

connection.onmessage = (e) => {
    console.log(e.data)
}