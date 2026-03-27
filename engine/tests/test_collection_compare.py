from src.matching.collection_compare import find_collection_comparisons
from src.models import FragranceProfile, NoteInfo, CollectionItem


def _frag(name: str, note_names: list[str], accords: dict[str, float] | None = None) -> FragranceProfile:
    return FragranceProfile(
        id=1, name=name, brand="Brand",
        notes=[NoteInfo(name=n, category="woody", layer="base") for n in note_names],
        main_accords=accords or {},
    )


def test_finds_similar_fragrances():
    target = _frag("Oud Wood", ["oud", "sandalwood", "amber"])
    collection = [
        CollectionItem(fragrance=_frag("Sauvage", ["oud", "amber", "pepper"]), status="own"),
        CollectionItem(fragrance=_frag("Light Blue", ["citrus", "apple", "cedar"]), status="own"),
    ]
    comparisons = find_collection_comparisons(target, collection, max_results=2)
    assert len(comparisons) >= 1
    assert comparisons[0].fragrance_name == "Sauvage"
    assert "oud" in comparisons[0].shared_notes


def test_excludes_want_items():
    target = _frag("Oud Wood", ["oud", "sandalwood"])
    collection = [
        CollectionItem(fragrance=_frag("Sauvage", ["oud", "sandalwood"]), status="want"),
    ]
    comparisons = find_collection_comparisons(target, collection)
    assert len(comparisons) == 0


def test_empty_collection():
    target = _frag("Oud Wood", ["oud"])
    comparisons = find_collection_comparisons(target, [])
    assert comparisons == []
