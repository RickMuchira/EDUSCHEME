#!/usr/bin/env python3
# backend/seed_data.py
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import School, SchoolLevel, FormGrade, Term, Subject, Topic, Subtopic

def seed_school_levels():
    """Seed the database with 'Primary School' and 'Secondary School' school levels, and grades/forms under them."""
    db = SessionLocal()
    try:
        # Ensure a default school exists
        school = db.query(School).filter(School.code == "DEFAULT").first()
        if not school:
            school = School(
                name="Default School",
                code="DEFAULT",
                is_active=True
            )
            db.add(school)
            db.commit()
            db.refresh(school)
            print(f"Created default school with ID: {school.id}")
        else:
            print(f"Default school already exists with ID: {school.id}")

        # Check if 'Primary School' school level exists
        primary_level = db.query(SchoolLevel).filter(SchoolLevel.name == "Primary School", SchoolLevel.school_id == school.id).first()
        if not primary_level:
            primary_level = SchoolLevel(
                name="Primary School",
                code="PS",
                description="Primary/Junior School Grades 1-9",
                display_order=1,
                school_id=school.id,
                grade_type="grade",
                is_active=True
            )
            db.add(primary_level)
            db.commit()
            db.refresh(primary_level)
            print("Created school level: Primary School")
        else:
            print("School level 'Primary School' already exists.")

        # Check if 'Secondary School' school level exists
        secondary_level = db.query(SchoolLevel).filter(SchoolLevel.name == "Secondary School", SchoolLevel.school_id == school.id).first()
        if not secondary_level:
            secondary_level = SchoolLevel(
                name="Secondary School",
                code="SS",
                description="Secondary School Forms 1-4",
                display_order=2,
                school_id=school.id,
                grade_type="form",
                is_active=True
            )
            db.add(secondary_level)
            db.commit()
            db.refresh(secondary_level)
            print("Created school level: Secondary School")
        else:
            print("School level 'Secondary School' already exists.")

        # Seed grades 1-9 under Primary School
        for i in range(1, 10):
            grade_name = f"Grade {i}"
            grade_code = f"G{i}"
            existing_grade = db.query(FormGrade).filter(FormGrade.name == grade_name, FormGrade.school_level_id == primary_level.id).first()
            if not existing_grade:
                grade = FormGrade(
                    name=grade_name,
                    code=grade_code,
                    display_order=i,
                    is_active=True,
                    school_level_id=primary_level.id
                )
                db.add(grade)
                print(f"Created {grade_name} under Primary School")
            else:
                print(f"{grade_name} already exists under Primary School.")

        # Seed forms 1-4 under Secondary School
        for i in range(1, 5):
            form_name = f"Form {i}"
            form_code = f"F{i}"
            existing_form = db.query(FormGrade).filter(FormGrade.name == form_name, FormGrade.school_level_id == secondary_level.id).first()
            if not existing_form:
                form = FormGrade(
                    name=form_name,
                    code=form_code,
                    display_order=i,
                    is_active=True,
                    school_level_id=secondary_level.id
                )
                db.add(form)
                print(f"Created {form_name} under Secondary School")
            else:
                print(f"{form_name} already exists under Secondary School.")

        # Seed subjects for each grade (Primary School)
        primary_subjects = [
            ("English", "ENG"),
            ("Kiswahili", "KIS"),
            ("Mathematics", "MAT"),
            ("Science", "SCI"),
            ("Social Studies", "SST"),
            ("Agriculture", "AGR"),
            ("Religious Education", "RE"),
            ("Creative Arts", "CA"),
        ]
        primary_grades = db.query(FormGrade).filter(FormGrade.school_level_id == primary_level.id).all()
        for grade in primary_grades:
            # Create a default term for each grade
            term = db.query(Term).filter(Term.name == "Term 1", Term.form_grade_id == grade.id).first()
            if not term:
                term = Term(
                    name="Term 1",
                    code="T1",
                    display_order=1,
                    form_grade_id=grade.id,
                    is_active=True
                )
                db.add(term)
                db.commit()
                db.refresh(term)
            for subj_name, subj_code in primary_subjects:
                existing_subject = db.query(Subject).filter(Subject.name == subj_name, Subject.term_id == term.id).first()
                if not existing_subject:
                    subject = Subject(
                        name=subj_name,
                        code=subj_code,
                        display_order=1,
                        term_id=term.id,
                        is_active=True
                    )
                    db.add(subject)
                    print(f"Created subject {subj_name} for {grade.name}")
                else:
                    print(f"Subject {subj_name} already exists for {grade.name}")
        db.commit()

        # Seed subjects for each form (Secondary School)
        secondary_subjects = [
            ("English", "ENG"),
            ("Kiswahili", "KIS"),
            ("Mathematics", "MAT"),
            ("Biology", "BIO"),
            ("Chemistry", "CHEM"),
            ("Physics", "PHY"),
            ("Geography", "GEO"),
            ("History", "HIST"),
            ("CRE", "CRE"),
            ("Business Studies", "BST"),
            ("Agriculture", "AGR"),
            ("Computer Studies", "CST"),
        ]
        secondary_forms = db.query(FormGrade).filter(FormGrade.school_level_id == secondary_level.id).all()
        for form in secondary_forms:
            # Create a default term for each form
            term = db.query(Term).filter(Term.name == "Term 1", Term.form_grade_id == form.id).first()
            if not term:
                term = Term(
                    name="Term 1",
                    code="T1",
                    display_order=1,
                    form_grade_id=form.id,
                    is_active=True
                )
                db.add(term)
                db.commit()
                db.refresh(term)
            for subj_name, subj_code in secondary_subjects:
                existing_subject = db.query(Subject).filter(Subject.name == subj_name, Subject.term_id == term.id).first()
                if not existing_subject:
                    subject = Subject(
                        name=subj_name,
                        code=subj_code,
                        display_order=1,
                        term_id=term.id,
                        is_active=True
                    )
                    db.add(subject)
                    print(f"Created subject {subj_name} for {form.name}")
                else:
                    print(f"Subject {subj_name} already exists for {form.name}")
        db.commit()

        # Seed topics and subtopics for Agriculture in Grade 7
        grade7 = db.query(FormGrade).filter(FormGrade.name == "Grade 7", FormGrade.school_level_id == primary_level.id).first()
        if grade7:
            term = db.query(Term).filter(Term.name == "Term 1", Term.form_grade_id == grade7.id).first()
            if term:
                agriculture = db.query(Subject).filter(Subject.name == "Agriculture", Subject.term_id == term.id).first()
                if agriculture:
                    # Topics and subtopics for Grade 7 Agriculture (Kenyan CBC)
                    agri_topics = [
                        ("Conservation of Resources", [
                            "Controlling Soil Pollution",
                            "Constructing Water Retention Structures",
                            "Conserving Food Nutrients",
                            "Growing Trees"
                        ]),
                        ("Food Production Processes", [
                            "Preparing Planting Site and Establishing Crop",
                            "Selected Crop Management Practices",
                            "Preparing Animal Products: Eggs and Honey",
                            "Cooking: Roasting and Steaming"
                        ]),
                        ("Hygiene Practices", [
                            "Hygiene in Rearing Animals",
                            "Laundry: Loose Coloured Items"
                        ]),
                        ("Production Techniques", [
                            "Sewing Skills: Knitting",
                            "Constructing Framed Suspended Garden",
                            "Adding Value to Crop Produce",
                            "Making Homemade Soap"
                        ]),
                    ]
                    for idx, (topic_title, subtopics) in enumerate(agri_topics, 1):
                        topic = db.query(Topic).filter(Topic.title == topic_title, Topic.subject_id == agriculture.id).first()
                        if not topic:
                            topic = Topic(
                                title=topic_title,
                                display_order=idx,
                                subject_id=agriculture.id,
                                is_active=True
                            )
                            db.add(topic)
                            db.commit()
                            db.refresh(topic)
                        for sidx, subtopic_title in enumerate(subtopics, 1):
                            existing_subtopic = db.query(Subtopic).filter(Subtopic.title == subtopic_title, Subtopic.topic_id == topic.id).first()
                            if not existing_subtopic:
                                subtopic = Subtopic(
                                    title=subtopic_title,
                                    display_order=sidx,
                                    topic_id=topic.id,
                                    is_active=True
                                )
                                db.add(subtopic)
                                print(f"Created subtopic '{subtopic_title}' under topic '{topic_title}' for Grade 7 Agriculture")
                    db.commit()

        # Seed topics and subtopics for Biology in Form 1
        form1 = db.query(FormGrade).filter(FormGrade.name == "Form 1", FormGrade.school_level_id == secondary_level.id).first()
        if form1:
            term = db.query(Term).filter(Term.name == "Term 1", Term.form_grade_id == form1.id).first()
            if term:
                biology = db.query(Subject).filter(Subject.name == "Biology", Subject.term_id == term.id).first()
                if biology:
                    bio_topics = [
                        ("Introduction to Biology", [
                            "Meaning of Biology",
                            "Branches of Biology",
                            "Importance of Biology"
                        ]),
                        ("Classification I", [
                            "Binomial Nomenclature",
                            "Major Taxonomic Units",
                            "Kingdoms of Living Organisms"
                        ]),
                        ("The Cell", [
                            "Cell Structure",
                            "Cell Physiology",
                            "Microscopy"
                        ]),
                        ("Nutrition in Plants and Animals", [
                            "Photosynthesis",
                            "Modes of Feeding",
                            "Human Nutrition"
                        ]),
                    ]
                    for idx, (topic_title, subtopics) in enumerate(bio_topics, 1):
                        topic = db.query(Topic).filter(Topic.title == topic_title, Topic.subject_id == biology.id).first()
                        if not topic:
                            topic = Topic(
                                title=topic_title,
                                display_order=idx,
                                subject_id=biology.id,
                                is_active=True
                            )
                            db.add(topic)
                            db.commit()
                            db.refresh(topic)
                        for sidx, subtopic_title in enumerate(subtopics, 1):
                            existing_subtopic = db.query(Subtopic).filter(Subtopic.title == subtopic_title, Subtopic.topic_id == topic.id).first()
                            if not existing_subtopic:
                                subtopic = Subtopic(
                                    title=subtopic_title,
                                    display_order=sidx,
                                    topic_id=topic.id,
                                    is_active=True
                                )
                                db.add(subtopic)
                                print(f"Created subtopic '{subtopic_title}' under topic '{topic_title}' for Form 1 Biology")
                    db.commit()

        db.commit()
    except Exception as e:
        print(f"Error seeding school levels and grades/forms: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_school_levels() 