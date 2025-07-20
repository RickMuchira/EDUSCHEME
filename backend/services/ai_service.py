import os
import json
from typing import Dict, List, Any
from groq import Groq
import logging

logger = logging.getLogger(__name__)

class GroqAIService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable not set. Please set it in your environment or .env file.")
        self.client = Groq(api_key=self.api_key)
        self.model = "llama3-8b-8192"  # Groq's Llama model
    
    def generate_scheme_of_work(self, context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate scheme of work using Groq API"""
        try:
            prompt = self._build_prompt(context, config)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a Kenyan curriculum expert specializing in creating detailed schemes of work that comply with KICD (Kenya Institute of Curriculum Development) standards."
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
            return self._parse_scheme_response(content, context)
            
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            raise Exception(f"AI generation failed: {str(e)}")
    
    def _build_prompt(self, context: Dict[str, Any], config: Dict[str, Any]) -> str:
        from services.kenya_curriculum import KenyaCurriculumService
        curriculum_service = KenyaCurriculumService()
        references = curriculum_service.get_subject_references(
            context["subject_name"], 
            context["form_grade"]
        )

        # Format topics and lessons with form/grade info
        topics_text = ""
        for i, topic in enumerate(context.get("selectedTopics", []), 1):
            topics_text += f"{i}. {topic.get('name', 'Topic')} (Form/Grade: {topic.get('form_grade', '')})\n"
            for j, subtopic in enumerate(topic.get('subtopics', []), 1):
                topics_text += f"   {i}.{j} {subtopic.get('name', 'Subtopic')} (Form/Grade: {subtopic.get('form_grade', '')})\n"

        # Add explicit instructions for using only topics/subtopics for this scheme and form/grade
        prompt = f"""
Create a comprehensive scheme of work for the following:

SCHOOL DETAILS:
- School: {context.get("school_name", "School")}
- Subject: {context.get("subject_name", "Subject")}
- Form/Grade: {context.get("form_grade", "Form")}
- Term: {context.get("term", "Term")}
- Academic Year: {context.get("academic_year", "2024")}
- Total Weeks: {context.get("totalWeeks", 13)}
- Total Lessons: {context.get("totalLessons", 0)}

CURRICULUM STANDARD: KICD (Kenya Institute of Curriculum Development)

APPROVED TEXTBOOK REFERENCES:
{references["textbooks"]}

COMPETENCY AREAS:
{references["competencies"]}

TOPICS TO COVER (ONLY those attached to this scheme and form/grade):
{topics_text}

REQUIREMENTS:
1. Use ONLY the topics and subtopics listed above, which are attached to this scheme and form/grade.
2. Follow the exact KICD scheme format with columns: Week | Lesson | Topic/Subtopic | Specific Objectives | Teaching/Learning Activities | Materials/Resources | References | Remarks
3. Each lesson must have 2-4 specific learning objectives starting with action verbs (identify, describe, explain, analyze, etc.)
4. Teaching activities should include: Q/A sessions, discussions, demonstrations, group work, practical activities
5. Materials should reference real Kenyan resources and locally available materials
6. Use approved textbook references: {references["main_textbook"]}
7. Ensure progression from simple to complex concepts
8. Include assessment opportunities and CATs
9. Consider Kenyan context and examples
10. Use the provided lessonSlots array to guide the actual lesson distribution and scheduling.

STYLE: {config.get("style", "detailed")} - Make it {"comprehensive and detailed" if config.get("style") == "detailed" else "concise and focused"}

OUTPUT FORMAT: Return valid JSON with this structure:
{{
  "weeks": [
    {{
      "week_number": 1,
      "lessons": [
        {{
          "lesson_number": 1,
          "topic_subtopic": "TOPIC NAME - Subtopic details",
          "specific_objectives": ["To identify...", "To describe..."],
          "teaching_learning_activities": ["Q/A: Discussion on...", "Group work: Students examine..."],
          "materials_resources": ["Textbook pages", "Local materials", "Charts"],
          "references": "KLB Book II Pg 1-3",
          "remarks": ""
        }}
      ]
    }}
  ]
}}
"""
        return prompt
    
    def _parse_scheme_response(self, content: str, context: Dict) -> Dict[str, Any]:
        """Parse and validate the AI response"""
        try:
            # Extract JSON from response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No valid JSON found in response")
            
            json_content = content[start_idx:end_idx]
            parsed = json.loads(json_content)
            
            # Validate structure
            if "weeks" not in parsed:
                raise ValueError("Invalid response structure")
            
            return {
                "scheme_content": parsed,
                "metadata": {
                    "generated_at": "2024-07-20T10:00:00Z",
                    "ai_model": self.model,
                    "total_weeks": len(parsed["weeks"]),
                    "total_lessons": sum(len(week["lessons"]) for week in parsed["weeks"])
                }
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            # Fallback: create a simple structure
            return self._create_fallback_scheme(context)
        except Exception as e:
            logger.error(f"Response parsing error: {str(e)}")
            return self._create_fallback_scheme(context)
    
    def _create_fallback_scheme(self, context: Dict) -> Dict[str, Any]:
        """Create a basic scheme structure as fallback"""
        weeks = []
        for week_num in range(1, min(context.get("totalWeeks", 13) + 1, 14)):
            weeks.append({
                "week_number": week_num,
                "lessons": [
                    {
                        "lesson_number": 1,
                        "topic_subtopic": f"Week {week_num} Topic - To be detailed",
                        "specific_objectives": [
                            "To be defined based on curriculum requirements",
                            "To be aligned with learning outcomes"
                        ],
                        "teaching_learning_activities": [
                            "Q/A session and discussion",
                            "Group work and practical activities"
                        ],
                        "materials_resources": [
                            "Approved textbooks",
                            "Local materials and charts"
                        ],
                        "references": "To be specified",
                        "remarks": "Generated automatically - please review"
                    }
                ]
            })
        
        return {
            "scheme_content": {"weeks": weeks},
            "metadata": {
                "generated_at": "2024-07-20T10:00:00Z",
                "ai_model": "fallback",
                "total_weeks": len(weeks),
                "total_lessons": len(weeks)
            }
        }