import { z } from "zod";

const text = (max) => z.string().trim().max(max).optional().default("");

export const worldSettingSchema = z.object({
  era: text(500),
  mainPlaces: text(500),
  worldRules: text(1000),
  organizations: text(500),
  culture: text(500),
  technologyOrMagic: text(1000),
  moodTone: text(500),
  forbiddenSettings: text(1000),
  researchNotes: text(1000),
  referenceSources: text(1000),
});
