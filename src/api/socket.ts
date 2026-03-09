import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = '';

interface UseSocketOptions {
  roomId?: string;
  clientId?: string;
  onStateUpdate?: (data: any) => void;
  onMemberJoined?: (data: any) => void;
}

export function useSocket({ roomId, clientId, onStateUpdate, onMemberJoined }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId || !clientId) return;

    // Connect to WebSocket
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      
      // Join room
      socket.emit('join-room', { roomId, clientId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // Listen for state updates
    socket.on('state-updated', (data) => {
      console.log('State updated:', data);
      onStateUpdate?.(data);
    });

    // Listen for member joined
    socket.on('member-joined', (data) => {
      console.log('Member joined:', data);
      onMemberJoined?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, clientId]);

  const emitReady = useCallback((ready: boolean) => {
    if (socketRef.current && roomId && clientId) {
      socketRef.current.emit('ready', { roomId, clientId, ready });
    }
  }, [roomId, clientId]);

  return { connected, emitReady };
}
