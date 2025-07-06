# backend/crud.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Dict, Any
import models, schemas

class BaseCRUD:
    def __init__(self, model):
        self.model = model

    def get(self, db: Session, id: int):
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100, is_active: bool = True):
        query = db.query(self.model)
        if hasattr(self.model, 'is_active'):
            query = query.filter(self.model.is_active == is_active)
        if hasattr(self.model, 'display_order'):
            query = query.order_by(self.model.display_order, self.model.id)
        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in):
        if isinstance(obj_in, dict):
            db_obj = self.model(**obj_in)
        else:
            obj_data = obj_in.dict()
            db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj, obj_in):
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, id: int):
        obj = db.query(self.model).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def soft_delete(self, db: Session, *, id: int):
        obj = db.query(self.model).get(id)
        if obj and hasattr(obj, 'is_active'):
            obj.is_active = False
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj

class SchoolLevelCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(models.SchoolLevel)

    def get_by_school(self, db: Session, school_id: int):
        return db.query(self.model).filter(
            and_(self.model.school_id == school_id, self.model.is_active == True)
        ).order_by(self.model.display_order).all()

    def get_with_hierarchy(self, db: Session, school_level_id: int):
        return db.query(self.model).options(
            joinedload(self.model.forms_grades)
            .joinedload(models.FormGrade.terms)
            .joinedload(models.Term.subjects)
            .joinedload(models.Subject.topics)
            .joinedload(models.Topic.subtopics)
        ).filter(self.model.id == school_level_id).first()

class FormGradeCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(models.FormGrade)

    def get_by_school_level(self, db: Session, school_level_id: int):
        return db.query(self.model).filter(
            and_(self.model.school_level_id == school_level_id, self.model.is_active == True)
        ).order_by(self.model.display_order).all()

    def get_by_code(self, db: Session, code: str, school_level_id: int):
        return db.query(self.model).filter(
            and_(
                self.model.code == code,
                self.model.school_level_id == school_level_id,
                self.model.is_active == True
            )
        ).first()

class TermCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(models.Term)

    def get_by_form_grade(self, db: Session, form_grade_id: int):
        return db.query(self.model).filter(
            and_(self.model.form_grade_id == form_grade_id, self.model.is_active == True)
        ).order_by(self.model.display_order).all()

    def get_current_terms(self, db: Session):
        from datetime import datetime
        now = datetime.now()
        return db.query(self.model).filter(
            and_(
                self.model.start_date <= now,
                self.model.end_date >= now,
                self.model.is_active == True
            )
        ).all()

class SubjectCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(models.Subject)

    def get_by_term(self, db: Session, term_id: int):
        return db.query(self.model).filter(
            and_(self.model.term_id == term_id, self.model.is_active == True)
        ).order_by(self.model.display_order).all()

    def get_by_code(self, db: Session, code: str, term_id: int):
        return db.query(self.model).filter(
            and_(
                self.model.code == code,
                self.model.term_id == term_id,
                self.model.is_active == True
            )
        ).first()

    def get_with_topics(self, db: Session, subject_id: int):
        return db.query(self.model).options(
            joinedload(self.model.topics).joinedload(models.Topic.subtopics)
        ).filter(self.model.id == subject_id).first()

    def search_subjects(self, db: Session, query: str, limit: int = 20):
        return db.query(self.model).filter(
            and_(
                or_(
                    self.model.name.ilike(f"%{query}%"),
                    self.model.code.ilike(f"%{query}%"),
                    self.model.description.ilike(f"%{query}%")
                ),
                self.model.is_active == True
            )
        ).limit(limit).all()

class TopicCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(models.Topic)

    def get_by_subject(self, db: Session, subject_id: int):
        return db.query(self.model).filter(
            and_(self.model.subject_id == subject_id, self.model.is_active == True)
        ).order_by(self.model.display_order).all()

    def get_with_subtopics(self, db: Session, topic_id: int):
        return db.query(self.model).options(
            joinedload(self.model.subtopics)
        ).filter(self.model.id == topic_id).first()

    def search_topics(self, db: Session, query: str, subject_id: Optional[int] = None):
        filters = [
            or_(
                self.model.title.ilike(f"%{query}%"),
                self.model.description.ilike(f"%{query}%")
            ),
            self.model.is_active == True
        ]
        
        if subject_id:
            filters.append(self.model.subject_id == subject_id)
        
        return db.query(self.model).filter(and_(*filters)).all()

class SubtopicCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(models.Subtopic)

    def get_by_topic(self, db: Session, topic_id: int):
        return db.query(self.model).filter(
            and_(self.model.topic_id == topic_id, self.model.is_active == True)
        ).order_by(self.model.display_order).all()

    def search_subtopics(self, db: Session, query: str, topic_id: Optional[int] = None):
        filters = [
            or_(
                self.model.title.ilike(f"%{query}%"),
                self.model.content.ilike(f"%{query}%")
            ),
            self.model.is_active == True
        ]
        
        if topic_id:
            filters.append(self.model.topic_id == topic_id)
        
        return db.query(self.model).filter(and_(*filters)).all()

    def get_by_duration(self, db: Session, min_lessons: int, max_lessons: int):
        return db.query(self.model).filter(
            and_(
                self.model.duration_lessons >= min_lessons,
                self.model.duration_lessons <= max_lessons,
                self.model.is_active == True
            )
        ).all()

# Utility functions
class HierarchyCRUD:
    def __init__(self):
        pass

    def get_full_hierarchy(self, db: Session, school_id: int):
        """Get complete curriculum hierarchy for a school"""
        return db.query(models.SchoolLevel).options(
            joinedload(models.SchoolLevel.forms_grades)
            .joinedload(models.FormGrade.terms)
            .joinedload(models.Term.subjects)
            .joinedload(models.Subject.topics)
            .joinedload(models.Topic.subtopics)
        ).filter(
            and_(
                models.SchoolLevel.school_id == school_id,
                models.SchoolLevel.is_active == True
            )
        ).order_by(models.SchoolLevel.display_order).all()

    def get_statistics(self, db: Session, school_id: Optional[int] = None):
        """Get statistics for the curriculum hierarchy"""
        base_query = db.query(models.SchoolLevel)
        if school_id:
            base_query = base_query.filter(models.SchoolLevel.school_id == school_id)
        
        school_levels = base_query.filter(models.SchoolLevel.is_active == True).count()
        
        # Get related counts
        forms_grades = db.query(models.FormGrade).join(models.SchoolLevel).filter(
            models.FormGrade.is_active == True
        )
        if school_id:
            forms_grades = forms_grades.filter(models.SchoolLevel.school_id == school_id)
        forms_grades_count = forms_grades.count()

        terms = db.query(models.Term).join(models.FormGrade).join(models.SchoolLevel).filter(
            models.Term.is_active == True
        )
        if school_id:
            terms = terms.filter(models.SchoolLevel.school_id == school_id)
        terms_count = terms.count()

        subjects = db.query(models.Subject).join(models.Term).join(models.FormGrade).join(models.SchoolLevel).filter(
            models.Subject.is_active == True
        )
        if school_id:
            subjects = subjects.filter(models.SchoolLevel.school_id == school_id)
        subjects_count = subjects.count()

        topics = db.query(models.Topic).join(models.Subject).join(models.Term).join(models.FormGrade).join(models.SchoolLevel).filter(
            models.Topic.is_active == True
        )
        if school_id:
            topics = topics.filter(models.SchoolLevel.school_id == school_id)
        topics_count = topics.count()

        subtopics = db.query(models.Subtopic).join(models.Topic).join(models.Subject).join(models.Term).join(models.FormGrade).join(models.SchoolLevel).filter(
            models.Subtopic.is_active == True
        )
        if school_id:
            subtopics = subtopics.filter(models.SchoolLevel.school_id == school_id)
        subtopics_count = subtopics.count()

        return {
            "total_school_levels": school_levels,
            "total_forms_grades": forms_grades_count,
            "total_terms": terms_count,
            "total_subjects": subjects_count,
            "total_topics": topics_count,
            "total_subtopics": subtopics_count
        }

    def duplicate_structure(self, db: Session, source_id: int, target_id: int, level: str):
        """Duplicate curriculum structure from one entity to another"""
        # Implementation for duplicating curriculum structures
        # This would be useful for copying term structures, etc.
        pass

# Initialize CRUD instances
school_level = SchoolLevelCRUD()
form_grade = FormGradeCRUD()
term = TermCRUD()
subject = SubjectCRUD()
topic = TopicCRUD()
subtopic = SubtopicCRUD()
hierarchy = HierarchyCRUD()