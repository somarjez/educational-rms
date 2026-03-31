"""Payload mapper helpers for simulation API responses."""


def serialize_room(room):
    return {
        'id': room.id,
        'name': room.name,
        'capacity': room.capacity,
        'equipment': [
            {
                'id': re.equipment.id,
                'name': re.equipment.name,
                'quantity': re.quantity,
            }
            for re in room.room_equipment.all()
        ],
    }


def serialize_equipment(eq):
    return {
        'id': eq.id,
        'name': eq.name,
        'quantity': eq.quantity,
        'is_active': eq.is_active,
    }


def serialize_history_run(run):
    scenario = run.scenario
    return {
        'id': run.id,
        'scenario': scenario.id,
        'scenario_name': scenario.name,
        'scenario_description': scenario.description,
        'scenario_created_at': scenario.created_at,
        'run_date': run.run_date,
        'metrics': run.metrics,
        'raw_data': run.raw_data,
        'parameters': scenario.parameters,
        'num_replications': scenario.num_replications,
    }


def serialize_backup_scenario(scenario):
    return {
        'id': scenario.id,
        'name': scenario.name,
        'description': scenario.description,
        'parameters': scenario.parameters,
        'num_replications': scenario.num_replications,
        'created_at': scenario.created_at,
    }


def serialize_backup_result(result, include_raw):
    payload = {
        'id': result.id,
        'scenario_id': result.scenario_id,
        'scenario_name': result.scenario.name,
        'run_date': result.run_date,
        'metrics': result.metrics,
    }
    if include_raw:
        payload['raw_data'] = result.raw_data
    return payload
