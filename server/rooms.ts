import Redis from 'ioredis';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Types
type RoomState = 'OPEN' | 'FROZEN' | 'DRAWING' | 'DONE' | 'DESTROYED';

interface Member {
  clientId: string;
  displayName: string;
  joinedAt: number;
}

interface RoomData {
  roomId: string;
  roomCode: string;
  state: RoomState;
  members: Member[];
  readySet: string[];
  drawersRemaining: string[];
  targetsRemaining: string[];
  assignments: Record<string, string>;
  revealed: string[];
  createdAt: number;
  expiresAt: number;
}

// Redis keys
const ROOM_PREFIX = 'room:';
const ROOM_TTL = 30 * 60 * 1000; // 30 minutes

export class RoomManager {
  private redis: Redis | null = null;
  private io: Server;
  private roomCache: Map<string, RoomData> = new Map();
  private useRedis: boolean = false;

  constructor(io: Server) {
    this.io = io;
    // Use Redis URL from environment or default to local
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Try to connect to Redis, fall back to memory if failed
    try {
      this.redis = new Redis(redisUrl);
      this.redis.on('error', (err) => {
        console.log('Redis not available, using in-memory mode');
        this.redis = null;
        this.useRedis = false;
      });
      this.redis.on('connect', () => {
        console.log('Connected to Redis');
        this.useRedis = true;
      });
    } catch {
      console.log('Redis not available, using in-memory mode');
    }
    
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredRooms(), 60 * 1000);
  }

  private getRoomKey(roomId: string): string {
    return `${ROOM_PREFIX}${roomId}`;
  }

  private async getRoom(roomId: string): Promise<RoomData | null> {
    // Check cache first
    if (this.roomCache.has(roomId)) {
      return this.roomCache.get(roomId)!;
    }

    // Try Redis if available
    if (this.useRedis && this.redis) {
      const data = await this.redis.get(this.getRoomKey(roomId));
      if (!data) return null;
      const room = JSON.parse(data) as RoomData;
      this.roomCache.set(roomId, room);
      return room;
    }

    return null;
  }

  private async saveRoom(room: RoomData): Promise<void> {
    this.roomCache.set(room.roomId, room);
    
    // Try Redis if available
    if (this.useRedis && this.redis) {
      await this.redis.setex(
        this.getRoomKey(room.roomId),
        ROOM_TTL / 1000,
        JSON.stringify(room)
      );
    }
  }

  createRoom(): { roomId: string; roomCode: string } {
    const roomId = uuidv4();
    const roomCode = this.generateRoomCode();
    
    const room: RoomData = {
      roomId,
      roomCode,
      state: 'OPEN',
      members: [],
      readySet: [],
      drawersRemaining: [],
      targetsRemaining: [],
      assignments: {},
      revealed: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + ROOM_TTL,
    };

    this.roomCache.set(roomId, room);
    // Don't save to Redis yet - only save when members join
    
    return { roomId, roomCode };
  }

  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async joinRoom(roomId: string, clientId: string, displayName: string) {
    let room = await this.getRoom(roomId);
    
    if (!room) {
      // Try to find by room code
      const cachedRoom = [...this.roomCache.values()].find(r => r.roomCode === roomId);
      if (cachedRoom) {
        room = cachedRoom;
        roomId = room.roomId;
      }
    }

    if (!room) {
      return null;
    }

    // Check if room is frozen
    if (room.state === 'FROZEN' || room.state === 'DRAWING' || room.state === 'DONE') {
      return { error: 'Room is locked', state: room.state };
    }

    // Check if already a member
    const existingMember = room.members.find(m => m.clientId === clientId);
    if (!existingMember) {
      room.members.push({
        clientId,
        displayName: displayName || '匿名',
        joinedAt: Date.now(),
      });
    } else {
      existingMember.displayName = displayName || existingMember.displayName;
    }

    await this.saveRoom(room);

    // Notify others
    this.io.to(roomId).emit('member-joined', {
      members: room.members,
      memberCount: room.members.length,
    });

    return {
      state: room.state,
      memberCount: room.members.length,
      readyCount: room.readySet.length,
      myReady: room.readySet.includes(clientId),
      members: room.members,
    };
  }

  async setReady(roomId: string, clientId: string, ready: boolean) {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    if (room.state === 'DRAWING' || room.state === 'DONE') {
      return { error: 'Cannot ready during drawing phase', state: room.state };
    }

    if (ready) {
      if (!room.readySet.includes(clientId)) {
        room.readySet.push(clientId);
      }
    } else {
      room.readySet = room.readySet.filter(id => id !== clientId);
    }

    // Check if all members ready
    if (room.readySet.length === room.members.length && room.members.length >= 2) {
      room.state = 'FROZEN';
      // Initialize drawing pools
      room.drawersRemaining = room.members.map(m => m.clientId);
      room.targetsRemaining = room.members.map(m => m.clientId);
    }

    await this.saveRoom(room);

    // Notify all
    this.io.to(roomId).emit('state-updated', {
      state: room.state,
      memberCount: room.members.length,
      readyCount: room.readySet.length,
      members: room.members,
      readySet: room.readySet,
      drawersRemaining: room.drawersRemaining.length,
    });

    // If entered drawing phase
    if (room.state === 'FROZEN') {
      // Small delay then switch to DRAWING
      setTimeout(() => {
        room!.state = 'DRAWING';
        this.saveRoom(room!);
        this.io.to(roomId).emit('state-updated', {
          state: 'DRAWING',
          memberCount: room!.members.length,
          readyCount: room!.readySet.length,
          members: room!.members,
          readySet: room!.readySet,
          drawersRemaining: room!.drawersRemaining.length,
        });
      }, 500);
    }

    return {
      state: room.state,
      memberCount: room.members.length,
      readyCount: room.readySet.length,
    };
  }

  async draw(roomId: string, clientId: string, idempotencyKey?: string) {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    if (room.state !== 'DRAWING') {
      return { error: 'Room not in drawing state', state: room.state };
    }

    // Check if already drawn
    if (room.assignments[clientId]) {
      return { alreadyDrawn: true };
    }

    // Get available targets (exclude self)
    const availableTargets = room.targetsRemaining.filter(t => t !== clientId);
    
    if (availableTargets.length === 0) {
      return { error: 'No targets available' };
    }

    // Atomic: select random target
    const targetIndex = Math.floor(Math.random() * availableTargets.length);
    const targetId = availableTargets[targetIndex];

    // Record assignment
    room.assignments[clientId] = targetId;
    
    // Remove from pools
    room.drawersRemaining = room.drawersRemaining.filter(d => d !== clientId);
    room.targetsRemaining = room.targetsRemaining.filter(t => t !== targetId);

    // Check if last drawer - auto-assign
    if (room.drawersRemaining.length === 1 && room.targetsRemaining.length === 1) {
      let lastDrawer = room.drawersRemaining[0];
      let lastTarget = room.targetsRemaining[0];

      // Swap if self-assign (for n>2)
      if (lastDrawer === lastTarget && room.members.length > 2) {
        // Find someone to swap with - pick first assigned drawer
        const swapDrawer = Object.keys(room.assignments)[0];
        if (swapDrawer) {
          const originalTarget = room.assignments[swapDrawer];
          // Swap: lastDrawer gets original target, swapDrawer gets lastTarget (which is themselves, but now we assign them lastDrawer's old target)
          room.assignments[lastDrawer] = originalTarget;
          room.assignments[swapDrawer] = lastDrawer; // swapDrawer now gets lastDrawer's ID
          lastTarget = originalTarget; // Update for the DONE check
        }
      } else if (lastDrawer === lastTarget && room.members.length === 2) {
        // n=2: swap
        const otherClientId = room.members.find(m => m.clientId !== lastDrawer)?.clientId;
        if (otherClientId) {
          // Swap assignments
          const otherAssignment = room.assignments[otherClientId];
          room.assignments[lastDrawer] = otherAssignment || otherClientId;
          if (otherAssignment) {
            room.assignments[otherClientId] = lastDrawer;
          }
        }
      } else {
        room.assignments[lastDrawer] = lastTarget;
      }

      room.state = 'DONE';
    }

    await this.saveRoom(room);

    // Get target display name
    const targetMember = room.members.find(m => m.clientId === targetId);
    const targetDisplay = targetMember?.displayName || '未知';

    // Notify all (without revealing specific assignments)
    this.io.to(roomId).emit('state-updated', {
      state: room.state,
      memberCount: room.members.length,
      readyCount: room.readySet.length,
      members: room.members,
      readySet: room.readySet,
      drawnCount: Object.keys(room.assignments).length,
      drawersRemaining: room.drawersRemaining.length,
    });

    return {
      targetId,
      targetDisplay,
      oneTime: true,
    };
  }

  async reveal(roomId: string, clientId: string) {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const assignment = room.assignments[clientId];
    if (!assignment) {
      return { error: 'not_drawn', reason: 'You have not drawn yet' };
    }

    // Check if already revealed (strict burn)
    if (room.revealed.includes(clientId)) {
      return { error: 'already_burned', reason: 'Result already revealed' };
    }

    // Mark as revealed
    room.revealed.push(clientId);
    await this.saveRoom(room);

    const targetMember = room.members.find(m => m.clientId === assignment);
    const targetDisplay = targetMember?.displayName || '未知';

    return { targetDisplay };
  }

  getRoomState(roomId: string, clientId?: string) {
    const room = this.roomCache.get(roomId);
    if (!room) return null;

    const result: Record<string, unknown> = {
      state: room.state,
      memberCount: room.members.length,
      readyCount: room.readySet.length,
      readySet: room.readySet,
      drawnCount: Object.keys(room.assignments).length,
      members: room.members,
    };

    if (clientId) {
      result.myReady = room.readySet.includes(clientId);
      result.myStatus = room.assignments[clientId] 
        ? (room.revealed.includes(clientId) ? 'revealed' : 'drawn') 
        : 'pending';
    }

    return result;
  }

  handleSocketJoin(roomId: string, clientId: string) {
    // Update socket room mapping if needed
  }

  private async cleanupExpiredRooms() {
    const now = Date.now();
    for (const [roomId, room] of this.roomCache.entries()) {
      if (room.expiresAt < now) {
        this.roomCache.delete(roomId);
        if (this.useRedis && this.redis) {
          await this.redis.del(this.getRoomKey(roomId));
        }
        console.log(`Cleaned up expired room: ${roomId}`);
      }
    }
  }
}
