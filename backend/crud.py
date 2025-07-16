# backend/crud.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any, Union
import models, schemas
from models import User, SchemeOfWork, LessonPlan

class BaseCRUD:
    def __init__(self, model):
        self.model = model

    def get(self, db: Session, id: int):
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None):
        """Get multiple records with optional active filter"""
        query = db.query(self.model)
        
        # Only filter by is_active if explicitly specified
        if is_active is not None and hasattr(self.model, 'is_active'):
            query = query.filter(self.model.is_active == is_active)
        
        if hasattr(self.model, 'display_order'):
            query = query.order_by(self.model.display_order, self.model.id)
        else:
            query = query.order_by(self.model.id)
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

    def get_all_including_inactive(self, db: Session, skip: int = 0, limit: int = 100):
        """Get all school levels including inactive ones"""
        return db.query(self.model).order_by(
            self.model.display_order, 
            self.model.id
        ).offset(skip).limit(limit).all()

    def get_by_school(self, db: Session, school_id: int, include_inactive: bool = False):
        """Get school levels by school ID with option to include inactive"""
        query = db.query(self.model).filter(self.model.school_id == school_id)
        
        if not include_inactive:
            query = query.filter(self.model.is_active == True)
            
        return query.order_by(self.model.display_order).all()

    def get_by_code(self, db: Session, code: str, school_id: int, include_inactive: bool = False):
        filters = [
            self.model.code == code,
            self.model.school_id == school_id
        ]
        
        if not include_inactive:
            filters.append(self.model.is_active == True)
            
        return db.query(self.model).filter(and_(*filters)).first()

    def get_with_hierarchy(self, db: Session, school_level_id: int):
        return db.query(self.model).options(
            joinedload(self.model.sections)
            .joinedload(models.Section.forms_grades)
            .joinedload(models.FormGrade.terms)
            .joinedload(models.Term.subjects)
            .joinedload(models.Subject.topics)
            .joinedload(models.Topic.subtopics)
        ).filter(self.model.id == school_level_id).first()

    def get_all_with_relations(self, db: Session) -> List[dict]:
        """Get all school levels with their forms/grades and terms"""
        school_levels = db.query(models.SchoolLevel).options(
            joinedload(models.SchoolLevel.forms_grades).joinedload(models.FormGrade.terms)
        ).filter(models.SchoolLevel.is_active == True).all()
        
        result = []
        for level in school_levels:
            level_dict = {
                "id": level.id,
                "name": level.name,
                "code": level.code,
                "description": level.description,
                "forms_grades": []
            }
            
            for form in level.forms_grades:
                if form.is_active:
                    form_dict = {
                        "id": form.id,
                        "name": form.name,
                        "code": form.code,
                        "description": form.description,
                        "terms": []
                    }
                    
                    for term in form.terms:
                        if term.is_active:
                            term_dict = {
                                "id": term.id,
                                "name": term.name,
                                "code": term.code,
                                "start_date": term.start_date.isoformat() if term.start_date else None,
                                "end_date": term.end_date.isoformat() if term.end_date else None
                            }
                            form_dict["terms"].append(term_dict)
                    
                    level_dict["forms_grades"].append(form_dict)
            
            result.append(level_dict)
        
        return result

    def create(self, db: Session, *, obj_in):
        # Ensure we have a school_id, default to 1 if not provided
        if isinstance(obj_in, dict):
            if 'school_id' not in obj_in or obj_in['school_id'] is None:
                obj_in['school_id'] = 1
            db_obj = self.model(**obj_in)
        else:
            obj_data = obj_in.dict()
            if 'school_id' not in obj_data or obj_data['school_id'] is None:
                obj_data['school_id'] = 1
            db_obj = self.model(**obj_data)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

class SectionCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(models.Section)

    def get_by_school_level(self, db: Session, school_level_id: int, include_inactive: bool = False):
        """Get sections by school level ID with option to include inactive"""
        query = db.query(self.model).filter(self.model.school_level_id == school_level_id)
        
        if not include_inactive:
            query = query.filter(self.model.is_active == True)
            
        return query.order_by(self.model.display_order).all()

    def get_by_code(self, db: Session, code: str, school_level_id: int, include_inactive: bool = False):
        filters = [
            self.model.code == code,
            self.model.school_level_id == school_level_id
        ]
        
        if not include_inactive:
            filters.append(self.model.is_active == True)
            
        return db.query(self.model).filter(and_(*filters)).first()

    def get_with_forms(self, db: Session, section_id: int):
        return db.query(self.model).options(
            joinedload(self.model.forms_grades)
            .joinedload(models.FormGrade.terms)
            .joinedload(models.Term.subjects)
            .joinedload(models.Subject.topics)
            .joinedload(models.Topic.subtopics)
        ).filter(self.model.id == section_id).first()

class FormGradeCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(models.FormGrade)

    def get_by_school_level(self, db: Session, school_level_id: int, include_inactive: bool = False):
        """Get forms/grades by school level ID with option to include inactive"""
        query = db.query(self.model).filter(self.model.school_level_id == school_level_id)
        
        if not include_inactive:
            query = query.filter(self.model.is_active == True)
            
        return query.order_by(self.model.display_order).all()

    def get_by_code(self, db: Session, code: str, school_level_id: int):
        """Get form/grade by code within a school level"""
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

    def get_by_form_grade(self, db: Session, form_grade_id: int, include_inactive: bool = False):
        query = db.query(self.model).filter(self.model.form_grade_id == form_grade_id)
        if not include_inactive:
            query = query.filter(self.model.is_active == True)
        return query.order_by(self.model.display_order).all()

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

    def get_by_code(self, db: Session, code: str, form_grade_id: int):
        return db.query(self.model).filter(
            and_(
                self.model.code == code,
                self.model.form_grade_id == form_grade_id,
                self.model.is_active == True
            )
        ).first()

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

    def search_subjects(self, db: Session, query: str, limit: int = 100):
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

    def get_with_topics(self, db: Session, subject_id: int):
        return db.query(self.model).options(
            joinedload(self.model.topics).joinedload(models.Topic.subtopics)
        ).filter(self.model.id == subject_id).first()

class TopicCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(models.Topic)

    def get_by_subject(self, db: Session, subject_id: int):
        return db.query(self.model).filter(
            and_(self.model.subject_id == subject_id, self.model.is_active == True)
        ).order_by(self.model.display_order).all()

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

    def get_by_duration(self, db: Session, min_weeks: int, max_weeks: int):
        return db.query(self.model).filter(
            and_(
                self.model.duration_weeks >= min_weeks,
                self.model.duration_weeks <= max_weeks,
                self.model.is_active == True
            )
        ).all()

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
            joinedload(models.SchoolLevel.sections)
            .joinedload(models.Section.forms_grades)
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
        """Get statistics for the curriculum hierarchy, both active and total counts"""
        # School Levels
        school_levels_query = db.query(models.SchoolLevel)
        if school_id:
            school_levels_query = school_levels_query.filter(models.SchoolLevel.school_id == school_id)
        total_school_levels = school_levels_query.count()
        active_school_levels = school_levels_query.filter(models.SchoolLevel.is_active == True).count()

        # Forms/Grades
        forms_grades_query = db.query(models.FormGrade)
        if school_id:
            forms_grades_query = forms_grades_query.join(models.SchoolLevel).filter(models.SchoolLevel.school_id == school_id)
        total_forms_grades = forms_grades_query.count()
        active_forms_grades = forms_grades_query.filter(models.FormGrade.is_active == True).count()

        # Terms
        terms_query = db.query(models.Term)
        if school_id:
            terms_query = terms_query.join(models.FormGrade).join(models.SchoolLevel).filter(models.SchoolLevel.school_id == school_id)
        total_terms = terms_query.count()
        active_terms = terms_query.filter(models.Term.is_active == True).count()

        # Subjects
        subjects_query = db.query(models.Subject)
        if school_id:
            subjects_query = subjects_query.join(models.Term).join(models.FormGrade).join(models.SchoolLevel).filter(models.SchoolLevel.school_id == school_id)
        total_subjects = subjects_query.count()
        active_subjects = subjects_query.filter(models.Subject.is_active == True).count()

        # Topics
        topics_query = db.query(models.Topic)
        if school_id:
            topics_query = topics_query.join(models.Subject).join(models.Term).join(models.FormGrade).join(models.SchoolLevel).filter(models.SchoolLevel.school_id == school_id)
        total_topics = topics_query.count()
        active_topics = topics_query.filter(models.Topic.is_active == True).count()

        # Subtopics
        subtopics_query = db.query(models.Subtopic)
        if school_id:
            subtopics_query = subtopics_query.join(models.Topic).join(models.Subject).join(models.Term).join(models.FormGrade).join(models.SchoolLevel).filter(models.SchoolLevel.school_id == school_id)
        total_subtopics = subtopics_query.count()
        active_subtopics = subtopics_query.filter(models.Subtopic.is_active == True).count()

        return {
            "total_school_levels": total_school_levels,
            "active_school_levels": active_school_levels,
            "total_forms_grades": total_forms_grades,
            "active_forms_grades": active_forms_grades,
            "total_terms": total_terms,
            "active_terms": active_terms,
            "total_subjects": total_subjects,
            "active_subjects": active_subjects,
            "total_topics": total_topics,
            "active_topics": active_topics,
            "total_subtopics": total_subtopics,
            "active_subtopics": active_subtopics
        }

    def duplicate_structure(self, db: Session, source_id: int, target_id: int, level: str):
        """Duplicate curriculum structure from one entity to another"""
        # Implementation for duplicating curriculum structures
        # This would be useful for copying term structures, etc.
        pass

class UserCRUD:
    def get(self, db: Session, id: int) -> Optional[User]:
        return db.query(User).filter(User.id == id).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    def get_by_google_id(self, db: Session, google_id: str) -> Optional[User]:
        return db.query(User).filter(User.google_id == google_id).first()
    
    def create(self, db: Session, obj_in: schemas.UserCreate) -> User:
        db_obj = User(
            google_id=obj_in.google_id,
            email=obj_in.email,
            name=obj_in.name,
            picture=obj_in.picture,
            last_login=func.now()
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, db_obj: User, obj_in: schemas.UserUpdate) -> User:
        obj_data = obj_in.dict(exclude_unset=True)
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
        
        db_obj.updated_at = func.now()
        db.commit()
        db.refresh(db_obj)
        return db_obj

class SchemeOfWorkCRUD:
    def get(self, db: Session, id: int) -> Optional[SchemeOfWork]:
        return db.query(SchemeOfWork).filter(SchemeOfWork.id == id).first()
    
    def get_by_user(
        self, 
        db: Session, 
        user_id: int, 
        status: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[SchemeOfWork]:
        query = db.query(SchemeOfWork).filter(SchemeOfWork.user_id == user_id)
        
        if status:
            query = query.filter(SchemeOfWork.status == status)
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, db: Session, obj_in: Dict[str, Any]) -> SchemeOfWork:
        try:
            # Ensure JSON fields are properly handled
            if 'content' in obj_in and obj_in['content'] is None:
                obj_in['content'] = {}
            if 'scheme_metadata' in obj_in and obj_in['scheme_metadata'] is None:
                obj_in['scheme_metadata'] = {}
            db_obj = SchemeOfWork(**obj_in)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except Exception as e:
            db.rollback()
            raise e
    
    def update(self, db: Session, db_obj: SchemeOfWork, obj_in: schemas.SchemeOfWorkUpdate) -> SchemeOfWork:
        obj_data = obj_in.dict(exclude_unset=True)
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
        
        db_obj.updated_at = func.now()
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def remove(self, db: Session, id: int) -> SchemeOfWork:
        obj = db.query(SchemeOfWork).get(id)
        db.delete(obj)
        db.commit()
        return obj
    
    def count_by_user(self, db: Session, user_id: int) -> int:
        return db.query(SchemeOfWork).filter(SchemeOfWork.user_id == user_id).count()
    
    def count_by_user_and_status(self, db: Session, user_id: int, status: str) -> int:
        return db.query(SchemeOfWork).filter(
            and_(SchemeOfWork.user_id == user_id, SchemeOfWork.status == status)
        ).count()

    def get_latest_by_user(self, db: Session, user_id: int) -> Optional[models.SchemeOfWork]:
        return db.query(models.SchemeOfWork).filter(
            models.SchemeOfWork.user_id == user_id
        ).order_by(models.SchemeOfWork.created_at.desc()).first()

    def get_by_term_and_form(self, db: Session, user_id: int, term_id: int, form_grade_id: int) -> List[models.SchemeOfWork]:
        from sqlalchemy import and_
        return db.query(models.SchemeOfWork).filter(
            and_(
                models.SchemeOfWork.user_id == user_id,
                models.SchemeOfWork.term_id == term_id,
                models.SchemeOfWork.form_grade_id == form_grade_id
            )
        ).all()

class LessonPlanCRUD:
    def get(self, db: Session, id: int) -> Optional[LessonPlan]:
        return db.query(LessonPlan).filter(LessonPlan.id == id).first()
    
    def get_by_scheme(self, db: Session, scheme_id: int) -> List[LessonPlan]:
        return db.query(LessonPlan).filter(LessonPlan.scheme_id == scheme_id).all()
    
    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[LessonPlan]:
        return db.query(LessonPlan).filter(LessonPlan.user_id == user_id).offset(skip).limit(limit).all()
    
    def create(self, db: Session, obj_in: Dict[str, Any]) -> LessonPlan:
        db_obj = LessonPlan(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def count_by_user(self, db: Session, user_id: int) -> int:
        return db.query(LessonPlan).filter(LessonPlan.user_id == user_id).count()

# Initialize CRUD instances
school_level = SchoolLevelCRUD()
section = SectionCRUD()
form_grade = FormGradeCRUD()
term = TermCRUD()
subject = SubjectCRUD()
topic = TopicCRUD()
subtopic = SubtopicCRUD()
hierarchy = HierarchyCRUD()
user = UserCRUD()
scheme = SchemeOfWorkCRUD()
lesson_plan = LessonPlanCRUD()