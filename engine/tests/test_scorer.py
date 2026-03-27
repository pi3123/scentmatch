from src.matching.scorer import compute_match
from src.models import FragranceProfile, NoteInfo, CollectionItem, NotePreference


def _frag(name: str, notes: list[str], accords: dict[str, float] | None = None) -> FragranceProfile:
    return FragranceProfile(
        id=1, name=name, brand="Brand",
        notes=[NoteInfo(name=n, category="woody", layer="base") for n in notes],
        main_accords=accords or {"woody": 0.5},
    )


def _item(notes: list[str], accords: dict[str, float] | None = None, status: str = "own", rating: int | None = None) -> CollectionItem:
    return CollectionItem(fragrance=_frag("Owned", notes, accords), status=status, rating=rating)


def test_empty_profile_returns_none_confidence():
    target = _frag("Target", ["oud"])
    result = compute_match(target, [], [])
    assert result.confidence == "none"
    assert result.match_score == 0
    assert result.active_layers == []


def test_single_fragrance_low_confidence():
    target = _frag("Target", ["oud", "amber"], {"woody": 0.8})
    collection = [_item(["oud", "amber"], {"woody": 0.8})]
    prefs = [NotePreference(note_name="oud", category="woody", preference="love", source="inferred")]
    result = compute_match(target, collection, prefs)
    assert result.confidence == "low"
    assert 1 in result.active_layers
    assert 2 not in result.active_layers
    assert result.match_score > 0


def test_full_profile_high_confidence():
    accords = {"woody": 0.8, "amber": 0.6}
    notes = ["oud", "sandalwood", "amber", "vanilla", "musk"]
    collection = [_item(notes, accords) for _ in range(12)]
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="sandalwood", category="woody", preference="love", source="explicit"),
    ]
    target = _frag("Target", ["oud", "sandalwood", "cedar"], accords)
    result = compute_match(target, collection, prefs)
    assert result.confidence == "high"
    assert result.active_layers == [1, 2, 3]
    assert result.match_score > 50


def test_result_includes_comparisons():
    target = _frag("Target", ["oud", "amber"])
    collection = [_item(["oud", "amber"])]
    prefs = [NotePreference(note_name="oud", category="woody", preference="love", source="explicit")]
    result = compute_match(target, collection, prefs)
    assert len(result.collection_comparisons) > 0


def test_result_includes_note_breakdown():
    target = _frag("Target", ["oud", "rose"])
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="rose", category="floral", preference="dislike", source="explicit"),
    ]
    collection = [_item(["oud"])]
    result = compute_match(target, collection, prefs)
    assert "oud" in result.note_breakdown.loved
    assert "rose" in result.note_breakdown.disliked
    assert "rose" in result.risk_factors
