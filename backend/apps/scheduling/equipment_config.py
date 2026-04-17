"""Equipment configuration service for managing equipment linked to rooms."""
from django.db import transaction
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from .models import Equipment, Room


class EquipmentConfigService:
    """Service for configuring equipment linked to rooms."""
    
    @staticmethod
    def link_equipment_to_room(room_id, equipment_ids):
        """
        Link equipment items to a room.
        
        Args:
            room_id: ID of the room
            equipment_ids: List of equipment IDs to link
            
        Returns:
            dict: Success status and updated room data
            
        Raises:
            DRFValidationError: If room or equipment not found
        """
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            raise DRFValidationError(f"Room with id {room_id} does not exist")
        
        try:
            equipment_objects = Equipment.objects.filter(id__in=equipment_ids)
            
            if equipment_objects.count() != len(equipment_ids):
                missing_ids = set(equipment_ids) - set(equipment_objects.values_list('id', flat=True))
                raise DRFValidationError(f"Equipment with ids {missing_ids} do not exist")
            
            room.equipment.set(equipment_objects)
            
            return {
                'success': True,
                'message': f'Successfully linked {equipment_objects.count()} equipment items to {room.name}',
                'room_id': room.id,
                'equipment_count': equipment_objects.count()
            }
        except Exception as e:
            raise DRFValidationError(str(e))
    
    @staticmethod
    def add_equipment_to_room(room_id, equipment_id):
        """
        Add a single equipment item to a room.
        
        Args:
            room_id: ID of the room
            equipment_id: ID of the equipment to add
            
        Returns:
            dict: Success status and updated room data
        """
        try:
            room = Room.objects.get(id=room_id)
            equipment = Equipment.objects.get(id=equipment_id)
            
            if room.equipment.filter(id=equipment_id).exists():
                raise DRFValidationError(f"{equipment.name} is already linked to {room.name}")
            
            room.equipment.add(equipment)
            
            return {
                'success': True,
                'message': f'Successfully added {equipment.name} to {room.name}',
                'equipment': {
                    'id': equipment.id,
                    'name': equipment.name,
                    'quantity': equipment.quantity
                }
            }
        except Room.DoesNotExist:
            raise DRFValidationError(f"Room with id {room_id} does not exist")
        except Equipment.DoesNotExist:
            raise DRFValidationError(f"Equipment with id {equipment_id} does not exist")
    
    @staticmethod
    def remove_equipment_from_room(room_id, equipment_id):
        """
        Remove equipment from a room.
        
        Args:
            room_id: ID of the room
            equipment_id: ID of the equipment to remove
            
        Returns:
            dict: Success status
        """
        try:
            room = Room.objects.get(id=room_id)
            equipment = Equipment.objects.get(id=equipment_id)
            
            if not room.equipment.filter(id=equipment_id).exists():
                raise DRFValidationError(f"{equipment.name} is not linked to {room.name}")
            
            room.equipment.remove(equipment)
            
            return {
                'success': True,
                'message': f'Successfully removed {equipment.name} from {room.name}'
            }
        except Room.DoesNotExist:
            raise DRFValidationError(f"Room with id {room_id} does not exist")
        except Equipment.DoesNotExist:
            raise DRFValidationError(f"Equipment with id {equipment_id} does not exist")
    
    @staticmethod
    def get_room_equipment(room_id):
        """
        Get all equipment linked to a room.
        
        Args:
            room_id: ID of the room
            
        Returns:
            QuerySet: Equipment objects linked to the room
        """
        try:
            room = Room.objects.get(id=room_id)
            return room.equipment.all()
        except Room.DoesNotExist:
            raise DRFValidationError(f"Room with id {room_id} does not exist")
    
    @staticmethod
    def get_unlinked_equipment(room_id):
        """
        Get all equipment not linked to a room.
        
        Args:
            room_id: ID of the room
            
        Returns:
            QuerySet: Equipment objects not linked to the room
        """
        try:
            room = Room.objects.get(id=room_id)
            return Equipment.objects.exclude(rooms__id=room_id).filter(is_active=True)
        except Room.DoesNotExist:
            raise DRFValidationError(f"Room with id {room_id} does not exist")
    
    @staticmethod
    @transaction.atomic
    def bulk_update_room_equipment(room_equipment_mapping):
        """
        Bulk update equipment for multiple rooms.
        
        Args:
            room_equipment_mapping: Dict mapping room_ids to equipment_ids
                {
                    'room_id_1': [equipment_id_1, equipment_id_2],
                    'room_id_2': [equipment_id_3],
                    ...
                }
                
        Returns:
            dict: Summary of updates
        """
        updated_rooms = []
        errors = []
        
        for room_id, equipment_ids in room_equipment_mapping.items():
            try:
                room = Room.objects.get(id=room_id)
                equipment_objects = Equipment.objects.filter(id__in=equipment_ids)
                
                if equipment_objects.count() != len(equipment_ids):
                    missing_ids = set(equipment_ids) - set(equipment_objects.values_list('id', flat=True))
                    errors.append(f"Room {room.name}: Equipment ids {missing_ids} not found")
                    continue
                
                room.equipment.set(equipment_objects)
                updated_rooms.append({
                    'room_id': room.id,
                    'room_name': room.name,
                    'equipment_count': equipment_objects.count()
                })
            except Room.DoesNotExist:
                errors.append(f"Room with id {room_id} does not exist")
        
        return {
            'success': len(errors) == 0,
            'updated_rooms': updated_rooms,
            'errors': errors,
            'total_updated': len(updated_rooms),
            'total_errors': len(errors)
        }
