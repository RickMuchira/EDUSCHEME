from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
import uuid
import json
from datetime import datetime, timedelta

from . import models, schemas
from .analytics import TimetableAnalyzer

class TimetableCRUD:
    def __init__(self):
        self.analyzer = TimetableAnalyzer()

    # === TIMETABLE OPERATIONS ===
    def create_timetable(self, db: Session, timetable: schemas.TimetableCreate, user_id: int) -> models.Timetable:
        """Create a new timetable"""
        db_timetable = models.Timetable(
            id=str(uuid.uuid4()),
            user_id=user_id,
            subject_id=timetable.subject_id,
            name=timetable.name,
            description=timetable.description,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(db_timetable)
        db.commit()
        db.refresh(db_timetable)
        return db_timetable

    def get_timetable(self, db: Session, timetable_id: str, user_id: int) -> Optional[models.Timetable]:
        """Get a specific timetable by ID"""
        return db.query(models.Timetable).filter(
            and_(
                models.Timetable.id == timetable_id,
                models.Timetable.user_id == user_id,
                models.Timetable.is_active == True
            )
        ).first()

    def get_timetable_with_slots(self, db: Session, timetable_id: str, user_id: int) -> Optional[models.Timetable]:
        """Get timetable with all slots loaded"""
        return db.query(models.Timetable).options(
            joinedload(models.Timetable.slots)
        ).filter(
            and_(
                models.Timetable.id == timetable_id,
                models.Timetable.user_id == user_id,
                models.Timetable.is_active == True
            )
        ).first()

    def get_user_timetables(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Timetable]:
        """Get all timetables for a user"""
        return db.query(models.Timetable).filter(
            and_(
                models.Timetable.user_id == user_id,
                models.Timetable.is_active == True
            )
        ).offset(skip).limit(limit).all()

    def update_timetable(self, db: Session, timetable_id: str, user_id: int, 
                        timetable_update: schemas.TimetableUpdate) -> Optional[models.Timetable]:
        """Update timetable details"""
        db_timetable = self.get_timetable(db, timetable_id, user_id)
        if not db_timetable:
            return None
            
        update_data = timetable_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_timetable, field, value)
        
        db_timetable.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_timetable)
        return db_timetable

    def delete_timetable(self, db: Session, timetable_id: str, user_id: int) -> bool:
        """Soft delete a timetable"""
        db_timetable = self.get_timetable(db, timetable_id, user_id)
        if not db_timetable:
            return False
            
        db_timetable.is_active = False
        db.commit()
        return True

    # === SLOT OPERATIONS ===
    def create_slot(self, db: Session, slot: schemas.TimetableSlotCreate, 
                   timetable_id: str, user_id: int) -> Optional[models.TimetableSlot]:
        """Create a new time slot"""
        # Verify timetable ownership
        timetable = self.get_timetable(db, timetable_id, user_id)
        if not timetable:
            return None
            
        # Check for existing slot at this time
        existing = self.get_slot_by_time(db, timetable_id, slot.day_of_week, slot.time_slot)
        if existing:
            return None  # Conflict
            
        db_slot = models.TimetableSlot(
            id=str(uuid.uuid4()),
            timetable_id=timetable_id,
            day_of_week=slot.day_of_week,
            time_slot=slot.time_slot,
            period_number=slot.period_number,
            is_double_lesson=slot.is_double_lesson,
            double_position=slot.double_position,
            is_evening=slot.is_evening,
            notes=slot.notes,
            created_at=datetime.utcnow()
        )
        
        db.add(db_slot)
        db.commit()
        db.refresh(db_slot)
        
        # Update analytics
        self._update_analytics(db, timetable_id)
        
        return db_slot

    def get_slot_by_time(self, db: Session, timetable_id: str, day: str, time: str) -> Optional[models.TimetableSlot]:
        """Get slot by specific day and time"""
        return db.query(models.TimetableSlot).filter(
            and_(
                models.TimetableSlot.timetable_id == timetable_id,
                models.TimetableSlot.day_of_week == day,
                models.TimetableSlot.time_slot == time
            )
        ).first()

    def get_timetable_slots(self, db: Session, timetable_id: str) -> List[models.TimetableSlot]:
        """Get all slots for a timetable"""
        return db.query(models.TimetableSlot).filter(
            models.TimetableSlot.timetable_id == timetable_id
        ).order_by(models.TimetableSlot.period_number).all()

    def delete_slot(self, db: Session, slot_id: str, timetable_id: str, user_id: int) -> bool:
        """Delete a time slot"""
        # Verify ownership
        timetable = self.get_timetable(db, timetable_id, user_id)
        if not timetable:
            return False
            
        db_slot = db.query(models.TimetableSlot).filter(
            and_(
                models.TimetableSlot.id == slot_id,
                models.TimetableSlot.timetable_id == timetable_id
            )
        ).first()
        
        if not db_slot:
            return False
        
        # If it's part of a double lesson, handle the partner
        if db_slot.is_double_lesson:
            partner_slot = self._find_double_lesson_partner(db, db_slot)
            if partner_slot:
                db.delete(partner_slot)
        
        db.delete(db_slot)
        db.commit()
        
        # Update analytics
        self._update_analytics(db, timetable_id)
        
        return True

    def create_double_lesson(self, db: Session, timetable_id: str, slot1_id: str, 
                           slot2_id: str, user_id: int) -> Optional[Dict[str, models.TimetableSlot]]:
        """Convert two adjacent slots into a double lesson"""
        # Verify ownership
        timetable = self.get_timetable(db, timetable_id, user_id)
        if not timetable:
            return None
            
        slot1 = db.query(models.TimetableSlot).filter(models.TimetableSlot.id == slot1_id).first()
        slot2 = db.query(models.TimetableSlot).filter(models.TimetableSlot.id == slot2_id).first()
        
        if not slot1 or not slot2:
            return None
            
        # Verify they're adjacent and same day
        if (slot1.day_of_week != slot2.day_of_week or 
            abs(slot1.period_number - slot2.period_number) != 1):
            return None
            
        # Determine top and bottom
        if slot1.period_number < slot2.period_number:
            top_slot, bottom_slot = slot1, slot2
        else:
            top_slot, bottom_slot = slot2, slot1
            
        # Update both slots
        top_slot.is_double_lesson = True
        top_slot.double_position = "top"
        bottom_slot.is_double_lesson = True
        bottom_slot.double_position = "bottom"
        
        db.commit()
        
        # Update analytics
        self._update_analytics(db, timetable_id)
        
        return {"top_slot": top_slot, "bottom_slot": bottom_slot}

    def bulk_create_slots(self, db: Session, slots_data: schemas.BulkSlotCreate, 
                         timetable_id: str, user_id: int) -> List[models.TimetableSlot]:
        """Create multiple slots at once (for templates)"""
        # Verify ownership
        timetable = self.get_timetable(db, timetable_id, user_id)
        if not timetable:
            return []
            
        created_slots = []
        
        for slot_data in slots_data.slots:
            # Check for conflicts
            existing = self.get_slot_by_time(db, timetable_id, slot_data.day_of_week, slot_data.time_slot)
            if existing:
                continue  # Skip conflicting slots
                
            db_slot = models.TimetableSlot(
                id=str(uuid.uuid4()),
                timetable_id=timetable_id,
                day_of_week=slot_data.day_of_week,
                time_slot=slot_data.time_slot,
                period_number=slot_data.period_number,
                is_double_lesson=slot_data.is_double_lesson,
                double_position=slot_data.double_position,
                is_evening=slot_data.is_evening,
                notes=slot_data.notes,
                created_at=datetime.utcnow()
            )
            
            db.add(db_slot)
            created_slots.append(db_slot)
        
        db.commit()
        
        # Update analytics
        self._update_analytics(db, timetable_id)
        
        return created_slots

    # === ANALYTICS OPERATIONS ===
    def get_analytics(self, db: Session, timetable_id: str, user_id: int) -> Optional[models.TimetableAnalytics]:
        """Get latest analytics for a timetable"""
        # Verify ownership
        timetable = self.get_timetable(db, timetable_id, user_id)
        if not timetable:
            return None
            
        return db.query(models.TimetableAnalytics).filter(
            models.TimetableAnalytics.timetable_id == timetable_id
        ).order_by(models.TimetableAnalytics.recorded_at.desc()).first()

    def _update_analytics(self, db: Session, timetable_id: str):
        """Update analytics for a timetable"""
        slots = self.get_timetable_slots(db, timetable_id)
        analysis = self.analyzer.analyze_schedule(slots)
        
        # Delete old analytics
        db.query(models.TimetableAnalytics).filter(
            models.TimetableAnalytics.timetable_id == timetable_id
        ).delete()
        
        # Create new analytics
        db_analytics = models.TimetableAnalytics(
            id=str(uuid.uuid4()),
            timetable_id=timetable_id,
            total_sessions=analysis['total_sessions'],
            total_hours=analysis['total_hours'],
            single_lessons=analysis['single_lessons'],
            double_lessons=analysis['double_lessons'],
            evening_lessons=analysis['evening_lessons'],
            workload_level=analysis['workload_level'],
            pattern_type=analysis['pattern_type'],
            efficiency_score=analysis['efficiency_score'],
            daily_distribution=json.dumps(analysis['daily_distribution']),
            recorded_at=datetime.utcnow()
        )
        
        db.add(db_analytics)
        db.commit()

    # === TEMPLATE OPERATIONS ===
    def save_as_template(self, db: Session, template: schemas.TimetableTemplateCreate, 
                        user_id: int) -> models.TimetableTemplate:
        """Save current timetable as reusable template"""
        template_data = [slot.dict() for slot in template.slots]
        
        db_template = models.TimetableTemplate(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=template.name,
            description=template.description,
            template_data=json.dumps(template_data),
            is_public=template.is_public,
            tags=template.tags,
            created_at=datetime.utcnow()
        )
        
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        return db_template

    def get_user_templates(self, db: Session, user_id: int) -> List[models.TimetableTemplate]:
        """Get user's saved templates"""
        return db.query(models.TimetableTemplate).filter(
            models.TimetableTemplate.user_id == user_id
        ).order_by(models.TimetableTemplate.created_at.desc()).all()

    def get_public_templates(self, db: Session, limit: int = 10) -> List[models.TimetableTemplate]:
        """Get popular public templates"""
        return db.query(models.TimetableTemplate).filter(
            models.TimetableTemplate.is_public == True
        ).order_by(models.TimetableTemplate.usage_count.desc()).limit(limit).all()

    # === HELPER METHODS ===
    def _find_double_lesson_partner(self, db: Session, slot: models.TimetableSlot) -> Optional[models.TimetableSlot]:
        """Find the partner slot in a double lesson"""
        if not slot.is_double_lesson:
            return None
            
        target_period = slot.period_number + (1 if slot.double_position == "top" else -1)
        
        return db.query(models.TimetableSlot).filter(
            and_(
                models.TimetableSlot.timetable_id == slot.timetable_id,
                models.TimetableSlot.day_of_week == slot.day_of_week,
                models.TimetableSlot.period_number == target_period,
                models.TimetableSlot.is_double_lesson == True
            )
        ).first()

# Create instance
timetable_crud = TimetableCRUD() 