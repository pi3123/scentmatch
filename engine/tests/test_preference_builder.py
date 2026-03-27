from src.inference.preference_builder import build_inferred_preferences
from src.models import FragranceProfile, NoteInfo, CollectionItem


def _frag(note_names: list[str]) -> FragranceProfile:
    return FragranceProfile(
        id=1, name="T", brand="B",
        notes=[NoteInfo(name=n, category="woody", layer="base") for n in note_names],
        main_accords={},
    )


def test_own_no_rating_positive():
    collection = [CollectionItem(fragrance=_frag(["oud", "amber"]), status="own", rating=None)]
    prefs = build_inferred_preferences(collection)
    pref_map = {p.note_name: p.preference for p in prefs}
    assert pref_map["oud"] == "like"
    assert pref_map["amber"] == "like"


def test_own_high_rating_strong_positive():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5)]
    prefs = build_inferred_preferences(collection)
    assert prefs[0].preference == "love"


def test_own_rating_3_mild_positive():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="own", rating=3)]
    prefs = build_inferred_preferences(collection)
    assert prefs[0].preference == "like"


def test_own_low_rating_no_inference():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="own", rating=1)]
    prefs = build_inferred_preferences(collection)
    assert len(prefs) == 0


def test_tried_no_rating_no_inference():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="tried", rating=None)]
    prefs = build_inferred_preferences(collection)
    assert len(prefs) == 0


def test_tried_low_rating_negative():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="tried", rating=1)]
    prefs = build_inferred_preferences(collection)
    assert prefs[0].preference == "dislike"


def test_want_excluded():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="want", rating=None)]
    prefs = build_inferred_preferences(collection)
    assert len(prefs) == 0


def test_multiple_fragrances_aggregates():
    collection = [
        CollectionItem(fragrance=_frag(["oud", "amber"]), status="own", rating=5),
        CollectionItem(fragrance=_frag(["oud", "rose"]), status="own", rating=5),
    ]
    prefs = build_inferred_preferences(collection)
    pref_map = {p.note_name: p.preference for p in prefs}
    assert pref_map["oud"] == "love"


def test_mixed_signals_weighted_aggregation():
    """A single dislike from tried+low-rating shouldn't override multiple strong positives."""
    collection = [
        CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5),  # love
        CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5),  # love
        CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5),  # love
        CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5),  # love
        CollectionItem(fragrance=_frag(["oud"]), status="tried", rating=1),  # dislike
    ]
    prefs = build_inferred_preferences(collection)
    pref_map = {p.note_name: p.preference for p in prefs}
    # 4x love (3.0) + 1x dislike (0.0) = avg 2.4 -> "like", NOT "dislike"
    assert pref_map["oud"] == "like"


def test_all_inferred_source():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5)]
    prefs = build_inferred_preferences(collection)
    assert all(p.source == "inferred" for p in prefs)
