from pydantic import BaseModel


class NoteInfo(BaseModel):
    name: str
    category: str
    layer: str  # top, middle, base


class FragranceProfile(BaseModel):
    id: int
    name: str
    brand: str
    notes: list[NoteInfo]
    main_accords: dict[str, float]  # e.g. {"woody": 0.8, "spicy": 0.6}


class CollectionItem(BaseModel):
    fragrance: FragranceProfile
    status: str  # own, tried, want
    rating: int | None = None


class NotePreference(BaseModel):
    note_name: str
    category: str
    preference: str  # love, like, neutral, dislike
    source: str  # inferred, explicit


class CollectionComparison(BaseModel):
    fragrance_name: str
    fragrance_brand: str
    similarity: float
    shared_notes: list[str]
    differences: str


class NoteBreakdown(BaseModel):
    loved: list[str]
    liked: list[str]
    neutral: list[str]
    disliked: list[str]


class CommunityStats(BaseModel):
    rating: float | None = None
    longevity: str | None = None
    sillage: str | None = None


class MatchRequest(BaseModel):
    target: FragranceProfile
    collection: list[CollectionItem]
    note_preferences: list[NotePreference]
    community_stats: CommunityStats | None = None


class MatchResult(BaseModel):
    match_score: int  # 0-100
    confidence: str  # none, low, medium, high
    accord_similarity: float | None = None
    note_breakdown: NoteBreakdown
    co_occurrence_score: float | None = None
    collection_comparisons: list[CollectionComparison]
    risk_factors: list[str]
    active_layers: list[int]  # which layers were used [1, 2, 3]
    community_stats: CommunityStats | None = None
