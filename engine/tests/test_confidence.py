from src.matching.confidence import calculate_confidence, get_active_layers


def test_no_data_returns_none():
    layers = get_active_layers(experienced_count=0, has_note_prefs=False)
    conf = calculate_confidence(layers, experienced_count=0)
    assert layers == []
    assert conf == "none"


def test_one_fragrance_activates_layer_1_only():
    layers = get_active_layers(experienced_count=1, has_note_prefs=False)
    assert 1 in layers
    assert 2 not in layers
    assert 3 not in layers


def test_one_fragrance_with_prefs_activates_1_and_3():
    layers = get_active_layers(experienced_count=1, has_note_prefs=True)
    assert 1 in layers
    assert 3 in layers
    assert 2 not in layers


def test_five_fragrances_with_prefs_activates_all():
    layers = get_active_layers(experienced_count=5, has_note_prefs=True)
    assert layers == [1, 2, 3]


def test_low_confidence_with_partial_layers():
    layers = [1, 3]
    conf = calculate_confidence(layers, experienced_count=3)
    assert conf == "low"


def test_medium_confidence_all_layers():
    layers = [1, 2, 3]
    conf = calculate_confidence(layers, experienced_count=7)
    assert conf == "medium"


def test_high_confidence_all_layers_10_plus():
    layers = [1, 2, 3]
    conf = calculate_confidence(layers, experienced_count=10)
    assert conf == "high"


def test_want_items_not_counted_as_experienced():
    layers = get_active_layers(experienced_count=0, has_note_prefs=True)
    assert 1 not in layers
    assert 3 in layers
