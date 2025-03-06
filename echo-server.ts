import { createServer, Socket } from 'net'

const server = createServer()
server.on('connection', handleNewConnection)
server.on('error', (e: Error) => { throw e })
server.listen({ host: '127.0.0.1', port: 2025 })

function handleNewConnection(socket: Socket): void {
    const echoData = (data: Buffer): void => {
        socket.write(data)
    }
    socket.on("data", echoData);
}
