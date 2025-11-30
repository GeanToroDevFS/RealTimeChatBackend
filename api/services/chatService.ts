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

// Mapa para rastrear conexiones: socket.id -> { userId, name, meetingId }
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
      
      // Verificar si el usuario ya está registrado (para evitar duplicados en reconexiones)
      const alreadyJoined = Array.from(connectedUsers.values()).some(u => u.userId === userId && u.meetingId === meetingId);
      if (!alreadyJoined) {
        // Registrar en el mapa
        connectedUsers.set(socket.id, { userId, name, meetingId });
        // Emitir a todos en la sala (excepto el que se une) que un usuario se unió
        socket.to(meetingId).emit('user-joined', { userId, name });
        console.log(`✅ [CHAT] Usuario ${socket.id} unido a sala: ${meetingId}`);
      } else {
        console.log(`⚠️ [CHAT] Usuario ${userId} ya estaba en la sala ${meetingId}, reconexión detectada`);
      }
      
      socket.emit('joined', `Unido a reunión ${meetingId}`);
    });

    // Handle chat messages (sin cambios)
    socket.on('send-message', (data: { meetingId: string; message: string; author: string }) => {
      console.log(`💬 [CHAT] Mensaje en ${data.meetingId} de ${data.author}: ${data.message}`);
      // Emit to all in the room except sender
      socket.to(data.meetingId).emit('receive-message', {
        author: data.author,
        text: data.message,
        timestamp: new Date(),
      });
    });

    // Leave meeting (sin cambios)
    socket.on('leave-meeting', (meetingId: string) => {
      socket.leave(meetingId);
      console.log(`🚪 [CHAT] Usuario ${socket.id} salió de reunión: ${meetingId}`);
    });

    // Notify meeting ended (sin cambios)
    socket.on('end-meeting', (meetingId: string) => {
      console.log(`🏁 [CHAT] Reunión ${meetingId} terminada por creador`);
      // Emit to all in the room
      io.to(meetingId).emit('meeting-ended', 'La reunión ha terminado.');
    });

    // Handle disconnect: Emitir user-left y terminar reunión si está vacía
    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        const { userId, name, meetingId } = userData;
        console.log(`🔌 [CHAT] Usuario desconectado: ${socket.id} (${name})`);
        
        // Emitir a todos en la sala que el usuario salió
        socket.to(meetingId).emit('user-left', { userId });
        
        // Remover del mapa
        connectedUsers.delete(socket.id);
        
        // Verificar si la sala está vacía y terminar la reunión automáticamente
        const room = io.sockets.adapter.rooms.get(meetingId);
        if (!room || room.size === 0) {
          console.log(`🏁 [CHAT] Sala ${meetingId} vacía, terminando reunión automáticamente`);
          meetingDAO.updateMeetingStatus(meetingId, 'ended').catch(err => console.error('Error terminando reunión:', err));
        }
      } else {
        console.log(`🔌 [CHAT] Usuario desconectado: ${socket.id} (sin datos registrados)`);
      }
    });
  });
};