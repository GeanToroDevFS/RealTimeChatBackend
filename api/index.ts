/**
 * Main server entrypoint for the RealTime chat backend.
 *
 * This module:
 *  - Loads environment variables via dotenv.
 *  - Creates and configures an Express application with Socket.IO.
 *  - Applies global middleware (CORS, JSON body parser).
 *  - Mounts meeting routes under /api.
 *  - Initializes chat service with Socket.IO.
 *  - Exposes simple health and debug endpoints.
 *  - Starts the HTTP server on the configured PORT.
 *
 * Environment variables used:
 *  - PORT (optional): Port to listen on (defaults to 3001)
 *  - NODE_ENV: Environment name used in /debug response
 *  - FIREBASE_PROJECT_ID: Presence reported in /debug
 *  - FRONTEND_URL: Used by CORS
 *  - JWT_SECRET: For auth middleware
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import meetingRoutes from './routes/meetingRoutes';
import { initializeChat } from './services/chatService';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', meetingRoutes);

// Health check
app.get('/', (req, res) => {
  console.log('🚀 [HEALTH] Solicitud de health check');
  res.send('🚀 Backend de chat para RealTime funcionando correctamente.');
});

// Debug endpoint
app.get('/debug', (req, res) => {
  console.log('🔍 [DEBUG] Solicitud de información de debug');
  res.json({
    environment: process.env.NODE_ENV,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ No configurado',
    port: PORT,
    socketIo: '✅ Inicializado',
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 [ERROR] Error no manejado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Initialize chat service
initializeChat(io);

// Start server
server.listen(PORT, () => {
  console.log(`🌐 [STARTUP] Servidor de chat corriendo en puerto ${PORT}`);
  console.log(`🔍 [STARTUP] Debug disponible en: http://localhost:${PORT}/debug`);
});