import * as guestsService from '../services/guests.service.js';

export const registerGuestHandlers = (io, socket) => {
  socket.on('guest:join', ({ pseudo, avatar, userId, activeAvatarId, activeCardSkinId }) => {
    if (guestsService.isGuestPseudoTaken(pseudo)) {
      socket.emit('guest:error', { message: 'Pseudo already taken' });
      return;
    }

    const guest = guestsService.addGuest(socket.id, pseudo, {
      avatar,
      userId,
      activeAvatarId,
      activeCardSkinId
    });
    socket.emit('guest:joined', {
      socketId: socket.id,
      pseudo,
      avatar,
      userId: guest.userId,
      activeAvatarId: guest.activeAvatarId,
      activeCardSkinId: guest.activeCardSkinId
    });
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

