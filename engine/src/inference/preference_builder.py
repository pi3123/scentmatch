from collections import defaultdict
from ..models import CollectionItem, NotePreference


def _get_signal(status: str, rating: int | None) -> str | None:
    if status == "want":
        return None
    if status == "own":
        if rating is None:
            return "like"
        elif rating >= 4:
            return "love"
        elif rating == 3:
            return "like"
        else:
            return None
    if status == "tried":
        if rating is None:
            return None
        elif rating >= 4:
            return "love"
        elif rating == 3:
            return "like"
        else:
            return "dislike"
    return None


SIGNAL_SCORE = {"love": 3.0, "like": 2.0, "neutral": 1.0, "dislike": 0.0}


def _score_to_preference(avg: float) -> str:
    if avg >= 2.5:
        return "love"
    elif avg >= 1.5:
        return "like"
    elif avg >= 0.75:
        return "neutral"
    else:
        return "dislike"


def build_inferred_preferences(
    collection: list[CollectionItem],
) -> list[NotePreference]:
    note_signals: dict[str, list[str]] = defaultdict(list)
    note_categories: dict[str, str] = {}

    for item in collection:
        signal = _get_signal(item.status, item.rating)
        if signal is None:
            continue
        for note in item.fragrance.notes:
            name = note.name.lower()
            note_signals[name].append(signal)
            if note.category:
                note_categories[name] = note.category

    result = []
    for note_name, signals in note_signals.items():
        scores = [SIGNAL_SCORE[s] for s in signals]
        avg = sum(scores) / len(scores)
        final = _score_to_preference(avg)
        result.append(
            NotePreference(
                note_name=note_name,
                category=note_categories.get(note_name, ""),
                preference=final,
                source="inferred",
            )
        )

    return result
