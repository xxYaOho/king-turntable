import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { api, type Member } from "./api";

// Card flip animation variants
const CARD_FLIP_VARIANTS: Variants = {
  hidden: { scale: 0.8, opacity: 0, rotateY: 180 },
  visible: {
    scale: 1,
    opacity: 1,
    rotateY: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
  flipReveal: {
    rotateY: [0, 360, 720, 1080, 1440],
    scale: [1, 1.1, 1.2, 1.1, 1],
    transition: { duration: 1.5, ease: "easeInOut" as const },
  },
};

// Floating particles background
function FloatingParticles() {
  const particles = Array.from({ length: 20 });
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{
            x: Math.random() * 400,
            y: Math.random() * 600,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, Math.random() * -600],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5,
          }}
          style={{
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

// Card Stack component with gacha-style effect
function CardStack({
  cards,
  onDraw,
  isDrawing,
}: {
  cards: Member[];
  onDraw: () => void;
  isDrawing: boolean;
}) {
  return (
    <div className="relative w-full h-72 flex items-center justify-center">
      <FloatingParticles />
      
      <div className="relative w-52 h-72">
        {/* Background cards (stack effect) */}
        {cards.slice(0, 3).map((_, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ scale: 1 - index * 0.04, y: index * -6, rotate: index * 2 - 2 }}
            style={{ zIndex: -index }}
          >
            <Card className="w-full h-full bg-gradient-to-br from-violet-600/80 to-purple-800/80 border-0 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center h-full">
                <div className="w-16 h-24 rounded-lg bg-white/10" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
        
        {/* Top card with flip animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isDrawing ? "drawing" : "ready"}
            variants={CARD_FLIP_VARIANTS}
            initial="hidden"
            animate={isDrawing ? "flipReveal" : "visible"}
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={!isDrawing ? onDraw : undefined}
          >
            <Card className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-0 shadow-2xl overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center h-full relative">
                {/* Decorative elements */}
                <div className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/20 blur-sm" />
                <div className="absolute bottom-12 right-8 w-14 h-14 rounded-full bg-white/10 blur-sm" />
                <div className="absolute top-1/2 left-4 w-6 h-6 rounded-full bg-white/15 blur-sm" />
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse" />
                
                {/* Crown/Star icon */}
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.15, 1],
                    y: [0, -5, 0],
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-7xl mb-4 drop-shadow-lg"
                >
                  👑
                </motion.div>
                
                <motion.p
                  animate={{ opacity: isDrawing ? [0.5, 1, 0.5] : 1 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-white/90 text-base font-semibold tracking-wide"
                >
                  {isDrawing ? "✨ 揭晓中..." : "点击抽取"}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Result reveal card with celebration effect
function ResultCard({
  name,
  isRevealed,
  onReveal,
}: {
  name: string;
  isRevealed: boolean;
  onReveal: () => void;
}) {
  return (
    <motion.div
      variants={CARD_FLIP_VARIANTS}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <Card className="w-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border-0 shadow-2xl overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-10">
          <AnimatePresence mode="wait">
            {isRevealed ? (
              <motion.div
                key="revealed"
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="text-center"
              >
                {/* Confetti effect */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-7xl mb-6 drop-shadow-xl"
                >
                  🎉
                </motion.div>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/80 text-lg mb-2"
                >
                  你抽到了
                </motion.p>
                
                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-5xl font-bold text-white drop-shadow-lg"
                >
                  {name}
                </motion.p>
                
                {/* Decorative circles */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-10 left-10 w-16 h-16 bg-white/20 rounded-full blur-xl"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  className="absolute bottom-10 right-10 w-20 h-20 bg-yellow-300/20 rounded-full blur-xl"
                />
              </motion.div>
            ) : (
              <motion.div
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-8xl mb-6"
                >
                  🎁
                </motion.div>
                <p className="text-white/80 text-lg mb-6">结果已揭晓</p>
                <Button
                  onClick={onReveal}
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-white/90 font-bold text-lg px-8 py-6 shadow-lg"
                >
                  点击查看
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Home() {
  const [page, setPage] = useState<"home" | "room" | "draw">("home");
  const [roomCode, setRoomCode] = useState("");
  const [myName, setMyName] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [roomId, setRoomId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [myClientId] = useState(() => {
    const saved = localStorage.getItem('clientId');
    if (saved) return saved;
    const newId = `client_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('clientId', newId);
    return newId;
  });
  const [readySet, setReadySet] = useState<Set<string>>(new Set());
  const [isDrawing, setIsDrawing] = useState(false);
  const [myResult, setMyResult] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Poll room state when in room
  useEffect(() => {
    if (page !== "room" || !roomId) return;
    
    const pollState = async () => {
      try {
        const state = await api.getState(roomId, myClientId);
        if (state.members) setMembers(state.members);
        if (state.readySet) {
          setReadySet(new Set(state.readySet));
        }
        if (state.state === 'FROZEN' || state.state === 'DRAWING' || state.state === 'DONE') {
          setPage("draw");
        }
      } catch (e) {
        console.error('Failed to poll state:', e);
      }
    };

    pollState();
    const interval = setInterval(pollState, 3000);
    return () => clearInterval(interval);
  }, [page, roomId, myClientId]);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const room = await api.createRoom();
      setRoomId(room.roomId);
      setDisplayCode(room.roomCode);
      
      // Auto join
      const result = await api.joinRoom(room.roomId, myClientId, myName || "匿名");
      if (result.members) {
        setMembers(result.members);
      }
      setPage("room");
    } catch (e) {
      console.error('Failed to create room:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode) return;
    setIsLoading(true);
    try {
      const result = await api.joinRoom(roomCode.toUpperCase(), myClientId, myName || "匿名");
      if (result.error) {
        console.error('Failed to join:', result.error);
        alert('房间不存在或已锁定');
        return;
      }
      if (!result.members || result.members.length === 0) {
        alert('房间不存在，请检查房间码');
        return;
      }
      setMembers(result.members);
      setRoomId(roomCode.toUpperCase());
      setDisplayCode(roomCode.toUpperCase());
      setPage("room");
    } catch (e) {
      console.error('Failed to join room:', e);
      alert('无法连接到服务器');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReady = async () => {
    if (!roomId) return;
    
    const newReady = !readySet.has(myClientId);
    try {
      await api.setReady(roomId, myClientId, newReady);
      setReadySet(prev => {
        const next = new Set(prev);
        if (newReady) {
          next.add(myClientId);
        } else {
          next.delete(myClientId);
        }
        return next;
      });
    } catch (e) {
      console.error('Failed to set ready:', e);
    }
  };

  const handleDraw = async () => {
    if (!roomId) return;
    setIsDrawing(true);
    try {
      const result = await api.draw(roomId, myClientId);
      if (result.targetDisplay) {
        setMyResult(result.targetDisplay);
      }
    } catch (e) {
      console.error('Failed to draw:', e);
    } finally {
      setIsDrawing(false);
    }
  };

  const handleReveal = async () => {
    if (!roomId) return;
    try {
      const result = await api.reveal(roomId, myClientId);
      if (result.targetDisplay) {
        setMyResult(result.targetDisplay);
        setIsRevealed(true);
      } else if (result.error === 'already_burned') {
        setIsRevealed(true);
      }
    } catch (e) {
      console.error('Failed to reveal:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-slate-900/50 to-slate-900" />
      
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Home Page */}
        {page === "home" && (
          <Card className="backdrop-blur-2xl bg-white/5 border-white/10 shadow-2xl">
            <CardContent className="p-8 space-y-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <h1 className="text-4xl font-bold text-white mb-3">🎯 King Turntable</h1>
                </motion.div>
                <p className="text-white/50">顺序抽取配对 · 阅后即焚</p>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <Input
                  placeholder="你的昵称"
                  value={myName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMyName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 text-base"
                />
                
                <div className="flex gap-3">
                  <Input
                    placeholder="输入房间码"
                    value={roomCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomCode(e.target.value.toUpperCase())}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 text-base flex-1"
                  />
                  <Button
                    onClick={handleJoinRoom}
                    disabled={isLoading || !roomCode}
                    size="lg"
                    variant="secondary"
                    className="bg-white/10 hover:bg-white/20 text-white border-0 h-12 px-6 disabled:opacity-50"
                  >
                    加入
                  </Button>
                </div>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-transparent text-white/30 text-xs uppercase px-3">或</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold h-12 text-base shadow-lg shadow-purple-500/25 disabled:opacity-50"
                >
                  {isLoading ? "加载中..." : "创建房间"}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        )}

        {/* Room Page */}
        {page === "room" && (
          <Card className="backdrop-blur-2xl bg-white/5 border-white/10 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-0 px-4 py-1.5">
                  房间已创建
                </Badge>
                
                <motion.div
                  initial={{ rotate: -3 }}
                  animate={{ rotate: 3 }}
                  transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
                  className="text-6xl font-bold tracking-widest text-white mb-2"
                >
                  {displayCode}
                </motion.div>
                <p className="text-white/40 text-sm">分享房间码给朋友加入</p>
              </motion.div>

              {/* Stats */}
              <div className="flex justify-center gap-12 py-4">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <p className="text-4xl font-bold text-white">{members.length}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wide">成员</p>
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <motion.p 
                    animate={{ scale: readySet.size > 0 ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl font-bold text-green-400"
                  >
                    {readySet.size}
                  </motion.p>
                  <p className="text-white/40 text-xs uppercase tracking-wide">已准备</p>
                </motion.div>
              </div>

              {/* Members */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map((member, index) => (
                  <motion.div
                    key={member.clientId}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {member.displayName[0]}
                    </div>
                    <span className="text-white flex-1 font-medium">{member.displayName}</span>
                    {readySet.has(member.clientId) && (
                      <Badge className="bg-green-500/20 text-green-400 border-0">✓ 已准备</Badge>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3">
                <Input
                  placeholder="修改昵称"
                  value={myName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMyName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 flex-1"
                />
                <Button
                  onClick={handleReady}
                  size="lg"
                  className={
                    readySet.has(myClientId)
                      ? "bg-white/10 hover:bg-white/20 text-white h-11 px-6"
                      : "bg-green-600 hover:bg-green-500 text-white h-11 px-6 shadow-lg shadow-green-500/25"
                  }
                >
                  {readySet.has(myClientId) ? "取消准备" : "准备"}
                </Button>
              </div>

              {/* Enter draw phase */}
              {readySet.size === members.length && members.length >= 2 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Button
                    onClick={() => setPage("draw")}
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-lg py-6 shadow-xl shadow-amber-500/25"
                  >
                    🎰 开始抽取
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Draw Page */}
        {page === "draw" && (
          <Card className="backdrop-blur-2xl bg-white/5 border-white/10 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 px-4 py-1.5 text-sm">
                  🎯 抽取阶段
                </Badge>
              </div>

              {!myResult ? (
                <CardStack
                  cards={members}
                  onDraw={handleDraw}
                  isDrawing={isDrawing}
                />
              ) : (
                <ResultCard
                  name={myResult}
                  isRevealed={isRevealed}
                  onReveal={handleReveal}
                />
              )}

              {myResult && isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 text-center"
                >
                  <p className="text-amber-200 text-sm">
                    🔥 阅后即焚！请自行记录，关闭页面后可能无法再次查看
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
