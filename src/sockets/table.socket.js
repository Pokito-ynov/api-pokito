import * as guestsService from '../services/guests.service.js';
import * as tablesService from '../services/tables.service.js';

export const registerTableHandlers = (io, socket) => {
  socket.on('table:create', async ({ type, joueursMax }) => {
    const { data: table, error } = await tablesService.create({ type, joueursMax });

    if (error) {
      socket.emit('table:error', { message: error.message });
      return;
    }

    guestsService.joinTable(socket.id, table.id);
    socket.join(table.id);

    socket.emit('table:created', { table });
    console.log(`Table created: ${table.code} (${table.id})`);
  });

  socket.on('table:join', async ({ tableId, code }) => {
    let table;

    if (tableId) {
      const { data, error } = await tablesService.getById(tableId);
      if (error) {
        socket.emit('table:error', { message: 'Table not found' });
        return;
      }
      table = data;
    } else if (code) {
      const { data, error } = await tablesService.getByCode(code);
      if (error) {
        socket.emit('table:error', { message: 'Table not found' });
        return;
      }
      table = data;
    } else {
      socket.emit('table:error', { message: 'Table ID or code required' });
      return;
    }

    const playersInTable = guestsService.getGuestsByTable(table.id);
    if (playersInTable.length >= table.joueurs_max) {
      socket.emit('table:error', { message: 'Table is full' });
      return;
    }

    guestsService.joinTable(socket.id, table.id);
    socket.join(table.id);

    const updatedPlayers = guestsService.getGuestsByTable(table.id);
    io.to(table.id).emit('table:players', { players: updatedPlayers });
    socket.emit('table:joined', { table });
    console.log(`Player joined table: ${table.code}`);
  });

  socket.on('table:leave', ({ tableId }) => {
    const guest = guestsService.leaveTable(socket.id);
    socket.leave(tableId);

    const playersInTable = guestsService.getGuestsByTable(tableId);
    io.to(tableId).emit('table:players', { players: playersInTable });
    socket.emit('table:left', { tableId });
    console.log(`Player left table: ${tableId}`);
  });

  socket.on('table:players', ({ tableId }) => {
    const players = guestsService.getGuestsByTable(tableId);
    socket.emit('table:players', { players });
  });
};

