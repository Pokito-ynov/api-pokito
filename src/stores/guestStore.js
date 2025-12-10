const guests = new Map();

export const addGuest = (socketId, pseudo, avatar = null) => {
  guests.set(socketId, { socketId, pseudo, avatar, tableId: null });
};

export const getGuest = (socketId) => guests.get(socketId);

export const removeGuest = (socketId) => guests.delete(socketId);

export const getGuestsByTable = (tableId) => {
  return [...guests.values()].filter((g) => g.tableId === tableId);
};

export const updateGuestTable = (socketId, tableId) => {
  const guest = guests.get(socketId);
  if (guest) guest.tableId = tableId;
};

export const getAllGuests = () => [...guests.values()];

export const getGuestByPseudo = (pseudo) => {
  return [...guests.values()].find((g) => g.pseudo === pseudo);
};

