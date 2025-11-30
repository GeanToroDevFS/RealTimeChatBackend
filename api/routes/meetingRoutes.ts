/**
 * Meeting routes module for chat server.
 *
 * Exposes HTTP routes for meeting management (create, get, end). These are protected by authenticateToken.
 * Used for REST operations on meetings, while chat is handled via Socket.IO.
 */

import express from 'express';
import { MeetingDAO } from '../dao/MeetingDAO';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();
const meetingDAO = new MeetingDAO();

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
router.post('/meetings', authenticateToken, async (req, res) => {
  try {
    const creatorId = (req as any).user?.userId;
    if (!creatorId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const meeting = await meetingDAO.createMeeting({ creatorId });
    res.status(201).json({ meeting });
  } catch (error: any) {
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
router.get('/meetings/:id', authenticateToken, async (req, res) => {
  try {
    const meeting = await meetingDAO.getMeetingById(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Reunión no encontrada' });
    res.json({ meeting });
  } catch (error: any) {
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
router.put('/meetings/:id/end', authenticateToken, async (req, res) => {
  try {
    await meetingDAO.updateMeetingStatus(req.params.id, 'ended');
    res.json({ message: 'Reunión finalizada' });
  } catch (error: any) {
    console.error('💥 [MEETINGS] Error finalizando reunión:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
