import express, { type Express } from "express";
import path from "node:path";
import type { AgentName } from "./messages.js";

export interface MessagePoster {
  post(agent: AgentName): Promise<void>;
}

const COOLDOWN_MS = 2_000;

export function createApp(poster: MessagePoster): Express {
  const app = express();
  const publicDir = path.resolve(process.cwd(), "public");
  const lastSent = new Map<AgentName, number>();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1kb" }));
  app.use(express.static(publicDir, { index: "index.html" }));

  app.post("/api/send/:agent", async (req, res) => {
    const agent = req.params.agent;
    if (agent !== "jenny" && agent !== "ryan") {
      res.status(404).json({ ok: false, error: "Unknown agent" });
      return;
    }

    const now = Date.now();
    const previous = lastSent.get(agent) ?? 0;
    if (now - previous < COOLDOWN_MS) {
      res.status(429).json({ ok: false, error: "Please wait before sending again" });
      return;
    }

    // Reserve the cooldown immediately so rapid taps cannot race two Slack calls.
    lastSent.set(agent, now);
    try {
      await poster.post(agent);
      res.json({ ok: true, agent });
    } catch (error) {
      lastSent.delete(agent);
      console.error(`Failed to post as ${agent}:`, error);
      res.status(502).json({ ok: false, error: "Slack did not accept the message" });
    }
  });

  return app;
}
