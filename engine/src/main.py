from fastapi import FastAPI
from .models import MatchRequest, MatchResult

app = FastAPI(title="ScentMatch Engine", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/match", response_model=MatchResult)
def match(request: MatchRequest) -> MatchResult:
    # Placeholder — will be implemented in Phase 2
    return MatchResult(
        match_score=0,
        confidence="none",
        note_breakdown={"loved": [], "liked": [], "neutral": [], "disliked": []},
        collection_comparisons=[],
        risk_factors=[],
        active_layers=[],
    )
