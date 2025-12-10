import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { createSocketServer } from './config/socket.js';
import { registerGuestHandlers } from './sockets/guest.socket.js';
import { registerTableHandlers } from './sockets/table.socket.js';
import { registerGameHandlers } from './sockets/game.socket.js';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = createSocketServer(server);

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  registerGuestHandlers(io, socket);
  registerTableHandlers(io, socket);
  registerGameHandlers(io, socket);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

