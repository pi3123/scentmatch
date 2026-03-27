export interface MatchResult {
  match_score: number;
  confidence: string;
  accord_similarity: number | null;
  note_breakdown: {
    loved: string[];
    liked: string[];
    neutral: string[];
    disliked: string[];
  };
  co_occurrence_score: number | null;
  collection_comparisons: {
    fragrance_name: string;
    fragrance_brand: string;
    similarity: number;
    shared_notes: string[];
    differences: string;
  }[];
  risk_factors: string[];
  active_layers: number[];
  community_stats: {
    rating: number | null;
    longevity: string | null;
    sillage: string | null;
  } | null;
}

const ENGINE_URL = process.env.MATCHING_ENGINE_URL || "http://localhost:8000";

export async function getMatch(payload: {
  target: unknown;
  collection: unknown;
  note_preferences: unknown;
  community_stats?: unknown;
}): Promise<MatchResult> {
  const res = await fetch(`${ENGINE_URL}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Matching engine error: ${res.status}`);
  }

  return res.json();
}
