import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import multer from "multer";

import routes from "./routes/index.js";
import { connectDB, closeDB } from "./models/Db.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { botShield } from "./middlewares/botShield.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";

//env
dotenv.config();

const app = express();

// Absolute top layers: BotShield and Global Rate Limiting
app.use(botShield);
app.use(globalLimiter);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(requestLogger);

app.use("/api", routes);

// Application Version - Increment this constant in each commit
export const APP_VERSION = "1.1.1";

app.get("/api/not-healthcheck", (_req, res) => {
  res.json({
    success: true,
    version: APP_VERSION,
  });
});



app.post("/api/health", (_req, res) => {
  logger.info("health check hit");

  res.json({
    success: true,
    data: {
      status: "OK",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Spectral Asset Synchronizer: File size exceeds the 10MB threshold.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Spectral Asset Synchronizer: ${err.message}`,
    });
  }

  if (err.message === "Only images allowed") {
    return res.status(400).json({
      success: false,
      message: "Spectral Asset Synchronizer: Only image files (JPEG, PNG, WEBP) are permitted.",
    });
  }

  logger.error("Unhandled Exception caught:", { error: err.message || err });
  return res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
  });
});


const start = async () => {
  try {
    await connectDB();
    logger.info("Connected to MongoDB");

    app.listen(config.port, () => {
      logger.info(`Server running at http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  await closeDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down...");
  await closeDB();
  process.exit(0);
});

start();
