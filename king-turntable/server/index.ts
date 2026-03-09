import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Room manager instance
const roomManager = new RoomManager(io);

// REST API routes
app.post('/api/room', (req, res) => {
  const { roomId, roomCode } = roomManager.createRoom();
  res.json({ roomId, roomCode, expiresAt: Date.now() + 30 * 60 * 1000 });
});

app.post('/api/room/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { clientId, displayName } = req.body;
  
  const result = roomManager.joinRoom(roomId, clientId, displayName);
  if (!result) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(result);
});

app.post('/api/room/:roomId/ready', (req, res) => {
  const { roomId } = req.params;
  const { clientId, ready } = req.body;
  
  const result = roomManager.setReady(roomId, clientId, ready);
  if (!result) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(result);
});

app.post('/api/room/:roomId/draw', (req, res) => {
  const { roomId } = req.params;
  const { clientId, idempotencyKey } = req.body;
  
  const result = roomManager.draw(roomId, clientId, idempotencyKey);
  if (!result) {
    return res.status(404).json({ error: 'Room not found' });
  }
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/room/:roomId/reveal', (req, res) => {
  const { roomId } = req.params;
  const { clientId } = req.body;
  
  const result = roomManager.reveal(roomId, clientId);
  if (!result) {
    return res.status(404).json({ error: 'Room not found' });
  }
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.get('/api/room/:roomId/state', (req, res) => {
  const { roomId } = req.params;
  const { clientId } = req.query;
  
  const result = roomManager.getRoomState(roomId, clientId as string);
  if (!result) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(result);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', ({ roomId, clientId }) => {
    socket.join(roomId);
    roomManager.handleSocketJoin(roomId, clientId);
  });

  socket.on('ready', ({ roomId, clientId, ready }) => {
    roomManager.setReady(roomId, clientId, ready);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
