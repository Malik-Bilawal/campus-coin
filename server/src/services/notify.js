import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { emitToUser, emitToAll } from "../config/socket.js";

const TOAST_SAFE = (msg) => String(msg || "").slice(0, 300);

export async function notifyUser(userId, { type = "info", message, title }) {
  if (!userId || !message) return null;
  const doc = await Notification.create({
    userId,
    type,
    message: TOAST_SAFE(message),
    title: title || undefined,
  });
  const payload = doc.toObject();
  emitToUser(userId, "notification:new", payload);
  return payload;
}

export async function broadcastNotification({ type = "announcement", message, title }) {
  const users = await User.find({ isActive: true }).select("_id").lean();
  if (!users.length) return 0;

  const docs = users.map((u) => ({
    userId: u._id,
    type,
    message: TOAST_SAFE(message),
    title: title || undefined,
  }));
  const created = await Notification.insertMany(docs, { ordered: false });

  for (const n of created) {
    emitToUser(n.userId, "notification:new", n.toObject());
  }
  emitToAll("announcement:new", { title, message });
  return created.length;
}
