/**
 * Chat service using Socket.IO for real-time messaging in meetings.
 *
 * This service handles Socket.IO connections, room management for meetings,
 * and emits messages. It integrates with MeetingDAO to validate meetings.
 * Messages are not persisted; only real-time emission.
 */

import { Server as SocketIOServer } from 'socket.io';
import { MeetingDAO } from '../dao/MeetingDAO';

const meetingDAO = new MeetingDAO();

/**
 * Initialize Socket.IO for chat functionality.
 *
 * @param {SocketIOServer} io - The Socket.IO server instance.
 */
export const initializeChat = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log(`🔗 [CHAT] Usuario conectado: ${socket.id}`);

    // Join a meeting room
    socket.on('join-meeting', async (meetingId: string) => {
      console.log(`🔹 [CHAT] Usuario ${socket.id} uniendo a reunión: ${meetingId}`);
      const meeting = await meetingDAO.getMeetingById(meetingId);
      if (!meeting || meeting.status !== 'active') {
        socket.emit('error', 'Reunión no encontrada o inactiva');
        return;
      }
      socket.join(meetingId);
      socket.emit('joined', `Unido a reunión ${meetingId}`);
      console.log(`✅ [CHAT] Usuario ${socket.id} unido a sala: ${meetingId}`);
    });

    // Handle chat messages
    socket.on('send-message', (data: { meetingId: string; message: string; author: string }) => {
      console.log(`💬 [CHAT] Mensaje en ${data.meetingId} de ${data.author}: ${data.message}`);
      // Emit to all in the room except sender
      socket.to(data.meetingId).emit('receive-message', {
        author: data.author,
        text: data.message,
        timestamp: new Date(),
      });
    });

    // Leave meeting
    socket.on('leave-meeting', (meetingId: string) => {
      socket.leave(meetingId);
      console.log(`🚪 [CHAT] Usuario ${socket.id} salió de reunión: ${meetingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [CHAT] Usuario desconectado: ${socket.id}`);
    });
  });
};
