from fastapi import FastAPI
from .models import MatchRequest, MatchResult
from .matching.scorer import compute_match

app = FastAPI(title="ScentMatch Engine", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/match", response_model=MatchResult)
def match(request: MatchRequest) -> MatchResult:
    return compute_match(
        request.target,
        request.collection,
        request.note_preferences,
        community_stats=request.community_stats,
    )
