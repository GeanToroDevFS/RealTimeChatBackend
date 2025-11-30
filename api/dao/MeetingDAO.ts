/**
 * MeetingDAO
 *
 * Data Access Object responsible for CRUD operations on the "meetings" collection in Firestore.
 * This class encapsulates Firestore interactions for meeting metadata (no messages or participants stored).
 */

import { db } from '../config/firebase';
import { Meeting, MeetingCreate } from '../models/Meeting';

/**
 * MeetingDAO class for Firestore operations on meetings.
 */
export class MeetingDAO {
  /**
   * Create a new meeting document in Firestore.
   *
   * Generates a new document with an auto-generated ID, stores creatorId, status, and createdAt.
   *
   * @param {MeetingCreate} meetingData - Data required to create a meeting (creatorId).
   * @returns {Promise<Meeting>} The created Meeting object (includes generated id).
   */
  async createMeeting(meetingData: MeetingCreate): Promise<Meeting> {
    console.log('🔹 [MEETINGDAO] Creando reunión en Firestore...');
    const docRef = db.collection('meetings').doc();
    const meeting: Meeting = {
      id: docRef.id,
      creatorId: meetingData.creatorId,
      status: 'active',
      createdAt: new Date(),
    };
    await docRef.set({
      creatorId: meeting.creatorId,
      status: meeting.status,
      createdAt: meeting.createdAt,
    });
    console.log('✅ [MEETINGDAO] Reunión creada correctamente');
    return meeting;
  }

  /**
   * Retrieve a meeting by its Firestore document ID.
   *
   * @param {string} id - Firestore document ID of the meeting.
   * @returns {Promise<Meeting | null>} The Meeting object if found, otherwise null.
   */
  async getMeetingById(id: string): Promise<Meeting | null> {
    console.log(`🔹 [MEETINGDAO] Buscando reunión por ID: ${id}`);
    const doc = await db.collection('meetings').doc(id).get();
    if (!doc.exists) {
      console.log('⚠️ [MEETINGDAO] Reunión no encontrada');
      return null;
    }
    const data = doc.data()!;
    console.log('✅ [MEETINGDAO] Reunión encontrada');
    return {
      id: doc.id,
      creatorId: data.creatorId,
      status: data.status,
      createdAt: data.createdAt.toDate(),
    };
  }

  /**
   * Update a meeting's status (e.g., mark as 'ended').
   *
   * @param {string} id - Firestore document ID of the meeting.
   * @param {string} status - New status ('active' or 'ended').
   * @returns {Promise<void>} Resolves when update completes.
   */
  async updateMeetingStatus(id: string, status: 'active' | 'ended'): Promise<void> {
    console.log(`🔹 [MEETINGDAO] Actualizando estado de reunión: ${id} a ${status}`);
    await db.collection('meetings').doc(id).update({ status });
    console.log('✅ [MEETINGDAO] Estado de reunión actualizado');
  }

  /**
   * Delete a meeting document from Firestore.
   *
   * @param {string} id - Firestore document ID of the meeting.
   * @returns {Promise<void>} Resolves when deletion completes.
   */
  async deleteMeeting(id: string): Promise<void> {
    console.log(`🔹 [MEETINGDAO] Eliminando reunión: ${id}`);
    await db.collection('meetings').doc(id).delete();
    console.log('✅ [MEETINGDAO] Reunión eliminada');
  }
}
