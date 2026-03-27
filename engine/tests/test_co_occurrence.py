from src.matching.co_occurrence import score_co_occurrence
from src.models import FragranceProfile, NoteInfo, CollectionItem


def _frag(note_names: list[str], name: str = "Test") -> FragranceProfile:
    return FragranceProfile(
        id=1, name=name, brand="B",
        notes=[NoteInfo(name=n, category="", layer="base") for n in note_names],
        main_accords={},
    )


def _item(note_names: list[str], status: str = "own") -> CollectionItem:
    return CollectionItem(fragrance=_frag(note_names), status=status)


def test_target_shares_common_pairs():
    collection = [
        _item(["oud", "amber", "cedar"]),
        _item(["oud", "amber", "cedar"]),
        _item(["oud", "amber", "cedar"]),
        _item(["oud", "amber", "cedar"]),
        _item(["oud", "amber", "cedar"]),
    ]
    target = _frag(["oud", "amber", "cedar"])
    score = score_co_occurrence(target, collection)
    assert score is not None
    assert score >= 0.7


def test_target_has_no_common_pairs():
    collection = [
        _item(["oud", "amber", "vanilla"]),
        _item(["oud", "amber", "sandalwood"]),
        _item(["oud", "amber", "musk"]),
        _item(["oud", "amber", "rose"]),
        _item(["oud", "amber", "patchouli"]),
    ]
    target = _frag(["citrus", "aquatic", "mint"])
    score = score_co_occurrence(target, collection)
    assert score is not None
    assert score < 0.3


def test_insufficient_collection_returns_none():
    collection = [_item(["oud", "amber"])]
    target = _frag(["oud", "amber"])
    score = score_co_occurrence(target, collection)
    assert score is None  # needs >= 5


def test_want_items_excluded():
    collection = [_item(["oud", "amber"], status="want")] * 6
    target = _frag(["oud", "amber"])
    score = score_co_occurrence(target, collection)
    assert score is None
