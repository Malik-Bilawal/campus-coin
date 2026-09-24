import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { seedSystemCategories } from "./seeds/categories.js";

async function main() {
  await connectDB();
  await seedSystemCategories();

  const server = app.listen(env.PORT, () => {
    console.log(` Campus Coin API on http://localhost:${env.PORT}`);
    console.log(` Environment: ${env.NODE_ENV}`);
  });

  process.on("SIGINT", async () => {
    server.close(() => process.exit(0));
  });
}

main().catch((e) => {
  console.error("Fatal startup error:", e);
  process.exit(1);
});
