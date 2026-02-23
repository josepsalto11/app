import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { getETA } from "./providers/eta.js";
import { computeLeaveAt, computeReliability } from "./services/planning.js";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, name: "puntualia-api" }));

const EtaReq = z.object({
  userId: z.string().optional().default("demo"),
  origin: z.object({ lat: z.number(), lng: z.number() }),
  destination: z.union([
    z.object({ lat: z.number(), lng: z.number() }),
    z.object({ query: z.string().min(2) })
  ]),
  mode: z.enum(["drive", "walk", "transit"]).default("drive"),
  departureTimeISO: z.string().optional()
});

app.post("/v1/eta", async (req, res) => {
  const parsed = EtaReq.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  try {
    const eta = await getETA({
      origin: data.origin,
      destination: data.destination,
      mode: data.mode,
      departureTimeISO: data.departureTimeISO
    });

    const reliability = computeReliability({ mode: data.mode, provider: eta.provider, etaSec: eta.etaSeconds });

    res.json({ ...eta, ...reliability });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ETA_PROVIDER_ERROR" });
  }
});

const PlanReq = z.object({
  userId: z.string().default("demo"),
  eventStartISO: z.string(),
  origin: z.object({ lat: z.number(), lng: z.number() }),
  destination: z.union([
    z.object({ lat: z.number(), lng: z.number() }),
    z.object({ query: z.string().min(2) })
  ]),
  mode: z.enum(["drive", "walk", "transit"]).default("drive"),
  bufferMinutes: z.number().int().min(0).max(60).default(10),
  prepMinutes: z.number().int().min(0).max(60).default(5),
  parkingMinutes: z.number().int().min(0).max(60).default(0)
});

app.post("/v1/plan", async (req, res) => {
  const parsed = PlanReq.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const p = parsed.data;
  const eventStart = new Date(p.eventStartISO);

  const eta = await getETA({
    origin: p.origin,
    destination: p.destination,
    mode: p.mode,
    departureTimeISO: p.eventStartISO
  });

  const leaveAt = computeLeaveAt({
    eventStart,
    etaSec: eta.etaSeconds,
    bufferMin: p.bufferMinutes,
    prepMin: p.prepMinutes,
    parkingMin: p.parkingMinutes
  });

  res.json({
    eventStartISO: eventStart.toISOString(),
    leaveAtISO: leaveAt.toISOString(),
    ...eta
  });
});

app.post("/v1/feedback", async (req, res) => {
  // Minimal: store feedback for learning later
  const schema = z.object({
    userId: z.string().default("demo"),
    tripId: z.string().optional(),
    outcome: z.enum(["ontime", "tight", "late"]),
    reason: z.enum(["traffic", "transit_delay", "prep", "parking", "other"]).optional(),
    extraDelaySec: z.number().int().min(0).max(7200).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // In MVP we just return ok; in Pro you link this to Trip + update CommuteProfile
  res.json({ ok: true });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`puntualia-api listening on :${port}`));
