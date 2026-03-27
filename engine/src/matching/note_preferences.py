from dataclasses import dataclass
from ..models import FragranceProfile, NotePreference, NoteBreakdown

PREFERENCE_WEIGHTS = {
    "love": 1.0,
    "like": 0.7,
    "neutral": 0.5,
    "dislike": 0.1,
}


@dataclass
class NotePreferenceResult:
    score: float  # 0.0 - 1.0
    breakdown: NoteBreakdown
    risk_factors: list[str]


def score_note_preferences(
    target: FragranceProfile,
    preferences: list[NotePreference],
) -> NotePreferenceResult:
    pref_map = {p.note_name.lower(): p.preference for p in preferences}

    loved, liked, neutral, disliked = [], [], [], []
    risk_factors = []
    weights = []

    for note in target.notes:
        name = note.name.lower()
        pref = pref_map.get(name, "neutral")

        if pref == "love":
            loved.append(name)
        elif pref == "like":
            liked.append(name)
        elif pref == "dislike":
            disliked.append(name)
            risk_factors.append(name)
        else:
            neutral.append(name)

        weights.append(PREFERENCE_WEIGHTS[pref])

    score = sum(weights) / len(weights) if weights else 0.5

    return NotePreferenceResult(
        score=round(score, 3),
        breakdown=NoteBreakdown(
            loved=loved, liked=liked, neutral=neutral, disliked=disliked
        ),
        risk_factors=risk_factors,
    )
