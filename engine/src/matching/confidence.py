def get_active_layers(experienced_count: int, has_note_prefs: bool) -> list[int]:
    layers = []
    if experienced_count >= 1:
        layers.append(1)
    if experienced_count >= 5:
        layers.append(2)
    if has_note_prefs:
        layers.append(3)
    return layers


def calculate_confidence(active_layers: list[int], experienced_count: int) -> str:
    if not active_layers:
        return "none"
    all_active = len(active_layers) == 3
    if all_active and experienced_count >= 10:
        return "high"
    elif all_active:
        return "medium"
    else:
        return "low"
