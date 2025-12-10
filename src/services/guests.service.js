import * as guestStore from '../stores/guestStore.js';

export const addGuest = (socketId, pseudo, avatar = null) => {
  guestStore.addGuest(socketId, pseudo, avatar);
  return guestStore.getGuest(socketId);
};

export const getGuest = (socketId) => {
  return guestStore.getGuest(socketId);
};

export const removeGuest = (socketId) => {
  const guest = guestStore.getGuest(socketId);
  guestStore.removeGuest(socketId);
  return guest;
};

export const getGuestsByTable = (tableId) => {
  return guestStore.getGuestsByTable(tableId);
};

export const joinTable = (socketId, tableId) => {
  guestStore.updateGuestTable(socketId, tableId);
  return guestStore.getGuest(socketId);
};

export const leaveTable = (socketId) => {
  guestStore.updateGuestTable(socketId, null);
  return guestStore.getGuest(socketId);
};

export const getAllGuests = () => {
  return guestStore.getAllGuests();
};

export const isGuestPseudoTaken = (pseudo) => {
  return !!guestStore.getGuestByPseudo(pseudo);
};

