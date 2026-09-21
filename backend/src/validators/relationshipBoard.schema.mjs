import { z } from "zod";

const nodeSchema = z.object({
  characterId: z.string(),
  x: z.number(),
  y: z.number(),
});

const connectionSchema = z.object({
  id: z.string(),
  fromCharacterId: z.string(),
  toCharacterId: z.string(),
  label: z.string().max(60).optional().default(""),
  fromSide: z.enum(["top", "right", "bottom", "left"]).optional(),
  toSide: z.enum(["top", "right", "bottom", "left"]).optional(),
  fromAnchor: z.number().optional(),
  toAnchor: z.number().optional(),
  arrowDirection: z.enum(["forward", "reverse", "both", "none"]).optional(),
  controlOffsetX: z.number().optional(),
  controlOffsetY: z.number().optional(),
});

const noteSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  x: z.number(),
  y: z.number(),
});

export const relationshipBoardSchema = z.object({
  nodes: z.array(nodeSchema).max(200),
  connections: z.array(connectionSchema).max(500),
  notes: z.array(noteSchema).max(100),
  version: z.number().int().min(1),
});
