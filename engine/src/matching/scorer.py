from ..models import (
    CommunityStats,
    FragranceProfile,
    CollectionItem,
    NotePreference,
    MatchResult,
    NoteBreakdown,
)
from .accord_similarity import score_accord_similarity
from .co_occurrence import score_co_occurrence
from .note_preferences import score_note_preferences
from .confidence import get_active_layers, calculate_confidence
from .collection_compare import find_collection_comparisons

LAYER_WEIGHTS = {1: 0.3, 2: 0.3, 3: 0.4}


def compute_match(
    target: FragranceProfile,
    collection: list[CollectionItem],
    note_prefs: list[NotePreference],
    community_stats: CommunityStats | None = None,
) -> MatchResult:
    experienced = [i for i in collection if i.status in ("own", "tried")]
    experienced_count = len(experienced)
    has_note_prefs = len(note_prefs) > 0

    active_layers = get_active_layers(experienced_count, has_note_prefs)
    confidence = calculate_confidence(active_layers, experienced_count)

    if not active_layers:
        return MatchResult(
            match_score=0,
            confidence="none",
            note_breakdown=NoteBreakdown(loved=[], liked=[], neutral=[], disliked=[]),
            collection_comparisons=[],
            risk_factors=[],
            active_layers=[],
            community_stats=community_stats,
        )

    layer_scores: dict[int, float] = {}

    if 1 in active_layers:
        accord_score = score_accord_similarity(target, collection)
        if accord_score is not None:
            layer_scores[1] = accord_score

    if 2 in active_layers:
        co_occ_score = score_co_occurrence(target, collection)
        if co_occ_score is not None:
            layer_scores[2] = co_occ_score

    note_result = None
    if 3 in active_layers:
        note_result = score_note_preferences(target, note_prefs)
        layer_scores[3] = note_result.score

    if layer_scores:
        total_weight = sum(LAYER_WEIGHTS[l] for l in layer_scores)
        weighted_sum = sum(LAYER_WEIGHTS[l] * s for l, s in layer_scores.items())
        final_score = int(round((weighted_sum / total_weight) * 100))
    else:
        final_score = 0

    breakdown = note_result.breakdown if note_result else NoteBreakdown(
        loved=[], liked=[], neutral=[], disliked=[]
    )
    risk_factors = note_result.risk_factors if note_result else []

    comparisons = find_collection_comparisons(target, collection)

    return MatchResult(
        match_score=max(0, min(100, final_score)),
        confidence=confidence,
        accord_similarity=layer_scores.get(1),
        note_breakdown=breakdown,
        co_occurrence_score=layer_scores.get(2),
        collection_comparisons=comparisons,
        risk_factors=risk_factors,
        active_layers=sorted(active_layers),
        community_stats=community_stats,
    )
