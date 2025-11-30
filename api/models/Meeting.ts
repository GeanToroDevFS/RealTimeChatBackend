/**
 * Represents a meeting in the system.
 *
 * @interface Meeting
 * @property {string} id - Unique identifier for the meeting (Firestore document ID).
 * @property {string} creatorId - ID of the user who created the meeting.
 * @property {string} status - Status of the meeting ('active', 'ended').
 * @property {Date} createdAt - Timestamp when the meeting was created.
 */
export interface Meeting {
  id: string;
  creatorId: string;
  status: 'active' | 'ended';
  createdAt: Date;
}

/**
 * Payload required to create a new meeting.
 *
 * @interface MeetingCreate
 * @property {string} creatorId - ID of the user creating the meeting.
 */
export interface MeetingCreate {
  creatorId: string;
}
