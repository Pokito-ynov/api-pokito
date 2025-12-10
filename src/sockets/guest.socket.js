import * as guestsService from '../services/guests.service.js';

export const registerGuestHandlers = (io, socket) => {
  socket.on('guest:join', ({ pseudo, avatar }) => {
    if (guestsService.isGuestPseudoTaken(pseudo)) {
      socket.emit('guest:error', { message: 'Pseudo already taken' });
      return;
    }

    const guest = guestsService.addGuest(socket.id, pseudo, avatar);
    socket.emit('guest:joined', { socketId: socket.id, pseudo, avatar });
    console.log(`Guest joined: ${pseudo} (${socket.id})`);
  });

  socket.on('disconnect', () => {
    const guest = guestsService.removeGuest(socket.id);
    if (guest && guest.tableId) {
      const playersInTable = guestsService.getGuestsByTable(guest.tableId);
      io.to(guest.tableId).emit('table:players', { players: playersInTable });
    }
    console.log(`Guest disconnected: ${socket.id}`);
  });
};

