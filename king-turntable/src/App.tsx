import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { Card, CardContent } from "../@/components/ui/card";
import { Button } from "../@/components/ui/button";
import { Input } from "../@/components/ui/input";
import { Badge } from "../@/components/ui/badge";
import { cn } from "../@/lib/utils";

interface Member {
  clientId: string;
  name: string;
}

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
    <div className="relative w-full h-64 flex items-center justify-center overflow-hidden">
      {/* Card Stack */}
      <div className="relative w-48 h-64">
        {/* Background cards (stack effect) */}
        {cards.slice(0, 3).map((_, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ scale: 1 - index * 0.05, y: index * -8 }}
            style={{
              zIndex: -index,
            }}
          >
            <Card className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-700 border-0 shadow-xl">
              <CardContent className="flex items-center justify-center h-full">
                <div className="w-16 h-24 rounded-lg bg-white/20 backdrop-blur-sm" />
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
            className="absolute inset-0 cursor-pointer"
            onClick={!isDrawing ? onDraw : undefined}
          >
            <Card className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-0 shadow-2xl overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center h-full relative">
                {/* Decorative elements */}
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20" />
                <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-white/10" />
                <div className="absolute top-1/2 left-4 w-6 h-6 rounded-full bg-white/15" />
                
                {/* Crown/Star icon */}
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-6xl mb-4"
                >
                  👑
                </motion.div>
                
                <p className="text-white/80 text-sm font-medium">
                  {isDrawing ? "✨ 揭晓中..." : "点击抽取"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

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
      <Card className="w-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border-0 shadow-2xl">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AnimatePresence mode="wait">
            {isRevealed ? (
              <motion.div
                key="revealed"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-center"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-8xl mb-4"
                >
                  🎉
                </motion.div>
                <p className="text-white/80 text-lg mb-2">你抽到了</p>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-bold text-white"
                >
                  {name}
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="text-6xl mb-4">🎁</div>
                <p className="text-white/80 mb-4">结果已揭晓</p>
                <Button
                  onClick={onReveal}
                  className="bg-white text-orange-600 hover:bg-white/90 font-semibold"
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
  const [members, setMembers] = useState<Member[]>([]);
  const [myClientId] = useState(() => `client_${Math.random().toString(36).slice(2, 11)}`);
  const [readySet, setReadySet] = useState<Set<string>>(new Set());
  const [isDrawing, setIsDrawing] = useState(false);
  const [myResult, setMyResult] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const generateRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setDisplayCode(code);
    setMembers([{ clientId: myClientId, name: myName || "匿名" }]);
    setPage("room");
  };

  const handleJoinRoom = () => {
    if (!roomCode) return;
    setDisplayCode(roomCode.toUpperCase());
    setMembers([{ clientId: myClientId, name: myName || "匿名" }]);
    setPage("room");
  };

  const handleReady = () => {
    setReadySet((prev) => {
      const next = new Set(prev);
      if (next.has(myClientId)) {
        next.delete(myClientId);
      } else {
        next.add(myClientId);
      }
      return next;
    });
  };

  const handleDraw = () => {
    setIsDrawing(true);
    // Simulate draw animation
    setTimeout(() => {
      const otherMembers = members.filter((m) => m.clientId !== myClientId);
      const target = otherMembers[Math.floor(Math.random() * otherMembers.length)];
      setMyResult(target.name);
      setIsDrawing(false);
    }, 2000);
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Home Page */}
        {page === "home" && (
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardContent className="p-6 space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <h1 className="text-3xl font-bold text-white mb-2">🎯 King Turntable</h1>
                <p className="text-white/60">顺序抽取配对 · 阅后即焚</p>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <Input
                  placeholder="你的昵称"
                  value={myName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMyName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="输入房间码"
                    value={roomCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomCode(e.target.value.toUpperCase())}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 flex-1"
                  />
                  <Button
                    onClick={handleJoinRoom}
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    加入
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent text-white/40 px-2">或</span>
                  </div>
                </div>
                <Button
                  onClick={handleCreateRoom}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold"
                >
                  创建房间
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        )}

        {/* Room Page */}
        {page === "room" && (
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardContent className="p-6 space-y-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <Badge variant="secondary" className="mb-3 bg-white/20 text-white">
                  房间已创建
                </Badge>
                <motion.div
                  initial={{ rotate: -5 }}
                  animate={{ rotate: 5 }}
                  transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse" }}
                  className="text-5xl font-bold tracking-widest text-white"
                >
                  {displayCode}
                </motion.div>
                <p className="text-white/50 text-sm mt-2">分享房间码给朋友</p>
              </motion.div>

              {/* Stats */}
              <div className="flex justify-center gap-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <p className="text-3xl font-bold text-white">{members.length}</p>
                  <p className="text-white/50 text-xs">成员</p>
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <p className="text-3xl font-bold text-green-400">{readySet.size}</p>
                  <p className="text-white/50 text-xs">已准备</p>
                </motion.div>
              </div>

              {/* Members */}
              <div className="space-y-2">
                {members.map((member, index) => (
                  <motion.div
                    key={member.clientId}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {member.name[0]}
                    </div>
                    <span className="text-white flex-1">{member.name}</span>
                    {readySet.has(member.clientId) && (
                      <Badge className="bg-green-500/20 text-green-400">✓ 已准备</Badge>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="修改昵称"
                  value={myName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMyName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <Button
                  onClick={handleReady}
                  className={cn(
                    "font-semibold",
                    readySet.has(myClientId)
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  )}
                >
                  {readySet.has(myClientId) ? "取消准备" : "准备"}
                </Button>
              </div>

              {/* Enter draw phase */}
              {readySet.size === members.length && members.length >= 2 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Button
                    onClick={() => setPage("draw")}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-lg py-6"
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
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
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
                  className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4 text-center"
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
