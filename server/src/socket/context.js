let ioInstance = null;

export function registerSocketServer(io) {
  ioInstance = io;
}

export function getSocketServer() {
  if (!ioInstance) {
    throw new Error("Socket server not registered yet.");
  }
  return ioInstance;
}

export function publicTournamentRoom(tournamentId) {
  return `public:tournament:${tournamentId}`;
}

export function emitPublicTournamentEvent(tournamentId, event, payload) {
  const io = getSocketServer();
  io.to(publicTournamentRoom(tournamentId)).emit(event, payload);
}
