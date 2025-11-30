"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const meetingRoutes_1 = __importDefault(require("./routes/meetingRoutes"));
const chatService_1 = require("./services/chatService");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'https://frontend-real-time.vercel.app', // Fallback a la URL de Vercel
        methods: ['GET', 'POST'],
    },
});
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'https://frontend-real-time.vercel.app', // Fallback a la URL de Vercel
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/api', meetingRoutes_1.default);
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
app.use((err, req, res, next) => {
    console.error('💥 [ERROR] Error no manejado:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});
// Initialize chat service
(0, chatService_1.initializeChat)(io);
// Start server
server.listen(PORT, () => {
    console.log(`🌐 [STARTUP] Servidor de chat corriendo en puerto ${PORT}`);
    console.log(`🔍 [STARTUP] Debug disponible en: http://localhost:${PORT}/debug`);
});
