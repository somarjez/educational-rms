"""Views for equipment configuration management."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from api.permissions import IsAdminUser
from ..models import Room, Equipment
from ..equipment_config import EquipmentConfigService
from .equipment_config_serializers import (
    RoomEquipmentConfigSerializer,
    RoomEquipmentLinkSerializer,
    RoomEquipmentDetailSerializer,
    BulkRoomEquipmentUpdateSerializer
)


class EquipmentConfigViewSet(viewsets.ViewSet):
    """
    ViewSet for configuring equipment linked to rooms.
    
    Provides endpoints for:
    - Linking multiple equipment to a room
    - Adding/removing individual equipment from rooms
    - Viewing equipment by room
    - Bulk operations
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def configure_room_equipment(self, request):
        """
        Configure all equipment for a room.
        
        POST /api/equipment-config/configure_room_equipment/
        
        Request body:
        {
            "room_id": 1,
            "equipment_ids": [1, 2, 3]
        }
        
        Returns:
        {
            "success": true,
            "message": "Successfully linked 3 equipment items to Lab A",
            "room_id": 1,
            "equipment_count": 3
        }
        """
        serializer = RoomEquipmentConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = EquipmentConfigService.link_equipment_to_room(
                serializer.validated_data['room_id'],
                serializer.validated_data['equipment_ids']
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def add_equipment(self, request):
        """
        Add a single equipment item to a room.
        
        POST /api/equipment-config/add_equipment/
        
        Request body:
        {
            "room_id": 1,
            "equipment_id": 5
        }
        
        Returns:
        {
            "success": true,
            "message": "Successfully added Projector to Lab A",
            "equipment": {
                "id": 5,
                "name": "Projector",
                "quantity": 2
            }
        }
        """
        serializer = RoomEquipmentLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = EquipmentConfigService.add_equipment_to_room(
                serializer.validated_data['room_id'],
                serializer.validated_data['equipment_id']
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def remove_equipment(self, request):
        """
        Remove equipment from a room.
        
        POST /api/equipment-config/remove_equipment/
        
        Request body:
        {
            "room_id": 1,
            "equipment_id": 5
        }
        
        Returns:
        {
            "success": true,
            "message": "Successfully removed Projector from Lab A"
        }
        """
        serializer = RoomEquipmentLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = EquipmentConfigService.remove_equipment_from_room(
                serializer.validated_data['room_id'],
                serializer.validated_data['equipment_id']
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def get_room_equipment(self, request):
        """
        Get all equipment linked to a specific room.
        
        GET /api/equipment-config/get_room_equipment/?room_id=1
        
        Returns:
        {
            "id": 1,
            "name": "Lab A",
            "room_type": "LAB",
            "capacity": 30,
            "equipment": [...],
            "equipment_summary": {
                "total_items": 5,
                "total_quantity": 12,
                "active_equipment": 5
            }
        }
        """
        room_id = request.query_params.get('room_id')
        
        if not room_id:
            return Response(
                {'error': 'room_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            room_id = int(room_id)
            room = Room.objects.prefetch_related('equipment').get(id=room_id)
            serializer = RoomEquipmentDetailSerializer(room)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'room_id must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Room.DoesNotExist:
            return Response(
                {'error': f'Room with id {room_id} does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def get_unlinked_equipment(self, request):
        """
        Get all equipment not yet linked to a specific room.
        
        GET /api/equipment-config/get_unlinked_equipment/?room_id=1
        
        Returns:
        [
            {
                "id": 8,
                "name": "Microscope",
                "description": "Digital microscope",
                "quantity": 3,
                "is_active": true
            },
            ...
        ]
        """
        room_id = request.query_params.get('room_id')
        
        if not room_id:
            return Response(
                {'error': 'room_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            room_id = int(room_id)
            equipment = EquipmentConfigService.get_unlinked_equipment(room_id)
            from .serializers import EquipmentSerializer
            serializer = EquipmentSerializer(equipment, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'room_id must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_update(self, request):
        """
        Bulk update equipment configuration for multiple rooms.
        
        POST /api/equipment-config/bulk_update/
        
        Request body:
        {
            "updates": {
                "1": [1, 2, 3],
                "2": [1, 4, 5],
                "3": [2, 3, 4]
            }
        }
        
        Returns:
        {
            "success": true,
            "updated_rooms": [
                {
                    "room_id": 1,
                    "room_name": "Lab A",
                    "equipment_count": 3
                },
                ...
            ],
            "errors": [],
            "total_updated": 3,
            "total_errors": 0
        }
        """
        serializer = BulkRoomEquipmentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Convert string keys to integers if needed
        updates = serializer.validated_data['updates']
        updates_int = {}
        for room_id, equipment_ids in updates.items():
            room_key = int(room_id) if isinstance(room_id, str) else room_id
            updates_int[room_key] = equipment_ids
        
        result = EquipmentConfigService.bulk_update_room_equipment(updates_int)
        
        response_status = status.HTTP_200_OK if result['success'] else status.HTTP_207_MULTI_STATUS
        return Response(result, status=response_status)
    
    @action(detail=False, methods=['get'])
    def equipment_distribution(self, request):
        """
        Get distribution of equipment across all rooms with quantities.
        
        GET /api/equipment-config/equipment_distribution/
        
        Returns:
        [
            {
                "equipment_id": 1,
                "equipment_name": "Projector",
                "total_quantity": 10,
                "assigned_quantity": 7,
                "available_quantity": 3,
                "rooms_linked": 3,
                "rooms": [
                    {
                        "id": 1,
                        "name": "Lab A",
                        "room_type": "Computer Lab",
                        "quantity_in_room": 2,
                        "assigned_date": "2026-01-15T10:30:00Z"
                    },
                    ...
                ]
            },
            ...
        ]
        """
        from ..models import RoomEquipment
        
        equipment_list = Equipment.objects.filter(is_active=True).prefetch_related('equipment_rooms__room')
        
        distribution = []
        for equipment in equipment_list:
            # Get all room assignments for this equipment
            room_assignments = RoomEquipment.objects.filter(
                equipment=equipment
            ).select_related('room')
            
            rooms_with_equipment = []
            total_assigned = 0
            
            for assignment in room_assignments:
                rooms_with_equipment.append({
                    'id': assignment.room.id,
                    'name': assignment.room.name,
                    'room_type': assignment.room.get_room_type_display(),
                    'quantity_in_room': assignment.quantity,
                    'assigned_date': assignment.assigned_date.isoformat(),
                    'notes': assignment.notes
                })
                total_assigned += assignment.quantity
            
            distribution.append({
                'equipment_id': equipment.id,
                'equipment_name': equipment.name,
                'equipment_description': equipment.description,
                'equipment_category': equipment.category,
                'category': equipment.category,
                'name': equipment.name,
                'description': equipment.description,
                'total_quantity': equipment.quantity,
                'assigned_quantity': total_assigned,
                'available_quantity': equipment.quantity - total_assigned,
                'rooms_linked': len(rooms_with_equipment),
                'rooms': rooms_with_equipment
            })
        
        return Response(distribution)
    
    @action(detail=False, methods=['get'])
    def room_equipment_matrix(self, request):
        """
        Get a matrix view of all rooms and their equipment.
        Useful for overview and analysis.
        
        GET /api/equipment-config/room_equipment_matrix/
        
        Returns:
        {
            "rooms": [
                {
                    "id": 1,
                    "name": "Lab A",
                    "room_type": "LAB",
                    "equipment_ids": [1, 2, 3],
                    "equipment_count": 3
                },
                ...
            ],
            "equipment": [
                {
                    "id": 1,
                    "name": "Projector",
                    "quantity": 2,
                    "room_ids": [1, 3, 5]
                },
                ...
            ]
        }
        """
        rooms = Room.objects.filter(is_active=True).prefetch_related('equipment')
        
        rooms_data = []
        for room in rooms:
            equipment_ids = list(room.equipment.values_list('id', flat=True))
            rooms_data.append({
                'id': room.id,
                'name': room.name,
                'room_type': room.get_room_type_display(),
                'building': room.building,
                'floor': room.floor,
                'capacity': room.capacity,
                'equipment_ids': equipment_ids,
                'equipment_count': len(equipment_ids)
            })
        
        equipment_data = []
        for equipment in Equipment.objects.filter(is_active=True).prefetch_related('rooms'):
            room_ids = list(equipment.rooms.values_list('id', flat=True))
            equipment_data.append({
                'id': equipment.id,
                'name': equipment.name,
                'description': equipment.description,
                'quantity': equipment.quantity,
                'room_ids': room_ids,
                'room_count': len(room_ids)
            })
        
        return Response({
            'rooms': rooms_data,
            'equipment': equipment_data,
            'total_rooms': len(rooms_data),
            'total_equipment': len(equipment_data)
        })    
    @action(detail=False, methods=['post'], url_path='distribute-equipment')
    def distribute_equipment(self, request):
        """
        Distribute equipment to a room with specified quantity.
        
        POST /api/equipment-config/distribute-equipment/
        Body: {
            "room_id": 1,
            "equipment_id": 2,
            "quantity": 3,
            "notes": "Optional notes"
        }
        """
        from ..models import RoomEquipment
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        room_id = request.data.get('room_id')
        equipment_id = request.data.get('equipment_id')
        quantity = request.data.get('quantity', 1)
        notes = request.data.get('notes', '')
        
        if not room_id or not equipment_id:
            return Response(
                {'error': 'room_id and equipment_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            room = Room.objects.get(id=room_id, is_active=True)
            equipment = Equipment.objects.get(id=equipment_id, is_active=True)
            
            # Check if assignment already exists
            room_equipment, created = RoomEquipment.objects.get_or_create(
                room=room,
                equipment=equipment,
                defaults={'quantity': quantity, 'notes': notes}
            )
            
            if not created:
                # Update existing assignment
                room_equipment.quantity = quantity
                room_equipment.notes = notes
                room_equipment.full_clean()  # Validate
                room_equipment.save()
                message = f"Updated {equipment.name} quantity to {quantity} in {room.name}"
            else:
                room_equipment.full_clean()  # Validate
                message = f"Assigned {quantity} {equipment.name}(s) to {room.name}"
            
            return Response({
                'success': True,
                'message': message,
                'assignment': {
                    'id': room_equipment.id,
                    'room_id': room.id,
                    'room_name': room.name,
                    'equipment_id': equipment.id,
                    'equipment_name': equipment.name,
                    'quantity': room_equipment.quantity,
                    'notes': room_equipment.notes
                }
            })
            
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Equipment.DoesNotExist:
            return Response(
                {'error': 'Equipment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='remove-equipment-from-room')
    def remove_equipment_from_room(self, request):
        """
        Remove equipment assignment from a room.
        
        POST /api/equipment-config/remove-equipment-from-room/
        Body: {
            "room_id": 1,
            "equipment_id": 2
        }
        """
        from ..models import RoomEquipment
        
        room_id = request.data.get('room_id')
        equipment_id = request.data.get('equipment_id')
        
        if not room_id or not equipment_id:
            return Response(
                {'error': 'room_id and equipment_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assignment = RoomEquipment.objects.get(
                room_id=room_id,
                equipment_id=equipment_id
            )
            room_name = assignment.room.name
            equipment_name = assignment.equipment.name
            quantity = assignment.quantity
            
            assignment.delete()
            
            return Response({
                'success': True,
                'message': f"Removed {quantity} {equipment_name}(s) from {room_name}"
            })
            
        except RoomEquipment.DoesNotExist:
            return Response(
                {'error': 'Equipment assignment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], url_path='auto-distribute')
    def auto_distribute(self, request):
        """
        Automatically distribute equipment evenly across rooms.
        
        POST /api/equipment-config/auto-distribute/
        Body: {
            "equipment_id": 2,
            "room_ids": [1, 2, 3, 4]  // Optional, if not provided uses all active rooms
        }
        """
        from ..models import RoomEquipment
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        equipment_id = request.data.get('equipment_id')
        room_ids = request.data.get('room_ids')
        
        if not equipment_id:
            return Response(
                {'error': 'equipment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            equipment = Equipment.objects.get(id=equipment_id, is_active=True)
            
            # Get target rooms
            if room_ids:
                rooms = Room.objects.filter(id__in=room_ids, is_active=True)
            else:
                rooms = Room.objects.filter(is_active=True)
            
            room_count = rooms.count()
            if room_count == 0:
                return Response(
                    {'error': 'No active rooms available for distribution'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate distribution
            quantity_per_room = equipment.quantity // room_count
            remainder = equipment.quantity % room_count
            
            if quantity_per_room == 0:
                return Response(
                    {'error': f'Not enough equipment to distribute. Total: {equipment.quantity}, Rooms: {room_count}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Clear existing assignments for this equipment
            RoomEquipment.objects.filter(equipment=equipment).delete()
            
            # Create new assignments
            assignments = []
            for idx, room in enumerate(rooms):
                quantity = quantity_per_room + (1 if idx < remainder else 0)
                
                assignment = RoomEquipment.objects.create(
                    room=room,
                    equipment=equipment,
                    quantity=quantity,
                    notes=f"Auto-distributed on {timezone.now().strftime('%Y-%m-%d')}"
                )
                
                assignments.append({
                    'room_id': room.id,
                    'room_name': room.name,
                    'quantity': quantity
                })
            
            return Response({
                'success': True,
                'message': f"Distributed {equipment.quantity} {equipment.name}(s) across {room_count} rooms",
                'distribution': assignments,
                'quantity_per_room': quantity_per_room,
                'extra_units': remainder
            })
            
        except Equipment.DoesNotExist:
            return Response(
                {'error': 'Equipment not found'},
                status=status.HTTP_404_NOT_FOUND
            )