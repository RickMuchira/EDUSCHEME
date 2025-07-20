import os
import json
from typing import Dict, List, Any
from groq import Groq
import logging
from database import get_db
from sqlalchemy.orm import Session
import models

logger = logging.getLogger(__name__)

class GroqAIService:
    def __init__(self):
        # REPLACE WITH YOUR ACTUAL GROQ API KEY
        self.api_key = "gsk_your_groq_api_key_here"  # Replace with your real key
        self.client = Groq(api_key=self.api_key)
        self.model = "llama3-8b-8192"
    
    def generate_scheme_of_work(self, context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate scheme of work using Groq API with timetable data"""
        try:
            # Get enhanced context with timetable data
            enhanced_context = self._enhance_context_with_timetable(context)
            
            prompt = self._build_enhanced_prompt(enhanced_context, config)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_subject_system_prompt(enhanced_context)
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            return self._parse_scheme_response(content, enhanced_context)
            
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            return self._create_fallback_scheme(context)
    
    def _enhance_context_with_timetable(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance context with actual timetable data from database"""
        timetable_data = context.get("timetable_data", {})
        
        # Organize lessons by week
        weekly_breakdown = self._organize_lessons_by_week(timetable_data.get("slots", []))
        
        # Calculate lesson distribution
        lesson_distribution = self._analyze_lesson_distribution(timetable_data.get("slots", []))
        
        return {
            **context,
            "weekly_breakdown": weekly_breakdown,
            "lesson_distribution": lesson_distribution,
            "actual_topic_coverage": self._map_topic_coverage(timetable_data),
            "total_teaching_periods": len(timetable_data.get("slots", []))
        }
    
    def _organize_lessons_by_week(self, slots: List[Dict]) -> Dict[int, List[Dict]]:
        """Organize lesson slots by week number"""
        weekly_lessons = {}
        
        # Calculate week based on day and period distribution
        for i, slot in enumerate(slots):
            # Simple week calculation: every 4-5 lessons = 1 week
            week_number = (i // 4) + 1
            
            if week_number not in weekly_lessons:
                weekly_lessons[week_number] = []
            
            weekly_lessons[week_number].append({
                "lesson_number": (i % 4) + 1,
                "day": slot.get("day_of_week"),
                "period": slot.get("period_number"),
                "topic": slot.get("topic_name"),
                "subtopic": slot.get("subtopic_name"),
                "lesson_title": slot.get("lesson_title")
            })
        
        return weekly_lessons
    
    def _analyze_lesson_distribution(self, slots: List[Dict]) -> Dict[str, int]:
        """Analyze how lessons are distributed across topics"""
        distribution = {}
        for slot in slots:
            topic = slot.get("topic_name", "Unknown Topic")
            distribution[topic] = distribution.get(topic, 0) + 1
        return distribution
    
    def _map_topic_coverage(self, timetable_data: Dict) -> List[Dict]:
        """Map topics to actual coverage based on timetable"""
        topics = timetable_data.get("selected_topics", [])
        subtopics = timetable_data.get("selected_subtopics", [])
        slots = timetable_data.get("slots", [])
        
        coverage_map = []
        for topic in topics:
            topic_slots = [s for s in slots if s.get("topic_name") == topic.get("name")]
            topic_subtopics = [st for st in subtopics if st.get("topic_id") == topic.get("id")]
            
            coverage_map.append({
                "topic_name": topic.get("name"),
                "allocated_lessons": len(topic_slots),
                "subtopics": [st.get("name") for st in topic_subtopics],
                "estimated_weeks": max(1, len(topic_slots) // 3)  # Assume 3 lessons per week
            })
        
        return coverage_map
    
    def _get_subject_system_prompt(self, context: Dict) -> str:
        """Get subject-specific system prompt"""
        subject = context.get("subject_name", "").lower()
        form_grade = context.get("form_grade", "")
        
        base_prompt = f"""You are a Kenya curriculum expert specializing in {context.get('subject_name')} for {form_grade}. \
        Create detailed, KICD-compliant schemes of work that teachers can implement immediately."""
        
        if "mathematics" in subject or "math" in subject:
            return base_prompt + """ Focus on:
            - Problem-solving and real-world applications
            - Step-by-step mathematical reasoning
            - Practical activities using local examples
            - Progressive difficulty building on prior knowledge
            - Calculator and technology integration where appropriate"""
        
        elif any(sci in subject for sci in ["biology", "chemistry", "physics", "science"]):
            return base_prompt + """ Focus on:
            - Practical experiments and demonstrations
            - Safety procedures and laboratory work
            - Real-world applications and current issues
            - Scientific method and inquiry-based learning
            - Local examples and environmental connections"""
        
        elif any(lang in subject for lang in ["english", "kiswahili", "language"]):
            return base_prompt + """ Focus on:
            - Four language skills: reading, writing, speaking, listening
            - Literature appreciation and cultural context
            - Creative activities and self-expression
            - Communication skills for real-life situations
            - Local and international perspectives"""
        
        elif any(hum in subject for hum in ["history", "geography", "government", "social"]):
            return base_prompt + """ Focus on:
            - Critical thinking and analysis skills
            - Research and inquiry methods
            - Current events and real-world connections
            - Map work and fieldwork activities
            - Kenyan and global perspectives"""
        
        else:
            return base_prompt + """ Focus on:
            - Practical, hands-on learning activities
            - Real-world applications and examples
            - Skills development and competency building
            - Local context and cultural relevance
            - Progressive learning from simple to complex"""
    
    def _build_enhanced_prompt(self, context: Dict[str, Any], config: Dict[str, Any]) -> str:
        """Build comprehensive prompt using timetable data"""
        from services.kenya_curriculum import KenyaCurriculumService
        
        curriculum_service = KenyaCurriculumService()
        references = curriculum_service.get_subject_references(
            context["subject_name"], 
            context["form_grade"]
        )
        
        # Format actual lesson distribution
        lesson_distribution = context.get("lesson_distribution", {})
        distribution_text = "\n".join([f"- {topic}: {count} lessons" for topic, count in lesson_distribution.items()])
        
        # Format weekly breakdown
        weekly_breakdown = context.get("weekly_breakdown", {})
        weekly_text = ""
        for week, lessons in weekly_breakdown.items():
            weekly_text += f"\nWeek {week}:\n"
            for lesson in lessons:
                weekly_text += f"  Lesson {lesson['lesson_number']}: {lesson['topic']} - {lesson['subtopic']}\n"
        
        prompt = f"""
Create a comprehensive scheme of work with the following details:

SCHOOL CONTEXT:
- School: {context.get("school_name")}
- Subject: {context.get("subject_name")}
- Form/Grade: {context.get("form_grade")}
- Term: {context.get("term")}
- Academic Year: {context.get("academic_year", "2024")}

ACTUAL TIMETABLE ALLOCATION:
- Total Teaching Periods: {context.get("total_teaching_periods", 0)}
- Estimated Weeks: {max(1, context.get("total_teaching_periods", 0) // 4)}

LESSON DISTRIBUTION PER TOPIC:
{distribution_text}

WEEKLY LESSON BREAKDOWN:
{weekly_text}

CURRICULUM STANDARDS:
- Standard: KICD (Kenya Institute of Curriculum Development)
- Approved Textbooks: {', '.join(references["textbooks"])}
- Main Reference: {references["main_textbook"]}

COMPETENCY AREAS:
{chr(10).join(['- ' + comp for comp in references["competencies"]])}

GENERATION REQUIREMENTS:
1. Follow exact KICD scheme format
2. Each lesson must have 2-4 specific objectives starting with action verbs
3. Include varied teaching activities: Q/A, discussions, group work, practicals
4. Use materials available in Kenyan schools
5. Provide proper textbook page references
6. Ensure progressive learning from simple to complex
7. Include assessment opportunities (CATs, practical work)
8. Use local examples and contexts

STYLE: {config.get("style", "detailed")} 
LANGUAGE LEVEL: {config.get("language_complexity", "intermediate")}

OUTPUT FORMAT: Return valid JSON with this exact structure:
{{
  "scheme_header": {{
    "school_name": "{context.get('school_name')}",
    "subject": "{context.get('subject_name')}",
    "form_grade": "{context.get('form_grade')}",
    "term": "{context.get('term')}",
    "academic_year": "{context.get('academic_year', '2024')}",
    "total_weeks": {max(1, context.get("total_teaching_periods", 0) // 4)},
    "total_lessons": {context.get("total_teaching_periods", 0)}
  }},
  "weeks": [
    {{
      "week_number": 1,
      "theme": "Week theme/focus",
      "lessons": [
        {{
          "lesson_number": 1,
          "topic_subtopic": "TOPIC NAME - Subtopic details",
          "specific_objectives": [
            "To identify...",
            "To explain...",
            "To demonstrate..."
          ],
          "teaching_learning_activities": [
            "Q/A: Introduction and prior knowledge",
            "Group work: Hands-on activity",
            "Practical: Real-world application",
            "Discussion: Analysis and reflection"
          ],
          "materials_resources": [
            "Approved textbooks",
            "Local materials",
            "Teaching aids"
          ],
          "references": "KLB Form X Pg XX-XX",
          "remarks": "Teaching tips and notes"
        }}
      ]
    }}
  ]
}}
"""
        return prompt
    
    def _parse_scheme_response(self, content: str, context: Dict) -> Dict[str, Any]:
        """Parse and validate AI response"""
        try:
            # Extract JSON from response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No valid JSON found in response")
            
            json_content = content[start_idx:end_idx]
            parsed = json.loads(json_content)
            
            # Validate required structure
            if "weeks" not in parsed:
                raise ValueError("Invalid response structure - missing weeks")
            
            return {
                "scheme_content": parsed,
                "metadata": {
                    "generated_at": "2024-07-20T10:00:00Z",
                    "ai_model": self.model,
                    "total_weeks": len(parsed.get("weeks", [])),
                    "total_lessons": sum(len(week.get("lessons", [])) for week in parsed.get("weeks", [])),
                    "generation_source": "timetable_based"
                }
            }
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"JSON parsing error: {str(e)}")
            return self._create_fallback_scheme(context)
        except Exception as e:
            logger.error(f"Response parsing error: {str(e)}")
            return self._create_fallback_scheme(context)
    
    def _create_fallback_scheme(self, context: Dict) -> Dict[str, Any]:
        """Create basic scheme structure as fallback"""
        total_weeks = max(1, context.get("total_teaching_periods", 12) // 4)
        
        weeks = []
        for week_num in range(1, min(total_weeks + 1, 14)):
            weeks.append({
                "week_number": week_num,
                "theme": f"Week {week_num} Learning Focus",
                "lessons": [
                    {
                        "lesson_number": 1,
                        "topic_subtopic": f"Week {week_num} Content - To be detailed by teacher",
                        "specific_objectives": [
                            "To be defined based on specific curriculum requirements",
                            "To be aligned with KICD learning outcomes",
                            "To be customized for student needs"
                        ],
                        "teaching_learning_activities": [
                            "Q/A session to assess prior knowledge",
                            "Interactive discussion and explanation",
                            "Practical activity or group work",
                            "Assessment and feedback session"
                        ],
                        "materials_resources": [
                            "Approved subject textbooks",
                            "Locally available teaching materials",
                            "Charts and visual aids",
                            "Assessment tools"
                        ],
                        "references": "Refer to approved curriculum documents",
                        "remarks": "AI-generated template - please customize for your specific needs"
                    }
                ]
            })
        
        return {
            "scheme_content": {
                "scheme_header": {
                    "school_name": context.get("school_name", "School Name"),
                    "subject": context.get("subject_name", "Subject"),
                    "form_grade": context.get("form_grade", "Form"),
                    "term": context.get("term", "Term"),
                    "academic_year": context.get("academic_year", "2024"),
                    "total_weeks": len(weeks),
                    "total_lessons": len(weeks)
                },
                "weeks": weeks
            },
            "metadata": {
                "generated_at": "2024-07-20T10:00:00Z",
                "ai_model": "fallback",
                "total_weeks": len(weeks),
                "total_lessons": len(weeks),
                "generation_source": "fallback_template"
            }
        }