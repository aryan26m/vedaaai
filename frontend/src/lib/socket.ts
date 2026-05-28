import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function joinAssignment(assignmentId: string) {
  const s = getSocket();
  s.emit('join:assignment', assignmentId);
}

export function leaveAssignment(assignmentId: string) {
  const s = getSocket();
  s.emit('leave:assignment', assignmentId);
}
