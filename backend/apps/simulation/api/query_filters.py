"""Reusable query filter builders for simulation endpoints."""

from django.db.models import Q


HISTORY_TYPE_KEYWORDS = {
    'room-usage': ['room usage simulation', 'room usage'],
    'equipment-usage': ['equipment usage simulation', 'equipment usage'],
    'peak-hour': ['peak-hour scenario simulation', 'peak-hour', 'peak hour'],
    'what-if': ['what-if analysis', 'what-if', 'what if'],
    'shortage': ['shortage scenario simulation', 'shortage scenario', 'shortage'],
}


def build_result_category_filter(simulation_type, include_legacy=False, keywords_map=None):
    if not simulation_type:
        return Q()

    keywords_source = keywords_map or HISTORY_TYPE_KEYWORDS

    typed_filter = Q(scenario__parameters__simulation_type=simulation_type)
    if not include_legacy:
        return typed_filter

    keywords = keywords_source.get(simulation_type, [])
    if not keywords:
        return typed_filter

    keyword_filter = Q()
    for keyword in keywords:
        keyword_filter |= Q(scenario__name__icontains=keyword)
        keyword_filter |= Q(scenario__description__icontains=keyword)

    legacy_filter = (
        Q(scenario__parameters__simulation_type__isnull=True)
        | Q(scenario__parameters__simulation_type='')
    )
    return typed_filter | (legacy_filter & keyword_filter)


def build_scenario_filter(simulation_type, include_legacy=False, keywords_map=None):
    if not simulation_type:
        return Q()

    keywords_source = keywords_map or HISTORY_TYPE_KEYWORDS

    typed_filter = Q(parameters__simulation_type=simulation_type)
    if not include_legacy:
        return typed_filter

    keywords = keywords_source.get(simulation_type, [])
    if not keywords:
        return typed_filter

    keyword_filter = Q()
    for keyword in keywords:
        keyword_filter |= Q(name__icontains=keyword)
        keyword_filter |= Q(description__icontains=keyword)

    legacy_filter = Q(parameters__simulation_type__isnull=True) | Q(parameters__simulation_type='')
    return typed_filter | (legacy_filter & keyword_filter)
