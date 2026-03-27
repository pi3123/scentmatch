export interface FragranceResult {
  id: number;
  name: string;
  brand: string;
  year: number | null;
  gender: string | null;
  ratingValue: number | null;
  ratingCount: number | null;
  mainAccords: string | null;
  imageUrl: string | null;
  notes: {
    fragranceId: number;
    noteId: number;
    layer: string;
    note: {
      id: number;
      name: string;
      category: string | null;
    };
  }[];
}

export interface MatchResponse {
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
  explanation: string;
  fragrance: {
    id: number;
    name: string;
    brand: string;
    imageUrl: string | null;
  };
}

export interface CollectionItem {
  userId: string;
  fragranceId: number;
  status: string;
  rating: number | null;
  addedAt: string;
  fragrance: FragranceResult;
}
