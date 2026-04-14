"""Reusable query filter builders for simulation endpoints."""

from django.db.models import Q


HISTORY_TYPE_KEYWORDS = {
    'room-usage': ['room usage simulation', 'room usage'],
    'equipment-usage': ['equipment usage simulation', 'equipment usage'],
    'peak-hour': ['peak-hour scenario simulation', 'peak-hour', 'peak hour'],
    'what-if': ['what-if analysis', 'what-if', 'what if'],
    'shortage': ['shortage scenario simulation', 'shortage scenario', 'shortage'],
}


def _simulation_type_aliases(simulation_type):
    if not simulation_type:
        return []

    normalized_dash = str(simulation_type).replace('_', '-')
    normalized_underscore = str(simulation_type).replace('-', '_')

    aliases = [str(simulation_type), normalized_dash, normalized_underscore]
    return list(dict.fromkeys(aliases))


def build_result_category_filter(simulation_type, include_legacy=False, keywords_map=None):
    if not simulation_type:
        return Q()

    keywords_source = keywords_map or HISTORY_TYPE_KEYWORDS
    aliases = _simulation_type_aliases(simulation_type)

    typed_filter = Q(scenario__parameters__simulation_type__in=aliases)
    if not include_legacy:
        return typed_filter

    keywords = keywords_source.get(str(simulation_type).replace('_', '-'), [])
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
    aliases = _simulation_type_aliases(simulation_type)

    typed_filter = Q(parameters__simulation_type__in=aliases)
    if not include_legacy:
        return typed_filter

    keywords = keywords_source.get(str(simulation_type).replace('_', '-'), [])
    if not keywords:
        return typed_filter

    keyword_filter = Q()
    for keyword in keywords:
        keyword_filter |= Q(name__icontains=keyword)
        keyword_filter |= Q(description__icontains=keyword)

    legacy_filter = Q(parameters__simulation_type__isnull=True) | Q(parameters__simulation_type='')
    return typed_filter | (legacy_filter & keyword_filter)
