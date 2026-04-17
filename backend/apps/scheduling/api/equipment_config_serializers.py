"""Serializers for equipment configuration."""
from rest_framework import serializers
from ..models import Equipment, Room
from ..equipment_config import EquipmentConfigService


class RoomEquipmentConfigSerializer(serializers.Serializer):
    """Serializer for configuring equipment in a room."""
    room_id = serializers.IntegerField()
    equipment_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True
    )
    
    def validate_room_id(self, value):
        """Validate that the room exists."""
        if not Room.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Room with id {value} does not exist")
        return value
    
    def validate_equipment_ids(self, value):
        """Validate that all equipment exists."""
        if not value:
            raise serializers.ValidationError("At least one equipment item must be provided")
        
        existing_equipment = Equipment.objects.filter(id__in=value).count()
        if existing_equipment != len(value):
            raise serializers.ValidationError("Some equipment items do not exist")
        
        return value


class RoomEquipmentLinkSerializer(serializers.Serializer):
    """Serializer for linking/unlinking single equipment to/from a room."""
    room_id = serializers.IntegerField()
    equipment_id = serializers.IntegerField()
    
    def validate_room_id(self, value):
        """Validate that the room exists."""
        if not Room.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Room with id {value} does not exist")
        return value
    
    def validate_equipment_id(self, value):
        """Validate that the equipment exists."""
        if not Equipment.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Equipment with id {value} does not exist")
        return value


class RoomEquipmentDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer showing room with all linked equipment."""
    equipment = serializers.SerializerMethodField()
    equipment_summary = serializers.SerializerMethodField()
    
    def get_equipment(self, obj):
        """Get all equipment linked to the room with details."""
        from .serializers import EquipmentSerializer
        equipment = obj.equipment.all()
        return EquipmentSerializer(equipment, many=True).data
    
    def get_equipment_summary(self, obj):
        """Get summary statistics about room equipment."""
        equipment = obj.equipment.all()
        return {
            'total_items': equipment.count(),
            'total_quantity': sum(eq.quantity for eq in equipment),
            'active_equipment': equipment.filter(is_active=True).count()
        }
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'room_type', 'capacity', 'floor', 'building',
            'description', 'features', 'equipment', 'equipment_summary',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EquipmentAvailabilitySerializer(serializers.Serializer):
    """Serializer for equipment availability by room."""
    equipment_id = serializers.IntegerField()
    equipment_name = serializers.CharField()
    total_quantity = serializers.IntegerField()
    rooms_linked = serializers.IntegerField()
    rooms = serializers.ListField(
        child=serializers.DictField()
    )


class BulkRoomEquipmentUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating equipment across multiple rooms."""
    updates = serializers.DictField(
        child=serializers.ListField(
            child=serializers.IntegerField()
        )
    )
    
    def validate_updates(self, value):
        """Validate the update mapping."""
        if not value:
            raise serializers.ValidationError("At least one room must be provided")
        
        # Validate all room IDs exist
        room_ids = list(value.keys())
        existing_rooms = Room.objects.filter(id__in=room_ids).count()
        
        if existing_rooms != len(room_ids):
            invalid_rooms = set(room_ids) - set(
                Room.objects.filter(id__in=room_ids).values_list('id', flat=True)
            )
            raise serializers.ValidationError(f"Invalid room IDs: {invalid_rooms}")
        
        # Validate all equipment IDs exist
        all_equipment_ids = set()
        for equipment_ids in value.values():
            all_equipment_ids.update(equipment_ids)
        
        existing_equipment = Equipment.objects.filter(id__in=all_equipment_ids).count()
        if existing_equipment != len(all_equipment_ids):
            invalid_equipment = all_equipment_ids - set(
                Equipment.objects.filter(id__in=all_equipment_ids).values_list('id', flat=True)
            )
            raise serializers.ValidationError(f"Invalid equipment IDs: {invalid_equipment}")
        
        return value
