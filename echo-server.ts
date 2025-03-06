import { createServer, Socket } from 'net'

const server = createServer()
server.on('error', (e: Error) => { throw e })
server.listen({ host: '127.0.0.1', port: 2025 })
