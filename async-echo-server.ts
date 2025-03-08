import { createServer, Socket } from 'net'

type TCPConnection = {
    socket: Socket,
    reader: null | {
        resolve: (value: Buffer) => void,
        reject: (reason: Error) => void
    },
    ended: boolean,
    error: null | Error
}

function socketInit(socket: Socket): TCPConnection {
    const connection: TCPConnection = {
        socket,
        reader: null,
        ended: false,
        error: null
    }

    socket.on('data', (data: Buffer) => {
        connection.socket.pause()
        connection.reader.resolve(data)
        connection.reader = null
    })

    socket.on('end', () => {
        connection.ended = true

        if (connection.reader) {
            connection.reader.resolve(Buffer.from(''))
            connection.reader = null
        }
    })

    socket.on('error', (error) => {
        connection.error = error

        if (connection.reader) {
            connection.reader.reject(error)
            connection.reader = null
        }
    })

    return connection
}

function socketRead(connection: TCPConnection): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        if (connection.ended) {
            resolve(Buffer.from(''))
            return
        }

        if (connection.error) {
            reject(connection.error)
            return
        }

        connection.reader = { resolve, reject }
        connection.socket.resume()
    })
}

function socketWrite(connection: TCPConnection, data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
        if (connection.error) {
            reject(connection.error)
            return
        }

        connection.socket.write(data, (error) => {
            if (error) {
                reject(error)
                return
            }

            resolve()
        })

    })

}

async function handleNewConnection(socket: Socket): void {
    try {
        await serveClient(socket)
    } catch (exception) {
        console.error(exception)
    } finally {
        socket.destroy()
    }
}

async function serveClient(socket: Socket): Promise<void> {
   const connection = await socketInit(socket)
   while(true) {
       const data = await socketRead(connection)

       if(data.length === 0) {
           console.log('end connection')
           break;
       }

       console.log({ data: data.toString() })
       await socketWrite(connection, data)
   }
}

const server = createServer({ pauseOnConnect: true })
server.on('connection', handleNewConnection)
server.on('error', (e: Error) => { throw e })
server.listen({ host: '127.0.0.1', port: 2025 })
