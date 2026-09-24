import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/error.js";
import { apiLimiter } from "./middlewares/rateLimit.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [env.CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", apiLimiter);

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
