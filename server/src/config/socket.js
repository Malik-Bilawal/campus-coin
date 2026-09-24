import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env.js";

let io = null;
const userSockets = new Map(); // userId -> Set<socketId>

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, "http://localhost:3000"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.userId = decoded.sub;
      socket.role = decoded.role;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);
    socket.join(`user:${uid}`);

    socket.on("disconnect", () => {
      const set = userSockets.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(uid);
      }
    });
  });

  console.log("🔌 WebSocket ready");
  return io;
}

export function getIO() {
  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${String(userId)}`).emit(event, payload);
}

export function emitNotification(userId, notification) {
  emitToUser(userId, "notification:new", notification);
}

export function emitBudgetUpdate(userId, payload) {
  emitToUser(userId, "budget:updated", payload);
}
