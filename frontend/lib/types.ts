export type Role = 'host' | 'moderator' | 'participant';

export interface Participant {
  userId: string;
  username: string;
  role: Role;
}

export interface RoomState {
  roomId: string;
  userId: string;
  username: string;
  role: Role;
  videoId: string;
  playState: 'playing' | 'paused';
  currentTime: number;
  participants: Participant[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}
