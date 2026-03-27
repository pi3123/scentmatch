from src.matching.accord_similarity import score_accord_similarity
from src.models import FragranceProfile, NoteInfo, CollectionItem


def _frag(accords: dict[str, float], name: str = "Test") -> FragranceProfile:
    return FragranceProfile(id=1, name=name, brand="B", notes=[], main_accords=accords)


def _item(accords: dict[str, float], status: str = "own", rating: int | None = None) -> CollectionItem:
    return CollectionItem(fragrance=_frag(accords), status=status, rating=rating)


def test_identical_accords_score_1():
    target = _frag({"woody": 0.8, "spicy": 0.6})
    collection = [_item({"woody": 0.8, "spicy": 0.6})]
    score = score_accord_similarity(target, collection)
    assert score >= 0.95


def test_completely_different_accords_score_low():
    target = _frag({"aquatic": 0.9, "citrus": 0.8})
    collection = [_item({"leather": 0.9, "oud": 0.8})]
    score = score_accord_similarity(target, collection)
    assert score < 0.3


def test_want_items_excluded():
    target = _frag({"woody": 0.8})
    collection = [
        _item({"woody": 0.8}, status="want"),
        _item({"citrus": 0.9}, status="own"),
    ]
    score = score_accord_similarity(target, collection)
    assert score < 0.5


def test_empty_collection_returns_none():
    target = _frag({"woody": 0.8})
    score = score_accord_similarity(target, [])
    assert score is None
