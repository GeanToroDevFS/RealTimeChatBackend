"use strict";
/**
 * Chat service using Socket.IO for real-time messaging in meetings.
 *
 * This service handles Socket.IO connections, room management for meetings,
 * and emits messages. It integrates with MeetingDAO to validate meetings.
 * Messages are not persisted; only real-time emission.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeChat = void 0;
const MeetingDAO_1 = require("../dao/MeetingDAO");
const meetingDAO = new MeetingDAO_1.MeetingDAO();
// Mapa para rastrear conexiones: socket.id -> { userId, name, meetingId }
const connectedUsers = new Map();
/**
 * Initialize Socket.IO for chat functionality.
 *
 * @param {SocketIOServer} io - The Socket.IO server instance.
 */
const initializeChat = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔗 [CHAT] Usuario conectado: ${socket.id}`);
        // Join a meeting room
        socket.on('join-meeting', async (data) => {
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
                // Emitir a TODA la sala (incluyendo al que se une) que un usuario se unió
                io.to(meetingId).emit('user-joined', { userId, name });
                console.log(`✅ [CHAT] Usuario ${socket.id} unido a sala: ${meetingId}`);
            }
            else {
                console.log(`⚠️ [CHAT] Usuario ${userId} ya estaba en la sala ${meetingId}, reconexión detectada`);
            }
            // Enviar lista completa de participantes al que se une (para sincronización inicial)
            const participants = Array.from(connectedUsers.values())
                .filter(u => u.meetingId === meetingId)
                .map(u => ({ userId: u.userId, name: u.name }));
            socket.emit('participants-list', participants);
            socket.emit('joined', `Unido a reunión ${meetingId}`);
        });
        // Handle chat messages (sin cambios)
        socket.on('send-message', (data) => {
            console.log(`💬 [CHAT] Mensaje en ${data.meetingId} de ${data.author}: ${data.message}`);
            // Emit to all in the room except sender
            socket.to(data.meetingId).emit('receive-message', {
                author: data.author,
                text: data.message,
                timestamp: new Date(),
            });
        });
        // Leave meeting (sin cambios)
        socket.on('leave-meeting', (meetingId) => {
            socket.leave(meetingId);
            console.log(`🚪 [CHAT] Usuario ${socket.id} salió de reunión: ${meetingId}`);
        });
        // Notify meeting ended (sin cambios)
        socket.on('end-meeting', (meetingId) => {
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
                // Emitir a TODA la sala que el usuario salió
                io.to(meetingId).emit('user-left', { userId });
                // Remover del mapa
                connectedUsers.delete(socket.id);
                // Verificar si la sala está vacía y terminar la reunión automáticamente
                const room = io.sockets.adapter.rooms.get(meetingId);
                if (!room || room.size === 0) {
                    console.log(`🏁 [CHAT] Sala ${meetingId} vacía, terminando reunión automáticamente`);
                    meetingDAO.updateMeetingStatus(meetingId, 'ended').catch(err => console.error('Error terminando reunión:', err));
                }
            }
            else {
                console.log(`🔌 [CHAT] Usuario desconectado: ${socket.id} (sin datos registrados)`);
            }
        });
    });
};
exports.initializeChat = initializeChat;
