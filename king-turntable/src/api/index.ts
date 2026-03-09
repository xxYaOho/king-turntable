const API_BASE = '';

export interface Member {
  clientId: string;
  displayName: string;
}

export interface RoomState {
  roomId: string;
  roomCode: string;
  expiresAt: number;
}

export interface JoinResult {
  state: string;
  memberCount: number;
  readyCount: number;
  myReady: boolean;
  members: Member[];
  error?: string;
}

export interface DrawResult {
  targetId?: string;
  targetDisplay?: string;
  oneTime?: boolean;
  alreadyDrawn?: boolean;
  error?: string;
}

export interface RevealResult {
  targetDisplay?: string;
  error?: string;
  reason?: string;
}

export interface StateResult {
  state: string;
  memberCount: number;
  readyCount: number;
  drawnCount: number;
  myReady?: boolean;
  myStatus?: string;
}

export const api = {
  async createRoom(): Promise<RoomState> {
    const res = await fetch(`${API_BASE}/api/room`, { method: 'POST' });
    return res.json();
  },

  async joinRoom(roomId: string, clientId: string, displayName: string): Promise<JoinResult> {
    const res = await fetch(`${API_BASE}/api/room/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, displayName }),
    });
    return res.json();
  },

  async setReady(roomId: string, clientId: string, ready: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/api/room/${roomId}/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, ready }),
    });
    return res.json();
  },

  async draw(roomId: string, clientId: string, idempotencyKey?: string): Promise<DrawResult> {
    const res = await fetch(`${API_BASE}/api/room/${roomId}/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, idempotencyKey }),
    });
    return res.json();
  },

  async reveal(roomId: string, clientId: string): Promise<RevealResult> {
    const res = await fetch(`${API_BASE}/api/room/${roomId}/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    return res.json();
  },

  async getState(roomId: string, clientId: string): Promise<StateResult> {
    const res = await fetch(`${API_BASE}/api/room/${roomId}/state?clientId=${clientId}`);
    return res.json();
  },
};
