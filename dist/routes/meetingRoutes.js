"use strict";
/**
 * Meeting routes module for chat server.
 *
 * Exposes HTTP routes for meeting management (create, get, end). These are protected by authenticateToken.
 * Used for REST operations on meetings, while chat is handled via Socket.IO.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MeetingDAO_1 = require("../dao/MeetingDAO");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
const meetingDAO = new MeetingDAO_1.MeetingDAO();
/**
 * POST /meetings
 *
 * Protected route.
 * Creates a new meeting and stores it in Firestore.
 *
 * Expected body: None (creatorId from token).
 * Responses:
 *  - 201: Meeting created (returns meeting data)
 *  - 401: Unauthorized
 *  - 500: Server error
 */
router.post('/meetings', auth_1.authenticateToken, async (req, res) => {
    try {
        const creatorId = req.user?.userId;
        if (!creatorId)
            return res.status(401).json({ error: 'Usuario no autenticado' });
        const meeting = await meetingDAO.createMeeting({ creatorId });
        res.status(201).json({ meeting });
    }
    catch (error) {
        console.error('💥 [MEETINGS] Error creando reunión:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
/**
 * GET /meetings/:id
 *
 * Protected route.
 * Retrieves a meeting by ID.
 *
 * Responses:
 *  - 200: Meeting data
 *  - 401: Unauthorized
 *  - 404: Meeting not found
 *  - 500: Server error
 */
router.get('/meetings/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const meeting = await meetingDAO.getMeetingById(req.params.id);
        if (!meeting)
            return res.status(404).json({ error: 'Reunión no encontrada' });
        res.json({ meeting });
    }
    catch (error) {
        console.error('💥 [MEETINGS] Error obteniendo reunión:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
/**
 * PUT /meetings/:id/end
 *
 * Protected route.
 * Ends a meeting by updating its status to 'ended'.
 *
 * Responses:
 *  - 200: Meeting ended
 *  - 401: Unauthorized
 *  - 500: Server error
 */
router.put('/meetings/:id/end', auth_1.authenticateToken, async (req, res) => {
    try {
        await meetingDAO.updateMeetingStatus(req.params.id, 'ended');
        res.json({ message: 'Reunión finalizada' });
    }
    catch (error) {
        console.error('💥 [MEETINGS] Error finalizando reunión:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
exports.default = router;
