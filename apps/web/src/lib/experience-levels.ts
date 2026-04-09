import type { Certification } from "@certuary/data";

export type ExperienceLevel =
  | "entry"
  | "associate"
  | "intermediate"
  | "advanced"
  | "expert";

export const EXPERIENCE_LEVELS: {
  key: ExperienceLevel;
  label: string;
}[] = [
  { key: "entry", label: "Entry" },
  { key: "associate", label: "Associate" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
  { key: "expert", label: "Expert" },
];

const LEVEL_TAG_MAP: Record<string, ExperienceLevel> = {
  foundational: "entry",
  "entry-level": "entry",
  associate: "associate",
  intermediate: "intermediate",
  advanced: "advanced",
  professional: "advanced",
  expert: "expert",
};

/**
 * Determine a certification's experience level from its tags.
 * Falls back to "intermediate" for certs without a recognized level tag.
 */
export function getCertLevel(cert: Certification): ExperienceLevel {
  for (const tag of cert.tags) {
    const level = LEVEL_TAG_MAP[tag];
    if (level) return level;
  }
  return "intermediate";
}
