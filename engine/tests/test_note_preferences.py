from src.matching.note_preferences import score_note_preferences
from src.models import FragranceProfile, NoteInfo, NotePreference


def _make_target(note_names: list[str]) -> FragranceProfile:
    return FragranceProfile(
        id=1,
        name="Test",
        brand="Test",
        notes=[NoteInfo(name=n, category="woody", layer="base") for n in note_names],
        main_accords={},
    )


def test_all_loved_notes_scores_high():
    target = _make_target(["oud", "sandalwood", "amber"])
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="sandalwood", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="amber", category="woody", preference="love", source="explicit"),
    ]
    result = score_note_preferences(target, prefs)
    assert result.score >= 0.9
    assert result.breakdown.loved == ["oud", "sandalwood", "amber"]
    assert result.breakdown.disliked == []


def test_disliked_note_lowers_score():
    target = _make_target(["oud", "rose"])
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="rose", category="floral", preference="dislike", source="explicit"),
    ]
    result = score_note_preferences(target, prefs)
    assert result.score < 0.7
    assert "rose" in result.breakdown.disliked
    assert "rose" in result.risk_factors


def test_unknown_notes_are_neutral():
    target = _make_target(["oud", "cardamom"])
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
    ]
    result = score_note_preferences(target, prefs)
    assert "cardamom" in result.breakdown.neutral


def test_empty_preferences_returns_all_neutral():
    target = _make_target(["oud", "rose"])
    result = score_note_preferences(target, [])
    assert result.score == 0.5  # neutral baseline
    assert result.breakdown.neutral == ["oud", "rose"]
