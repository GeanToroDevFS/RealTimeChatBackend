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

// Map for tracking connections: socket.id -> { userId, name, meetingId }
const connectedUsers = new Map<string, { userId: string; name: string; meetingId: string }>();

/**
 * Initialize Socket.IO for chat functionality.
 *
 * @param {SocketIOServer} io - The Socket.IO server instance.
 */
export const initializeChat = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log(`🔗 [CHAT] Usuario conectado: ${socket.id}`);

    // Join a meeting room
    socket.on('join-meeting', async (data: { meetingId: string; userId: string; name: string }) => {
      const { meetingId, userId, name } = data;
      console.log(`🔹 [CHAT] Usuario ${socket.id} (${name}, ${userId}) uniendo a reunión: ${meetingId}`);
      const meeting = await meetingDAO.getMeetingById(meetingId);
      if (!meeting || meeting.status !== 'active') {
        socket.emit('error', 'Reunión no encontrada o inactiva');
        return;
      }
      socket.join(meetingId);

      // Check if the user is already registered (to avoid duplicates in reconnections)
      const alreadyJoined = Array.from(connectedUsers.values()).some(u => u.userId === userId && u.meetingId === meetingId);
      if (!alreadyJoined) {
        // Register on the map
        connectedUsers.set(socket.id, { userId, name, meetingId });
        // Broadcast to the ENTIRE room (including the person joining) that a user has joined
        io.to(meetingId).emit('user-joined', { userId, name });
        console.log(`✅ [CHAT] Usuario ${socket.id} unido a sala: ${meetingId}`);
      } else {
        console.log(`⚠️ [CHAT] Usuario ${userId} ya estaba en la sala ${meetingId}, reconexión detectada`);
      }

      // Send the complete list of participants to the person joining (for initial synchronization)
      const participants = Array.from(connectedUsers.values())
        .filter(u => u.meetingId === meetingId)
        .map(u => ({ userId: u.userId, name: u.name }));
      socket.emit('participants-list', participants);

      socket.emit('joined', `Unido a reunión ${meetingId}`);
    });

    // Handle chat messages (no changes)
    socket.on('send-message', (data: { meetingId: string; message: string; author: string }) => {
      console.log(`💬 [CHAT] Mensaje en ${data.meetingId} de ${data.author}: ${data.message}`);
      console.log(`Mensaje de ${data.author} en ${data.meetingId}`);
      // Emit to all in the room except sender
      socket.to(data.meetingId).emit('receive-message', {
        author: data.author,
        text: data.message,
        timestamp: new Date(),
      });
    });

    // Leave meeting (no changes)
    socket.on('leave-meeting', (meetingId: string) => {
      socket.leave(meetingId);
      console.log(`🚪 [CHAT] Usuario ${socket.id} salió de reunión: ${meetingId}`);
    });

    // Notify meeting ended (no changes)
    socket.on('end-meeting', (meetingId: string) => {
      console.log(`🏁 [CHAT] Reunión ${meetingId} terminada por creador`);
      // Emit to all in the room
      io.to(meetingId).emit('meeting-ended', 'La reunión ha terminado.');
    });

    // Handle disconnect: Issue user-left and end meeting if empty
    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        const { userId, name, meetingId } = userData;
        console.log(`🔌 [CHAT] Usuario desconectado: ${socket.id} (${name})`);

        // Broadcast to the ENTIRE room that the user left
        io.to(meetingId).emit('user-left', { userId });

        //Remove from map
        connectedUsers.delete(socket.id);

        // Check if the room is empty and end the meeting automatically after 5 minutes
        const room = io.sockets.adapter.rooms.get(meetingId);
        if (!room || room.size === 0) {
          console.log(`🏁 [CHAT] Sala ${meetingId} vacía, terminando reunión automáticamente en 5 minutos`);
          setTimeout(async () => {
            // Check again if the room is still empty
            const roomAfterTimeout = io.sockets.adapter.rooms.get(meetingId);
            if (!roomAfterTimeout || roomAfterTimeout.size === 0) {
              await meetingDAO.updateMeetingStatus(meetingId, 'ended').catch(err => console.error('Error terminando reunión:', err));
              console.log(`🏁 [CHAT] Reunión ${meetingId} terminada por inactividad`);
            }
          }, 5 * 60 * 1000); // 5 minutes
        }
      } else {
        console.log(`🔌 [CHAT] Usuario desconectado: ${socket.id} (sin datos registrados)`);
      }
    });
  });
};