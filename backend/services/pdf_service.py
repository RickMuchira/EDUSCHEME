#!/usr/bin/env python3
"""
PDF Generation Service for Scheme of Work Documents
Creates professional, well-formatted PDF documents from AI-generated schemes
"""

import io
from datetime import datetime
from typing import Dict, List, Any, Optional
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
import logging

logger = logging.getLogger(__name__)

class SchemeOfWorkPDFGenerator:
    """Generate professional PDF documents for schemes of work"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles for the PDF"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='SchemeTitle',
            parent=self.styles['Title'],
            fontSize=18,
            textColor=colors.darkblue,
            alignment=TA_CENTER,
            spaceAfter=30
        ))
        
        # School header style
        self.styles.add(ParagraphStyle(
            name='SchoolHeader',
            parent=self.styles['Normal'],
            fontSize=14,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=20,
            fontName='Helvetica-Bold'
        ))
        
        # Week heading style
        self.styles.add(ParagraphStyle(
            name='WeekHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.darkblue,
            alignment=TA_LEFT,
            spaceBefore=20,
            spaceAfter=10,
            fontName='Helvetica-Bold'
        ))
        
        # Lesson heading style
        self.styles.add(ParagraphStyle(
            name='LessonHeading',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.darkgreen,
            alignment=TA_LEFT,
            spaceBefore=10,
            spaceAfter=5,
            fontName='Helvetica-Bold'
        ))
        
        # Content style
        self.styles.add(ParagraphStyle(
            name='Content',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_JUSTIFY,
            spaceAfter=8
        ))
        
        # List item style
        self.styles.add(ParagraphStyle(
            name='ListItem',
            parent=self.styles['Normal'],
            fontSize=9,
            leftIndent=20,
            bulletIndent=10,
            spaceAfter=3
        ))
    
    def generate_scheme_pdf(self, scheme_data: Dict[str, Any], context: Dict[str, Any]) -> bytes:
        """
        Generate a complete scheme of work PDF
        
        Args:
            scheme_data: The AI-generated scheme content
            context: Additional context information
            
        Returns:
            bytes: PDF file content
        """
        try:
            # Create PDF buffer
            buffer = io.BytesIO()
            
            # Create document
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            # Build content
            story = []
            
            # Add header
            story.extend(self._create_header(scheme_data, context))
            
            # Add scheme content
            story.extend(self._create_scheme_content(scheme_data))
            
            # Add footer information
            story.extend(self._create_footer())
            
            # Build PDF
            doc.build(story)
            
            # Get PDF bytes
            buffer.seek(0)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            logger.info(f"Generated PDF with {len(scheme_data.get('weeks', []))} weeks")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"PDF generation error: {str(e)}")
            raise Exception(f"Failed to generate PDF: {str(e)}")
    
    def _create_header(self, scheme_data: Dict, context: Dict) -> List:
        """Create the PDF header with school and scheme information"""
        story = []
        
        # Get header information
        header = scheme_data.get('scheme_header', {})
        school_name = header.get('school_name', context.get('school_name', 'School Name'))
        subject = header.get('subject', context.get('subject_name', 'Subject'))
        form_grade = header.get('form_grade', context.get('form_grade', 'Form'))
        term = header.get('term', context.get('term', 'Term'))
        academic_year = header.get('academic_year', context.get('academic_year', '2024'))
        
        # School name
        story.append(Paragraph(school_name.upper(), self.styles['SchoolHeader']))
        
        # Scheme title
        story.append(Paragraph(
            f"SCHEME OF WORK - {subject.upper()}", 
            self.styles['SchemeTitle']
        ))
        
        # Create information table
        info_data = [
            ['Form/Grade:', form_grade, 'Term:', term],
            ['Subject:', subject, 'Academic Year:', academic_year],
            ['Total Weeks:', str(header.get('total_weeks', 'N/A')), 'Total Lessons:', str(header.get('total_lessons', 'N/A'))],
            ['Date Generated:', datetime.now().strftime('%B %d, %Y'), 'Generated By:', 'AI Assistant']
        ]
        
        info_table = Table(info_data, colWidths=[3*cm, 4*cm, 3*cm, 4*cm])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_scheme_content(self, scheme_data: Dict) -> List:
        """Create the main scheme content with weeks and lessons"""
        story = []
        weeks = scheme_data.get('weeks', [])
        
        for week_idx, week in enumerate(weeks):
            # Week header
            week_number = week.get('week_number', week_idx + 1)
            week_theme = week.get('theme', f'Week {week_number} Learning Focus')
            
            story.append(Paragraph(
                f"WEEK {week_number}: {week_theme.upper()}", 
                self.styles['WeekHeading']
            ))
            
            # Week learning focus (if available)
            if week.get('learning_focus'):
                story.append(Paragraph(
                    f"<b>Learning Focus:</b> {week['learning_focus']}", 
                    self.styles['Content']
                ))
            
            # Lessons for this week
            lessons = week.get('lessons', [])
            
            if lessons:
                # Create lessons table
                lesson_data = [['Lesson', 'Topic/Subtopic', 'Specific Objectives', 'Teaching/Learning Activities', 'Materials/Resources', 'References']]
                
                for lesson in lessons:
                    lesson_num = lesson.get('lesson_number', 'N/A')
                    topic_subtopic = lesson.get('topic_subtopic', 'N/A')
                    
                    # Format objectives
                    objectives = lesson.get('specific_objectives', [])
                    objectives_text = '\n'.join([f"• {obj}" for obj in objectives])
                    
                    # Format activities
                    activities = lesson.get('teaching_learning_activities', [])
                    activities_text = '\n'.join([f"• {act}" for act in activities])
                    
                    # Format materials
                    materials = lesson.get('materials_resources', [])
                    materials_text = '\n'.join([f"• {mat}" for mat in materials])
                    
                    # References
                    references = lesson.get('references', 'N/A')
                    
                    lesson_data.append([
                        str(lesson_num),
                        topic_subtopic,
                        objectives_text,
                        activities_text,
                        materials_text,
                        references
                    ])
                
                # Create and style the table
                lesson_table = Table(lesson_data, colWidths=[1*cm, 3.5*cm, 4*cm, 4*cm, 3*cm, 2.5*cm])
                lesson_table.setStyle(TableStyle([
                    # Header row
                    ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    
                    # Data rows
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.beige, colors.lightgrey]),
                ]))
                
                story.append(lesson_table)
            
            # Add space between weeks
            if week_idx < len(weeks) - 1:
                story.append(Spacer(1, 15))
        
        return story
    
    def _create_footer(self) -> List:
        """Create footer with additional information"""
        story = []
        
        story.append(Spacer(1, 30))
        
        # Signature section
        signature_data = [
            ['Teacher\'s Name:', '____________________', 'Signature:', '____________________', 'Date:', '____________________'],
            ['HOD\'s Name:', '____________________', 'Signature:', '____________________', 'Date:', '____________________'],
            ['Principal\'s Name:', '____________________', 'Signature:', '____________________', 'Date:', '____________________']
        ]
        
        signature_table = Table(signature_data, colWidths=[2.5*cm, 3*cm, 2*cm, 3*cm, 1.5*cm, 3*cm])
        signature_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(signature_table)
        
        # Generation info
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            f"<i>This scheme of work was generated using AI assistance on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}. "
            f"Teachers should review and customize the content to meet specific student needs and local curriculum requirements.</i>",
            self.styles['Content']
        ))
        
        return story

class PDFService:
    """Main PDF service for managing different types of PDF generation"""
    
    def __init__(self):
        self.scheme_generator = SchemeOfWorkPDFGenerator()
    
    def generate_scheme_pdf(self, scheme_data: Dict[str, Any], context: Dict[str, Any]) -> bytes:
        """Generate a scheme of work PDF"""
        return self.scheme_generator.generate_scheme_pdf(scheme_data, context)
    
    def create_pdf_response_headers(self, filename: str) -> Dict[str, str]:
        """Create appropriate headers for PDF response"""
        return {
            'Content-Type': 'application/pdf',
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }

# Global PDF service instance
pdf_service = PDFService() 