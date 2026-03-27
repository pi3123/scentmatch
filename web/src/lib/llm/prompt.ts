import { renderTemplate } from "./renderer";

interface MatchData {
  match_score: number;
  confidence: string;
  note_breakdown?: {
    loved: string[];
    liked: string[];
    neutral: string[];
    disliked: string[];
  };
  risk_factors?: string[];
  collection_comparisons?: {
    fragrance_name: string;
    similarity: number;
    shared_notes: string[];
  }[];
}

export function buildPrompt(
  matchResult: unknown,
  tone: string,
  fragranceName?: string,
  fragranceBrand?: string
): { system: string; user: string } {
  const data = matchResult as MatchData;

  const system = renderTemplate("system.j2", { tone });

  const user = renderTemplate("user.j2", {
    fragrance_name: fragranceName || "Unknown",
    fragrance_brand: fragranceBrand || "Unknown",
    match_score: data.match_score ?? 0,
    confidence: data.confidence ?? "unknown",
    note_breakdown: data.note_breakdown || null,
    risk_factors: data.risk_factors || [],
    collection_comparisons: data.collection_comparisons || [],
  });

  return { system, user };
}
