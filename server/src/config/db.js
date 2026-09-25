import mongoose from "mongoose";
import { env } from "./env.js";

let memoryServer = null;

async function tryConnect(uri, timeoutMs, label) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
    });
    console.log(`✅ MongoDB connected (${label}): ${mongoose.connection.host}`);
    return true;
  } catch (err) {
    console.warn(`⚠️  ${label} failed: ${err.message}`);
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    return false;
  }
}

async function startMemoryServer() {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri("campuscoin");
  console.log("⚠️  Using ephemeral in-memory MongoDB (data resets on restart)");
  return uri;
}

export async function connectDB() {
  mongoose.set("strictQuery", true);

  const atlasFirst = env.TRY_ATLAS_FIRST === "true";
  const localUri = env.MONGODB_LOCAL_URI || "mongodb://127.0.0.1:27017/campuscoin";
  const atlasTimeout = env.MONGODB_TIMEOUT_MS;
  const localTimeout = 4000;

  const order = atlasFirst
    ? [
        { uri: env.MONGODB_URI, t: atlasTimeout, label: "Atlas" },
        { uri: localUri, t: localTimeout, label: "Local" },
      ]
    : [
        { uri: localUri, t: localTimeout, label: "Local" },
        { uri: env.MONGODB_URI, t: atlasTimeout, label: "Atlas" },
      ];

  // Atlas links can be flaky on some networks — retry before falling back
  // to the ephemeral in-memory DB (which silently loses all data).
  const MAX_ROUNDS = 3;
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    for (const target of order) {
      if (!target.uri) continue;
      if (await tryConnect(target.uri, target.t, target.label)) return;
    }
    if (round < MAX_ROUNDS) {
      console.warn(`⚠️  DB round ${round}/${MAX_ROUNDS} failed; retrying in 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  if (env.NODE_ENV === "production" && env.FORCE_ATLAS === "true") {
    console.error("❌ FORCE_ATLAS=true — no fallback allowed");
    process.exit(1);
  }

  const memUri = await startMemoryServer();
  await mongoose.connect(memUri, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ In-memory MongoDB ready");
}

export async function disconnectDB() {
  await mongoose.connection.close();
  if (memoryServer) await memoryServer.stop();
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});
