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
            fontSize=20,
            textColor=colors.darkblue,
            alignment=TA_CENTER,
            spaceAfter=30,
            fontName='Helvetica-Bold'
        ))
        
        # School header style
        self.styles.add(ParagraphStyle(
            name='SchoolHeader',
            parent=self.styles['Normal'],
            fontSize=16,
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
            textColor=colors.white,
            alignment=TA_CENTER,
            spaceBefore=20,
            spaceAfter=10,
            fontName='Helvetica-Bold',
            backColor=colors.darkblue,
            borderWidth=1,
            borderColor=colors.darkblue,
            leftIndent=10,
            rightIndent=10,
            topPadding=8,
            bottomPadding=8
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

        # Table cell style
        self.styles.add(ParagraphStyle(
            name='TableCell',
            parent=self.styles['Normal'],
            fontSize=9,
            alignment=TA_LEFT,
            spaceAfter=2,
            leading=12
        ))

        # Table header style
        self.styles.add(ParagraphStyle(
            name='TableHeader',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            textColor=colors.white
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
            
            # Create document with better margins
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=1.5*cm,
                leftMargin=1.5*cm,
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
        
        # Create information table with better styling
        info_data = [
            ['Form/Grade:', form_grade, 'Term:', term],
            ['Subject:', subject, 'Academic Year:', academic_year],
            ['Total Weeks:', str(header.get('total_weeks', len(scheme_data.get('weeks', [])))), 'Date Generated:', datetime.now().strftime('%B %d, %Y')],
        ]
        
        info_table = Table(info_data, colWidths=[2.5*cm, 4*cm, 2.5*cm, 4*cm])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, -1), colors.lightblue),
            ('BACKGROUND', (2, 0), (3, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.lightblue, colors.lightgrey, colors.lightblue]),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 30))
        
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
            story.append(Spacer(1, 10))
            
            # Week learning focus (if available)
            if week.get('learning_focus'):
                story.append(Paragraph(
                    f"<b>Learning Focus:</b> {week['learning_focus']}", 
                    self.styles['Content']
                ))
                story.append(Spacer(1, 10))
            
            # Lessons for this week
            lessons = week.get('lessons', [])
            
            if lessons:
                # Create lessons table with improved layout
                lesson_data = [[
                    Paragraph('<b>Lesson</b>', self.styles['TableHeader']),
                    Paragraph('<b>Topic/Subtopic</b>', self.styles['TableHeader']),
                    Paragraph('<b>Specific Objectives</b>', self.styles['TableHeader']),
                    Paragraph('<b>Teaching/Learning Activities</b>', self.styles['TableHeader']),
                    Paragraph('<b>Materials/Resources</b>', self.styles['TableHeader']),
                    Paragraph('<b>References</b>', self.styles['TableHeader'])
                ]]
                
                for lesson in lessons:
                    lesson_num = lesson.get('lesson_number', 'N/A')
                    topic_subtopic = lesson.get('topic_subtopic', 'N/A')
                    
                    # Format objectives
                    objectives = lesson.get('specific_objectives', [])
                    if isinstance(objectives, list):
                        objectives_text = '<br/>'.join([f"• {obj}" for obj in objectives])
                    else:
                        objectives_text = str(objectives)
                    
                    # Format activities
                    activities = lesson.get('teaching_learning_activities', [])
                    if isinstance(activities, list):
                        activities_text = '<br/>'.join([f"• {act}" for act in activities])
                    else:
                        activities_text = str(activities)
                    
                    # Format materials
                    materials = lesson.get('materials_resources', [])
                    if isinstance(materials, list):
                        materials_text = '<br/>'.join([f"• {mat}" for mat in materials])
                    else:
                        materials_text = str(materials)
                    
                    # References
                    references = lesson.get('references', 'N/A')
                    
                    lesson_data.append([
                        Paragraph(str(lesson_num), self.styles['TableCell']),
                        Paragraph(topic_subtopic, self.styles['TableCell']),
                        Paragraph(objectives_text, self.styles['TableCell']),
                        Paragraph(activities_text, self.styles['TableCell']),
                        Paragraph(materials_text, self.styles['TableCell']),
                        Paragraph(references, self.styles['TableCell'])
                    ])
                
                # Create and style the table with improved layout
                lesson_table = Table(lesson_data, colWidths=[1.2*cm, 3*cm, 3.5*cm, 3.5*cm, 2.8*cm, 2.5*cm], repeatRows=1)
                lesson_table.setStyle(TableStyle([
                    # Header styling
                    ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    
                    # Data rows styling
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                    ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    
                    # Grid and padding
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    
                    # Alternating row colors
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                ]))
                
                story.append(lesson_table)
                story.append(Spacer(1, 20))
            
            # Add page break after every 2 weeks (except for the last week)
            if (week_idx + 1) % 2 == 0 and week_idx + 1 < len(weeks):
                story.append(PageBreak())
        
        return story
    
    def _create_footer(self) -> List:
        """Create footer with additional information"""
        story = []
        
        story.append(Spacer(1, 30))
        story.append(PageBreak())
        
        # Add a section title
        story.append(Paragraph("APPROVAL SECTION", self.styles['SchemeTitle']))
        story.append(Spacer(1, 20))
        
        # Signature section with improved layout
        signature_data = [
            [Paragraph('<b>Teacher\'s Name:</b>', self.styles['TableCell']), 
             '____________________________________', 
             Paragraph('<b>Signature:</b>', self.styles['TableCell']), 
             '____________________________________', 
             Paragraph('<b>Date:</b>', self.styles['TableCell']), 
             '____________________________________'],
            ['', '', '', '', '', ''],
            [Paragraph('<b>HOD\'s Name:</b>', self.styles['TableCell']), 
             '____________________________________', 
             Paragraph('<b>Signature:</b>', self.styles['TableCell']), 
             '____________________________________', 
             Paragraph('<b>Date:</b>', self.styles['TableCell']), 
             '____________________________________'],
            ['', '', '', '', '', ''],
            [Paragraph('<b>Principal\'s Name:</b>', self.styles['TableCell']), 
             '____________________________________', 
             Paragraph('<b>Signature:</b>', self.styles['TableCell']), 
             '____________________________________', 
             Paragraph('<b>Date:</b>', self.styles['TableCell']), 
             '____________________________________']
        ]
        
        signature_table = Table(signature_data, colWidths=[2.5*cm, 3*cm, 2*cm, 3*cm, 1.5*cm, 3*cm])
        signature_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(signature_table)
        
        # Generation info
        story.append(Spacer(1, 30))
        story.append(Paragraph(
            f"<i><b>Note:</b> This scheme of work was generated using AI assistance on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}. "
            f"Teachers are encouraged to review and customize the content to meet specific student needs and local curriculum requirements. "
            f"This document serves as a framework and should be adapted based on classroom observations and student progress.</i>",
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