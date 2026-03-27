import numpy as np
from ..models import FragranceProfile, CollectionItem


def _accords_to_vector(accords: dict[str, float], all_keys: list[str]) -> np.ndarray:
    return np.array([accords.get(k, 0.0) for k in all_keys])


def score_accord_similarity(
    target: FragranceProfile,
    collection: list[CollectionItem],
) -> float | None:
    experienced = [
        item for item in collection if item.status in ("own", "tried")
    ]

    if not experienced:
        return None

    all_keys = sorted(
        set(target.main_accords.keys())
        | {k for item in experienced for k in item.fragrance.main_accords.keys()}
    )

    if not all_keys:
        return None

    target_vec = _accords_to_vector(target.main_accords, all_keys)

    collection_vecs = [
        _accords_to_vector(item.fragrance.main_accords, all_keys)
        for item in experienced
    ]
    user_profile = np.mean(collection_vecs, axis=0)

    dot = np.dot(target_vec, user_profile)
    norm_t = np.linalg.norm(target_vec)
    norm_u = np.linalg.norm(user_profile)

    if norm_t == 0 or norm_u == 0:
        return 0.0

    similarity = float(dot / (norm_t * norm_u))
    return round(max(0.0, similarity), 3)
