"""Serializers for simulation app."""
from rest_framework import serializers
from ..models import SimulationScenario, SimulationResult, SimulationAuditLog
from apps.scheduling.models import Room, Equipment


class SimulationScenarioSerializer(serializers.ModelSerializer):
    """Serializer for SimulationScenario."""
    parameters = serializers.JSONField(required=False)
    arrival_model = serializers.CharField(required=False)
    arrival_rate = serializers.FloatField(required=False)
    service_distribution = serializers.CharField(required=False)
    service_rate = serializers.FloatField(required=False)
    service_time = serializers.FloatField(required=False)
    num_servers = serializers.IntegerField(required=False)
    simulation_hours = serializers.FloatField(required=False)
    prng = serializers.CharField(required=False)
    seed = serializers.IntegerField(required=False, allow_null=True)
    room_id = serializers.IntegerField(required=False)
    equipment_id = serializers.IntegerField(required=False)
    simulation_type = serializers.CharField(required=False)

    class Meta:
        model = SimulationScenario
        fields = [
            'id', 'name', 'description', 'parameters', 'num_replications',
            'room_id', 'equipment_id', 'simulation_type',
            'arrival_model', 'arrival_rate', 'service_distribution',
            'service_rate', 'service_time', 'num_servers', 'simulation_hours',
            'prng', 'seed', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        arrival_model = data.get('arrival_model') or data.get('parameters', {}).get('arrival_model')
        service_distribution = data.get('service_distribution') or data.get('parameters', {}).get('service_distribution')
        arrival_rate = data.get('arrival_rate') or data.get('parameters', {}).get('arrival_rate')
        service_rate = data.get('service_rate') or data.get('parameters', {}).get('service_rate')
        service_time = data.get('service_time') or data.get('parameters', {}).get('service_time')
        num_servers = data.get('num_servers') or data.get('parameters', {}).get('num_servers')
        simulation_hours = data.get('simulation_hours') or data.get('parameters', {}).get('simulation_hours')
        room_id = data.get('room_id') or data.get('parameters', {}).get('room_id')
        equipment_id = data.get('equipment_id') or data.get('parameters', {}).get('equipment_id')

        if arrival_model and arrival_model not in ['poisson', 'exponential']:
            raise serializers.ValidationError({'arrival_model': 'Must be poisson or exponential.'})

        if service_distribution and service_distribution not in ['exponential', 'fixed']:
            raise serializers.ValidationError({'service_distribution': 'Must be exponential or fixed.'})

        if arrival_rate is not None and arrival_rate <= 0:
            raise serializers.ValidationError({'arrival_rate': 'Must be greater than 0.'})

        if service_distribution == 'exponential' and (service_rate is None or service_rate <= 0):
            raise serializers.ValidationError({'service_rate': 'Must be greater than 0 for exponential distribution.'})

        if service_distribution == 'fixed' and (service_time is None or service_time <= 0):
            raise serializers.ValidationError({'service_time': 'Must be greater than 0 for fixed distribution.'})

        if num_servers is not None and num_servers < 1:
            raise serializers.ValidationError({'num_servers': 'Must be at least 1.'})

        if simulation_hours is not None and simulation_hours <= 0:
            raise serializers.ValidationError({'simulation_hours': 'Must be greater than 0.'})

        if room_id is not None:
            try:
                room_id = int(room_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError({'room_id': 'Must be a valid room id.'})
            if room_id < 1 or not Room.objects.filter(id=room_id).exists():
                raise serializers.ValidationError({'room_id': 'Room does not exist.'})

        if equipment_id is not None:
            try:
                equipment_id = int(equipment_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError({'equipment_id': 'Must be a valid equipment id.'})
            if equipment_id < 1 or not Equipment.objects.filter(id=equipment_id).exists():
                raise serializers.ValidationError({'equipment_id': 'Equipment does not exist.'})

        return data

    def _build_parameters(self, validated_data, instance=None):
        param_keys = [
            'arrival_model', 'arrival_rate', 'service_distribution', 'service_rate',
            'service_time', 'num_servers', 'simulation_hours', 'prng', 'seed',
            'room_id', 'equipment_id', 'simulation_type',
        ]
        parameters = {}
        if instance and instance.parameters:
            parameters.update(instance.parameters)
        parameters.update(validated_data.pop('parameters', {}) or {})

        for key in param_keys:
            if key in validated_data:
                parameters[key] = validated_data.pop(key)

        return parameters

    def create(self, validated_data):
        parameters = self._build_parameters(validated_data)
        validated_data['parameters'] = parameters
        return super().create(validated_data)

    def update(self, instance, validated_data):
        parameters = self._build_parameters(validated_data, instance=instance)
        validated_data['parameters'] = parameters
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        params = instance.parameters or {}
        data['arrival_model'] = params.get('arrival_model')
        data['arrival_rate'] = params.get('arrival_rate')
        data['service_distribution'] = params.get('service_distribution')
        data['service_rate'] = params.get('service_rate')
        data['service_time'] = params.get('service_time')
        data['num_servers'] = params.get('num_servers')
        data['simulation_hours'] = params.get('simulation_hours')
        data['prng'] = params.get('prng')
        data['seed'] = params.get('seed')
        data['room_id'] = params.get('room_id')
        data['equipment_id'] = params.get('equipment_id')
        data['simulation_type'] = params.get('simulation_type', instance.simulation_type)
        return data


class SimulationResultSerializer(serializers.ModelSerializer):
    """Serializer for SimulationResult."""

    class Meta:
        model = SimulationResult
        fields = [
            'id', 'scenario', 'run_date', 'metrics', 'category_metrics', 'raw_data'
        ]
        read_only_fields = ['id', 'run_date']


class SimulationAuditLogSerializer(serializers.ModelSerializer):
    scenario_name = serializers.CharField(source='scenario.name', read_only=True)

    class Meta:
        model = SimulationAuditLog
        fields = [
            'id', 'action', 'level', 'message', 'metadata',
            'scenario', 'scenario_name', 'result', 'created_at'
        ]
        read_only_fields = fields
