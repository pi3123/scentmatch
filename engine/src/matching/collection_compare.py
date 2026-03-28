from ..models import FragranceProfile, CollectionItem, CollectionComparison


def _note_set(frag: FragranceProfile) -> set[str]:
    return {n.name.lower() for n in frag.notes}


def _jaccard_similarity(set_a: set[str], set_b: set[str]) -> float:
    if not set_a and not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union) if union else 0.0


def find_collection_comparisons(
    target: FragranceProfile,
    collection: list[CollectionItem],
    max_results: int = 3,
) -> list[CollectionComparison]:
    experienced = [item for item in collection if item.status in ("own", "tried")]

    if not experienced:
        return []

    target_notes = _note_set(target)
    scored = []

    for item in experienced:
        item_notes = _note_set(item.fragrance)
        similarity = _jaccard_similarity(target_notes, item_notes)
        shared = sorted(target_notes & item_notes)
        unique_to_target = sorted(target_notes - item_notes)
        unique_to_item = sorted(item_notes - target_notes)

        diff_parts = []
        if unique_to_target:
            diff_parts.append(f"{target.name} adds {', '.join(unique_to_target[:3])}")
        if unique_to_item:
            diff_parts.append(f"without {', '.join(unique_to_item[:3])}")

        scored.append(
            CollectionComparison(
                fragrance_name=item.fragrance.name,
                fragrance_brand=item.fragrance.brand,
                similarity=round(similarity, 3),
                shared_notes=shared,
                differences="; ".join(diff_parts) if diff_parts else "very similar note profiles",
            )
        )

    scored.sort(key=lambda c: c.similarity, reverse=True)
    return scored[:max_results]
