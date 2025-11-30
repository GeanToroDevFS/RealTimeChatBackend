/**
 * Chat service using Socket.IO for real-time messaging in meetings.
 *
 * This service handles Socket.IO connections, room management for meetings,
 * and emits messages. It integrates with MeetingDAO to validate meetings.
 * Messages are not persisted; only real-time emission.
 * Now also tracks participants per meeting and emits join/leave events.
 */

import { Server as SocketIOServer } from 'socket.io';
import { MeetingDAO } from '../dao/MeetingDAO';
import jwt from 'jsonwebtoken';  // Asumiendo que usas JWT para tokens

const meetingDAO = new MeetingDAO();

// Map para trackear participantes por reunión: meetingId -> [{id, name}]
const participantsByMeeting = new Map<string, { id: string; name: string }[]>();

/**
 * Initialize Socket.IO for chat functionality.
 *
 * @param {SocketIOServer} io - The Socket.IO server instance.
 */
export const initializeChat = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log(`🔗 [CHAT] Usuario conectado: ${socket.id}`);

    // Función para obtener usuario del token (ajustada para estructura típica de JWT)
    const getUserFromToken = () => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return null;
        // Decodificar token (ajusta según tu implementación; asumiendo user: { id, name })
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret') as any;
        return decoded.user || decoded;  // Si es { user: { id, name } }, usa decoded.user; si no, decoded directo
      } catch (err) {
        console.error('Error decodificando token:', err);
        return null;
      }
    };

    // Join a meeting room
    socket.on('join-meeting', async (meetingId: string) => {
      console.log(`🔹 [CHAT] Usuario ${socket.id} uniendo a reunión: ${meetingId}`);
      const user = getUserFromToken();
      if (!user || !user.id || !user.name) {
        socket.emit('error', 'Usuario no autenticado o datos incompletos');
        return;
      }

      const meeting = await meetingDAO.getMeetingById(meetingId);
      if (!meeting || meeting.status !== 'active') {
        socket.emit('error', 'Reunión no encontrada o inactiva');
        return;
      }

      socket.join(meetingId);

      // Agregar participante a la lista
      if (!participantsByMeeting.has(meetingId)) {
        participantsByMeeting.set(meetingId, []);
      }
      const participants = participantsByMeeting.get(meetingId)!;
      if (!participants.some(p => p.id === user.id)) {
        participants.push({ id: user.id, name: user.name });
      }

      // Emitir a todos en la sala (excepto el nuevo) que un nuevo participante se unió
      socket.to(meetingId).emit('new-participant', { id: user.id, name: user.name });

      socket.emit('joined', `Unido a reunión ${meetingId}`);
      console.log(`✅ [CHAT] Usuario ${socket.id} (${user.name}) unido a sala: ${meetingId}`);
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
      const user = getUserFromToken();
      if (user && participantsByMeeting.has(meetingId)) {
        const participants = participantsByMeeting.get(meetingId)!;
        const index = participants.findIndex(p => p.id === user.id);
        if (index !== -1) {
          participants.splice(index, 1);
          // Emitir a todos en la sala que un participante se fue
          io.to(meetingId).emit('participant-left', user.id);
        }
      }
      socket.leave(meetingId);
      console.log(`🚪 [CHAT] Usuario ${socket.id} salió de reunión: ${meetingId}`);
    });

    // Notify meeting ended
    socket.on('end-meeting', (meetingId: string) => {
      console.log(`🏁 [CHAT] Reunión ${meetingId} terminada por creador`);
      // Limpiar participantes
      participantsByMeeting.delete(meetingId);
      // Emit to all in the room
      io.to(meetingId).emit('meeting-ended', 'La reunión ha terminado.');
    });

    socket.on('disconnect', () => {
      // Al desconectar, remover de todas las reuniones donde esté
      for (const [meetingId, participants] of participantsByMeeting.entries()) {
        const user = getUserFromToken();
        if (user) {
          const index = participants.findIndex(p => p.id === user.id);
          if (index !== -1) {
            participants.splice(index, 1);
            // Emitir a todos en la sala que un participante se fue
            io.to(meetingId).emit('participant-left', user.id);
          }
        }
      }
      console.log(`🔌 [CHAT] Usuario desconectado: ${socket.id}`);
    });
  });
};