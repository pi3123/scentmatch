from collections import Counter
from itertools import combinations
from ..models import FragranceProfile, CollectionItem

MIN_EXPERIENCED_FOR_CO_OCCURRENCE = 5


def score_co_occurrence(
    target: FragranceProfile,
    collection: list[CollectionItem],
) -> float | None:
    experienced = [
        item for item in collection if item.status in ("own", "tried")
    ]

    if len(experienced) < MIN_EXPERIENCED_FOR_CO_OCCURRENCE:
        return None

    pair_counts: Counter[tuple[str, str]] = Counter()
    total_fragrances = len(experienced)

    for item in experienced:
        note_names = sorted(set(n.name.lower() for n in item.fragrance.notes))
        for pair in combinations(note_names, 2):
            pair_counts[pair] += 1

    if not pair_counts:
        return 0.0

    pair_freq = {pair: count / total_fragrances for pair, count in pair_counts.items()}

    target_notes = sorted(set(n.name.lower() for n in target.notes))
    target_pairs = list(combinations(target_notes, 2))

    if not target_pairs:
        return 0.0

    pair_scores = []
    for pair in target_pairs:
        freq = pair_freq.get(pair, 0.0)
        pair_scores.append(freq)

    return round(sum(pair_scores) / len(pair_scores), 3) if pair_scores else 0.0
