import "dotenv/config";
import express from "express";
import { requireAuth } from "./middleware/auth.mjs";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.mjs";
import { authRouter, membersRouter } from "./routes/auth.routes.mjs";
import { projectsRouter } from "./routes/projects.routes.mjs";
import { charactersRouter } from "./routes/characters.routes.mjs";
import { episodesRouter } from "./routes/episodes.routes.mjs";
import { foreshadowsRouter } from "./routes/foreshadows.routes.mjs";
import { worldPlaceImagesRouter } from "./routes/worldSettings.routes.mjs";
import { todosRouter } from "./routes/todos.routes.mjs";
import { timelineItemsRouter } from "./routes/timelineItems.routes.mjs";
import { aiRouter } from "./routes/ai.routes.mjs";

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/members", membersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/characters", requireAuth, charactersRouter);
app.use("/api/episodes", requireAuth, episodesRouter);
app.use("/api/foreshadows", requireAuth, foreshadowsRouter);
app.use("/api/world-place-images", requireAuth, worldPlaceImagesRouter);
app.use("/api/todos", requireAuth, todosRouter);
app.use("/api/timeline-items", requireAuth, timelineItemsRouter);
app.use("/api/ai", aiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Webtoon Maker API: http://${HOST}:${PORT}`);
});
