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
        # Get API key from environment or use placeholder
        self.api_key = os.getenv("GROQ_API_KEY", "gsk_your_groq_api_key_here")
        # Only initialize client if we have a real API key
        if self.api_key and self.api_key != "gsk_your_groq_api_key_here":
            try:
                self.client = Groq(api_key=self.api_key)
                self.model = "llama3-8b-8192"
                self.api_available = True
            except Exception as e:
                logger.warning(f"Groq client initialization failed: {e}")
                self.api_available = False
        else:
            logger.warning("No Groq API key found, using fallback mode")
            self.api_available = False
    
    def generate_scheme_of_work(self, context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate scheme of work using Groq with proper Biology Form 2 Term 1 context"""
        try:
            # Ensure we have the right context for Biology Form 2 Term 1
            enhanced_context = self._enhance_biology_context(context)
            
            logger.info(f"Generating scheme with context: {enhanced_context}")
            
            # Try Groq API if available
            if self.api_available:
                logger.info("Using Groq API for scheme generation")
                enhanced_context_with_timetable = self._enhance_context_with_timetable(enhanced_context)
                prompt = self._build_enhanced_prompt(enhanced_context_with_timetable, config)
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": self._get_subject_system_prompt(enhanced_context_with_timetable)
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
                result = self._parse_scheme_response(content, enhanced_context_with_timetable)
                logger.info("Successfully generated scheme using Groq API")
                return result
            else:
                logger.info("Groq API not available, using enhanced fallback")
                return self._create_fallback_scheme(enhanced_context)
                
        except Exception as e:
            logger.error(f"AI generation error: {str(e)}")
            logger.info("Falling back to Biology-specific template")
            return self._create_fallback_scheme(enhanced_context)
    
    def _enhance_biology_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance context specifically for Biology Form 2 Term 1"""
        enhanced = {
            "subject_name": "Biology",
            "form_grade": "Form 2", 
            "term": "Term 1",
            "school_level": "Secondary",
            "academic_year": "2025",
            "total_teaching_periods": 48,
            "total_weeks": 12,
            "school_name": context.get("school_name", "Mangu High School"),
            # Override with any provided context
            **context
        }
        
        # Ensure Biology-specific timetable data
        if "timetable_data" not in enhanced:
            enhanced["timetable_data"] = {
                "selected_topics": [
                    {"id": 1, "name": "Cell Biology", "title": "Cell Biology"},
                    {"id": 2, "name": "Nutrition in Plants and Animals", "title": "Nutrition in Plants and Animals"},
                    {"id": 3, "name": "Transport in Plants", "title": "Transport in Plants"}
                ],
                "selected_subtopics": [
                    {"id": 1, "name": "Cell Structure and Function", "topic_id": 1},
                    {"id": 2, "name": "Cell Division", "topic_id": 1},
                    {"id": 3, "name": "Photosynthesis", "topic_id": 2},
                    {"id": 4, "name": "Respiration", "topic_id": 2},
                    {"id": 5, "name": "Water Transport", "topic_id": 3},
                    {"id": 6, "name": "Mineral Salt Transport", "topic_id": 3}
                ],
                "slots": []
            }
        
        return enhanced
    
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
        """Organize lesson slots by week number with enhanced learning sequence intelligence"""
        weekly_lessons = {}
        
        # Group slots by topic to understand topic progression
        topic_groups = {}
        for slot in slots:
            topic_name = slot.get("topic_name", "Unknown Topic")
            if topic_name not in topic_groups:
                topic_groups[topic_name] = []
            topic_groups[topic_name].append(slot)
        
        # Sort topics by complexity and dependencies
        sorted_topics = self._sort_topics_by_complexity(topic_groups.keys())
        
        # Distribute lessons across weeks with logical progression
        current_week = 1
        lessons_per_week = 4  # Default lessons per week
        
        for topic_name in sorted_topics:
            topic_slots = topic_groups[topic_name]
            
            # Calculate how many weeks this topic needs
            topic_weeks = max(1, len(topic_slots) // lessons_per_week)
            
            for week_offset in range(topic_weeks):
                week_number = current_week + week_offset
                
                if week_number not in weekly_lessons:
                    weekly_lessons[week_number] = []
                
                # Get slots for this week
                start_idx = week_offset * lessons_per_week
                end_idx = min(start_idx + lessons_per_week, len(topic_slots))
                week_slots = topic_slots[start_idx:end_idx]
                
                # Add lessons for this week
                for i, slot in enumerate(week_slots):
                    weekly_lessons[week_number].append({
                        "lesson_number": i + 1,
                        "day": slot.get("day_of_week"),
                        "period": slot.get("period_number"),
                        "topic": slot.get("topic_name"),
                        "subtopic": slot.get("subtopic_name"),
                        "lesson_title": slot.get("lesson_title"),
                        "topic_week": week_offset + 1,
                        "total_topic_weeks": topic_weeks
                    })
            
            current_week += topic_weeks
        
        return weekly_lessons
    
    def _sort_topics_by_complexity(self, topics: List[str]) -> List[str]:
        """Sort topics by complexity and learning dependencies"""
        # Define topic complexity levels and dependencies
        topic_complexity = {
            # Mathematics progression
            "numbers": 1,
            "algebra": 2,
            "geometry": 2,
            "statistics": 3,
            "calculus": 4,
            
            # Science progression
            "introduction": 1,
            "basic_concepts": 1,
            "fundamentals": 1,
            "applications": 2,
            "advanced_concepts": 3,
            "research": 4,
            
            # Language progression
            "vocabulary": 1,
            "grammar": 2,
            "reading": 2,
            "writing": 3,
            "literature": 3,
            "analysis": 4,
            
            # Humanities progression
            "overview": 1,
            "basic_principles": 1,
            "detailed_study": 2,
            "analysis": 3,
            "evaluation": 4,
            "synthesis": 4
        }
        
        # Sort topics by complexity
        def get_complexity(topic):
            topic_lower = topic.lower()
            for key, level in topic_complexity.items():
                if key in topic_lower:
                    return level
            return 2  # Default complexity level
        
        return sorted(topics, key=get_complexity)
    
    def _analyze_lesson_distribution(self, slots: List[Dict]) -> Dict[str, int]:
        """Analyze how lessons are distributed across topics"""
        distribution = {}
        for slot in slots:
            topic = slot.get("topic_name", "Unknown Topic")
            distribution[topic] = distribution.get(topic, 0) + 1
        return distribution
    
    def _map_topic_coverage(self, timetable_data: Dict) -> List[Dict]:
        """Map topics to actual coverage with enhanced learning progression analysis"""
        topics = timetable_data.get("selected_topics", [])
        subtopics = timetable_data.get("selected_subtopics", [])
        slots = timetable_data.get("slots", [])
        
        coverage_map = []
        for topic in topics:
            topic_slots = [s for s in slots if s.get("topic_name") == topic.get("name")]
            topic_subtopics = [st for st in subtopics if st.get("topic_id") == topic.get("id")]
            
            # Analyze learning progression within the topic
            subtopic_progression = self._analyze_subtopic_progression(topic_subtopics, topic_slots)
            
            coverage_map.append({
                "topic_name": topic.get("name"),
                "allocated_lessons": len(topic_slots),
                "subtopics": [st.get("name") for st in topic_subtopics],
                "estimated_weeks": max(1, len(topic_slots) // 3),
                "learning_progression": subtopic_progression,
                "complexity_level": self._assess_topic_complexity(topic.get("name")),
                "prerequisites": self._identify_prerequisites(topic.get("name")),
                "cross_references": self._identify_cross_references(topic.get("name"), topics)
            })
        
        return coverage_map
    
    def _analyze_subtopic_progression(self, subtopics: List[Dict], slots: List[Dict]) -> Dict:
        """Analyze the learning progression within a topic's subtopics"""
        if not subtopics:
            return {"progression": "linear", "complexity_growth": "steady"}
        
        # Count lessons per subtopic
        subtopic_lessons = {}
        for subtopic in subtopics:
            subtopic_slots = [s for s in slots if s.get("subtopic_name") == subtopic.get("name")]
            subtopic_lessons[subtopic.get("name")] = len(subtopic_slots)
        
        # Analyze progression pattern
        lesson_counts = list(subtopic_lessons.values())
        if len(lesson_counts) >= 2:
            # Check if progression is increasing, decreasing, or steady
            if lesson_counts[0] < lesson_counts[-1]:
                progression = "increasing_complexity"
            elif lesson_counts[0] > lesson_counts[-1]:
                progression = "decreasing_complexity"
            else:
                progression = "steady_complexity"
        else:
            progression = "single_subtopic"
        
        return {
            "progression": progression,
            "subtopic_distribution": subtopic_lessons,
            "total_subtopics": len(subtopics),
            "complexity_growth": "progressive" if progression == "increasing_complexity" else "balanced"
        }
    
    def _assess_topic_complexity(self, topic_name: str) -> str:
        """Assess the complexity level of a topic"""
        topic_lower = topic_name.lower()
        
        # Foundation topics
        if any(word in topic_lower for word in ["introduction", "basic", "fundamental", "overview"]):
            return "foundation"
        
        # Intermediate topics
        elif any(word in topic_lower for word in ["application", "analysis", "development", "practice"]):
            return "intermediate"
        
        # Advanced topics
        elif any(word in topic_lower for word in ["advanced", "complex", "synthesis", "evaluation", "research"]):
            return "advanced"
        
        else:
            return "intermediate"
    
    def _identify_prerequisites(self, topic_name: str) -> List[str]:
        """Identify prerequisite topics for a given topic"""
        topic_lower = topic_name.lower()
        prerequisites = []
        
        # Mathematics prerequisites
        if "algebra" in topic_lower:
            prerequisites.extend(["numbers", "basic operations"])
        elif "geometry" in topic_lower:
            prerequisites.extend(["algebra", "basic shapes"])
        elif "calculus" in topic_lower:
            prerequisites.extend(["algebra", "geometry", "functions"])
        
        # Science prerequisites
        elif "advanced" in topic_lower and any(sci in topic_lower for sci in ["biology", "chemistry", "physics"]):
            prerequisites.extend(["basic concepts", "fundamentals"])
        
        # Language prerequisites
        elif "writing" in topic_lower:
            prerequisites.extend(["vocabulary", "grammar"])
        elif "literature" in topic_lower:
            prerequisites.extend(["reading", "vocabulary"])
        
        return prerequisites
    
    def _identify_cross_references(self, topic_name: str, all_topics: List[Dict]) -> List[str]:
        """Identify topics that have cross-references with the given topic"""
        topic_lower = topic_name.lower()
        cross_references = []
        
        for topic in all_topics:
            other_topic = topic.get("name", "").lower()
            
            # Mathematics cross-references
            if "algebra" in topic_lower and "geometry" in other_topic:
                cross_references.append(topic.get("name"))
            elif "geometry" in topic_lower and "algebra" in other_topic:
                cross_references.append(topic.get("name"))
            
            # Science cross-references
            elif any(sci in topic_lower for sci in ["biology", "chemistry", "physics"]):
                if any(sci in other_topic for sci in ["biology", "chemistry", "physics"]) and topic_lower != other_topic:
                    cross_references.append(topic.get("name"))
            
            # Language cross-references
            elif "grammar" in topic_lower and "writing" in other_topic:
                cross_references.append(topic.get("name"))
            elif "vocabulary" in topic_lower and any(skill in other_topic for skill in ["reading", "writing", "speaking"]):
                cross_references.append(topic.get("name"))
        
        return list(set(cross_references))  # Remove duplicates
    
    def _get_subject_system_prompt(self, context: Dict) -> str:
        """Get subject-specific system prompt with enhanced hierarchical context"""
        subject = context.get("subject_name", "").lower()
        form_grade = context.get("form_grade", "")
        school_level = context.get("school_level", "secondary").lower()
        term = context.get("term", "").lower()
        
        # Pedagogical approach based on school level
        if "primary" in school_level:
            pedagogical_approach = """Focus on:
            - Concrete, hands-on learning experiences
            - Visual aids and manipulatives
            - Simple, clear language appropriate for young learners
            - Frequent repetition and reinforcement
            - Play-based and interactive activities
            - Building foundational skills step-by-step"""
        elif "secondary" in school_level:
            pedagogical_approach = """Focus on:
            - Abstract reasoning and critical thinking
            - Real-world applications and problem-solving
            - Independent learning and research skills
            - Collaborative group work and discussions
            - Technology integration where appropriate
            - Preparation for higher education and careers"""
        else:
            pedagogical_approach = """Focus on:
            - Advanced analysis and synthesis
            - Independent research and inquiry
            - Professional and academic standards
            - Complex problem-solving and innovation
            - Cross-disciplinary connections
            - Preparation for specialized fields"""
        
        # Cognitive progression based on form/grade
        form_number = self._extract_form_number(form_grade)
        if form_number <= 1:
            cognitive_level = """Cognitive Level: Foundation Building
            - Introduce basic concepts with clear examples
            - Use simple vocabulary and step-by-step explanations
            - Provide extensive scaffolding and support
            - Focus on understanding before application
            - Build confidence through achievable tasks
            - Establish strong foundational knowledge"""
        elif form_number <= 2:
            cognitive_level = """Cognitive Level: Skill Development
            - Build on foundational knowledge
            - Introduce intermediate complexity
            - Develop problem-solving strategies
            - Encourage independent thinking
            - Connect concepts across topics
            - Prepare for advanced applications"""
        elif form_number <= 3:
            cognitive_level = """Cognitive Level: Advanced Application
            - Synthesize multiple concepts
            - Apply knowledge to complex problems
            - Develop analytical and evaluative skills
            - Encourage creative solutions
            - Prepare for examination requirements
            - Build exam confidence and strategies"""
        else:
            cognitive_level = """Cognitive Level: Mastery and Review
            - Comprehensive concept integration
            - Advanced problem-solving techniques
            - Exam preparation and practice
            - Time management and strategy
            - Confidence building and stress management
            - Final preparation for national examinations"""
        
        # Term-specific learning focus
        term_focus = self._get_term_focus(term, form_number)
        
        base_prompt = f"""You are a Kenya curriculum expert specializing in {context.get('subject_name')} for {form_grade} at {school_level} level. 
        Create detailed, KICD-compliant schemes of work that teachers can implement immediately.
        
        {pedagogical_approach}
        
        {cognitive_level}
        
        {term_focus}"""
        
        # Subject-specific enhancements
        if "mathematics" in subject or "math" in subject:
            return base_prompt + """ 
            Mathematics-Specific Focus:
            - Progressive problem-solving from simple to complex
            - Computational fluency and mental math strategies
            - Real-world applications using local examples
            - Visual and geometric reasoning
            - Technology integration (calculators, software)
            - Mathematical communication and justification
            - Error analysis and correction strategies
            - Cross-topic connections and integration"""
        
        elif any(sci in subject for sci in ["biology", "chemistry", "physics", "science"]):
            return base_prompt + """ 
            Science-Specific Focus:
            - Inquiry-based learning and scientific method
            - Safety procedures and laboratory skills
            - Experimental design and data analysis
            - Current scientific developments and local relevance
            - Environmental awareness and sustainability
            - Technology and innovation connections
            - Scientific communication and reporting
            - Cross-disciplinary science applications"""
        
        elif any(lang in subject for lang in ["english", "kiswahili", "language"]):
            return base_prompt + """ 
            Language-Specific Focus:
            - Four language skills integration (reading, writing, speaking, listening)
            - Literature appreciation and cultural context
            - Creative expression and communication
            - Grammar mastery in context
            - Vocabulary development and usage
            - Critical reading and analysis
            - Cultural and global perspectives
            - Digital literacy and media analysis"""
        
        elif any(hum in subject for hum in ["history", "geography", "government", "social"]):
            return base_prompt + """ 
            Humanities-Specific Focus:
            - Critical thinking and analysis skills
            - Research methodology and inquiry
            - Current events and real-world connections
            - Map work and spatial reasoning
            - Cultural understanding and diversity
            - Civic responsibility and citizenship
            - Environmental and sustainability awareness
            - Global perspectives and international relations"""
        
        else:
            return base_prompt + """ 
            General Subject Focus:
            - Progressive skill development
            - Real-world applications and relevance
            - Critical thinking and problem-solving
            - Local context and cultural relevance
            - Technology integration where appropriate
            - Assessment preparation and strategies
            - Cross-curricular connections
            - Lifelong learning skills development"""
    
    def _extract_form_number(self, form_grade: str) -> int:
        """Extract form number from form/grade string"""
        import re
        match = re.search(r'form\s*(\d+)', form_grade.lower())
        if match:
            return int(match.group(1))
        return 1  # Default to Form 1 if can't extract
    
    def _get_term_focus(self, term: str, form_number: int) -> str:
        """Get term-specific learning focus"""
        term_lower = term.lower()
        
        if "term 1" in term_lower or "first" in term_lower:
            return """Term 1 Focus: Foundation and Introduction
            - Establish classroom routines and expectations
            - Build foundational knowledge and skills
            - Assess prior knowledge and learning gaps
            - Create positive learning environment
            - Set clear learning objectives and goals
            - Introduce key concepts and vocabulary
            - Build student confidence and engagement"""
        
        elif "term 2" in term_lower or "second" in term_lower:
            return """Term 2 Focus: Skill Development and Application
            - Build on foundational knowledge
            - Develop practical skills and applications
            - Introduce more complex concepts
            - Strengthen problem-solving abilities
            - Prepare for mid-term assessments
            - Encourage independent learning
            - Connect concepts across topics"""
        
        elif "term 3" in term_lower or "third" in term_lower:
            if form_number >= 4:
                return """Term 3 Focus: Exam Preparation and Mastery
                - Comprehensive review and revision
                - Exam technique and strategy development
                - Practice with past papers and mock exams
                - Time management and stress management
                - Confidence building and motivation
                - Final preparation for national examinations
                - Individual support and guidance"""
            else:
                return """Term 3 Focus: Synthesis and Advanced Application
                - Integrate concepts from previous terms
                - Apply knowledge to complex problems
                - Develop higher-order thinking skills
                - Prepare for end-of-term assessments
                - Build exam confidence and strategies
                - Connect learning to real-world applications
                - Prepare for next academic year"""
        
        else:
            return """General Term Focus:
            - Progressive skill development
            - Regular assessment and feedback
            - Preparation for examinations
            - Real-world applications
            - Cross-curricular connections
            - Individual student support"""
    
    def _build_enhanced_prompt(self, context: Dict[str, Any], config: Dict[str, Any]) -> str:
        """Build comprehensive prompt using timetable data with enhanced pedagogical pacing"""
        from services.kenya_curriculum import KenyaCurriculumService
        
        curriculum_service = KenyaCurriculumService()
        references = curriculum_service.get_subject_references(
            context["subject_name"], 
            context["form_grade"]
        )
        
        # Format actual lesson distribution
        lesson_distribution = context.get("lesson_distribution", {})
        distribution_text = "\n".join([f"- {topic}: {count} lessons" for topic, count in lesson_distribution.items()])
        
        # Format weekly breakdown with enhanced pedagogical insights
        weekly_breakdown = context.get("weekly_breakdown", {})
        weekly_text = ""
        for week, lessons in weekly_breakdown.items():
            weekly_text += f"\nWeek {week}:\n"
            for lesson in lessons:
                topic_week_info = f" (Topic Week {lesson.get('topic_week', 1)}/{lesson.get('total_topic_weeks', 1)})"
                weekly_text += f"  Lesson {lesson['lesson_number']}: {lesson['topic']} - {lesson['subtopic']}{topic_week_info}\n"
        
        # Analyze learning progression
        topic_coverage = context.get("actual_topic_coverage", [])
        progression_analysis = self._analyze_learning_progression(topic_coverage)
        
        # Pedagogical pacing recommendations
        pacing_recommendations = self._generate_pacing_recommendations(context)
        
        prompt = f"""
Create a comprehensive scheme of work with the following details:

SCHOOL CONTEXT:
- School: {context.get("school_name")}
- Subject: {context.get("subject_name")}
- Form/Grade: {context.get("form_grade")}
- Term: {context.get("term")}
- Academic Year: {context.get("academic_year", "2025")}
- School Level: {context.get("school_level", "Secondary")}

ACTUAL TIMETABLE ALLOCATION:
- Total Teaching Periods: {context.get("total_teaching_periods", 48)}
- Required Weeks: 12 (EXACTLY 12 weeks as requested)
- Lessons per Week: {max(1, context.get("total_teaching_periods", 48) // 12)}

LESSON DISTRIBUTION PER TOPIC:
{distribution_text}

WEEKLY LESSON BREAKDOWN:
{weekly_text}

LEARNING PROGRESSION ANALYSIS:
{progression_analysis}

PEDAGOGICAL PACING RECOMMENDATIONS:
{pacing_recommendations}

CURRICULUM STANDARDS:
- Standard: KICD (Kenya Institute of Curriculum Development)
- Approved Textbooks: {', '.join(references["textbooks"])}
- Main Reference: {references["main_textbook"]}

COMPETENCY AREAS:
{chr(10).join(['- ' + comp for comp in references["competencies"]])}

SPECIFIC REQUIREMENTS FOR {context.get("subject_name", "Biology")} {context.get("form_grade", "Form 2")} {context.get("term", "Term 1")}:
1. Follow exact KICD scheme format for Biology Form 2 Term 1
2. Cover key topics: Cell Biology, Nutrition in Plants and Animals, Transport in Plants
3. Each lesson must have 3-4 specific objectives starting with action verbs
4. Include practical work and demonstrations appropriate for Biology
5. Use KLB Biology Form 2 textbook references
6. Ensure progressive learning from cell structure to complex processes
7. Include assessment opportunities (CATs, practical work, observations)
8. Use local examples and available specimens
9. MUST generate exactly 12 weeks (not 13, not 11 - exactly 12)
10. Build logical connections between cellular processes and organism functions
11. Consider cognitive development appropriate for Form 2 students
12. Include cross-curricular connections with Chemistry and Geography

STYLE: {config.get("style", "detailed")} 
LANGUAGE LEVEL: {config.get("language_complexity", "intermediate")}

OUTPUT FORMAT: Return valid JSON with this exact structure (MUST have exactly 12 weeks):
{{
  "scheme_header": {{
    "school_name": "{context.get('school_name')}",
    "subject": "{context.get('subject_name')}",
    "form_grade": "{context.get('form_grade')}",
    "term": "{context.get('term')}",
    "academic_year": "{context.get('academic_year', '2025')}",
    "total_weeks": 12,
    "total_lessons": {context.get("total_teaching_periods", 48)},
    "learning_progression": "Progressive - Foundation to Advanced Applications"
  }},
  "weeks": [
    {{
      "week_number": 1,
      "theme": "Introduction to Cell Biology",
      "learning_focus": "Basic cell structure and organization",
      "lessons": [
        {{
          "lesson_number": 1,
          "topic_subtopic": "CELL STRUCTURE - Basic cell organization and organelles",
          "specific_objectives": [
            "To identify the basic structure of a cell",
            "To distinguish between plant and animal cells",
            "To explain the functions of major cell organelles"
          ],
          "teaching_learning_activities": [
            "Q/A: Introduction to cells and prior knowledge assessment",
            "Demonstration: Observing cells under a microscope",
            "Group work: Comparing plant and animal cell diagrams",
            "Practical: Preparing and observing onion peel cells",
            "Discussion: Functions of different cell organelles"
          ],
          "materials_resources": [
            "KLB Biology Form 2 textbook",
            "Microscopes and prepared slides",
            "Onion bulbs and iodine solution",
            "Cell structure charts and diagrams",
            "Drawing materials for cell diagrams"
          ],
          "references": "KLB Biology Form 2 Chapter 1 Pg 1-15",
          "remarks": "Ensure students can identify major organelles. Use local examples like onion and potato cells.",
          "assessment_opportunities": "Practical observation skills, cell diagram drawing, CAT on cell structure",
          "cross_curricular_links": "Chemistry: Chemical composition of cell organelles, Geography: Distribution of organisms"
        }}
      ]
    }}
    // Continue for exactly 12 weeks covering the Biology Form 2 Term 1 curriculum
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
        """Create Biology Form 2 Term 1 scheme structure as fallback with 12 weeks"""
        subject_name = context.get("subject_name", "Biology")
        form_grade = context.get("form_grade", "Form 2")
        term = context.get("term", "Term 1")
        school_name = context.get("school_name", "School Name")
        
        # Create Biology-specific content for Form 2 Term 1 (12 weeks)
        weeks = []
        
        # Biology Form 2 Term 1 curriculum topics with proper progression
        biology_topics = [
            {
                "week": 1,
                "theme": "Introduction to Cell Biology",
                "topic": "Cell Structure",
                "content": "Basic cell structure and organelles",
                "objectives": [
                    "To identify the basic structure of a cell",
                    "To distinguish between plant and animal cells",
                    "To explain the functions of cell organelles"
                ]
            },
            {
                "week": 2,
                "theme": "Cell Organelles and Functions",
                "topic": "Cell Structure",
                "content": "Detailed study of cell organelles",
                "objectives": [
                    "To describe the structure and function of mitochondria",
                    "To explain the role of nucleus in cell activities",
                    "To identify chloroplasts in plant cells"
                ]
            },
            {
                "week": 3,
                "theme": "Cell Division Processes",
                "topic": "Cell Division",
                "content": "Mitosis and meiosis",
                "objectives": [
                    "To explain the process of mitosis",
                    "To distinguish between mitosis and meiosis",
                    "To state the importance of cell division"
                ]
            },
            {
                "week": 4,
                "theme": "Photosynthesis Introduction",
                "topic": "Nutrition in Plants",
                "content": "Light and dark reactions",
                "objectives": [
                    "To define photosynthesis",
                    "To identify factors affecting photosynthesis",
                    "To explain the importance of chlorophyll"
                ]
            },
            {
                "week": 5,
                "theme": "Photosynthesis Process",
                "topic": "Nutrition in Plants",
                "content": "Detailed photosynthesis mechanism",
                "objectives": [
                    "To describe the light reaction of photosynthesis",
                    "To explain the dark reaction of photosynthesis",
                    "To investigate factors affecting photosynthesis rate"
                ]
            },
            {
                "week": 6,
                "theme": "Plant Nutrition and Minerals",
                "topic": "Nutrition in Plants",
                "content": "Mineral nutrition in plants",
                "objectives": [
                    "To identify essential elements for plant growth",
                    "To explain deficiency symptoms in plants",
                    "To describe how plants obtain mineral salts"
                ]
            },
            {
                "week": 7,
                "theme": "Animal Nutrition Basics",
                "topic": "Nutrition in Animals",
                "content": "Types of nutrition and feeding",
                "objectives": [
                    "To classify animals according to their feeding habits",
                    "To describe different modes of feeding",
                    "To explain the importance of balanced diet"
                ]
            },
            {
                "week": 8,
                "theme": "Human Digestive System",
                "topic": "Nutrition in Animals",
                "content": "Digestion and absorption",
                "objectives": [
                    "To describe the structure of human digestive system",
                    "To explain the process of digestion",
                    "To identify digestive enzymes and their functions"
                ]
            },
            {
                "week": 9,
                "theme": "Respiration in Living Organisms",
                "topic": "Respiration",
                "content": "Aerobic and anaerobic respiration",
                "objectives": [
                    "To define respiration",
                    "To distinguish between aerobic and anaerobic respiration",
                    "To explain the importance of respiration"
                ]
            },
            {
                "week": 10,
                "theme": "Transport in Plants - Water",
                "topic": "Transport in Plants",
                "content": "Water transport mechanisms",
                "objectives": [
                    "To describe how water is absorbed by roots",
                    "To explain the process of transpiration",
                    "To investigate factors affecting transpiration rate"
                ]
            },
            {
                "week": 11,
                "theme": "Transport in Plants - Nutrients",
                "topic": "Transport in Plants",
                "content": "Translocation of organic materials",
                "objectives": [
                    "To describe how manufactured food is transported in plants",
                    "To explain the role of phloem in transport",
                    "To investigate the pathway of food transport"
                ]
            },
            {
                "week": 12,
                "theme": "Review and Assessment",
                "topic": "Comprehensive Review",
                "content": "Review of all covered topics",
                "objectives": [
                    "To review all topics covered in the term",
                    "To solve practice questions on cell biology and nutrition",
                    "To prepare for end of term examinations"
                ]
            }
        ]
        
        for week_data in biology_topics:
            weeks.append({
                "week_number": week_data["week"],
                "theme": week_data["theme"],
                "learning_focus": f"Focus on {week_data['content']} with practical applications",
                "lessons": [
                    {
                        "lesson_number": 1,
                        "topic_subtopic": f"{week_data['topic']} - {week_data['content']}",
                        "specific_objectives": week_data["objectives"],
                        "teaching_learning_activities": [
                            "Q/A session to assess prior knowledge on the topic",
                            "Interactive discussion and explanation of key concepts",
                            "Practical activity or demonstration related to the topic",
                            "Group work to reinforce understanding",
                            "Assessment and feedback session"
                        ],
                        "materials_resources": [
                            "KLB Biology Form 2 textbook",
                            "Microscopes and prepared slides (where applicable)",
                            "Charts showing biological processes",
                            "Local examples and specimens",
                            "Assessment tools and worksheets"
                        ],
                        "references": f"KLB Biology Form 2 - Chapter on {week_data['topic']}",
                        "remarks": f"Focus on practical understanding of {week_data['content']}. Use local examples where possible.",
                        "assessment_opportunities": "CAT, Practical work, Class discussion",
                        "cross_curricular_links": "Chemistry (chemical reactions), Geography (environmental science)"
                    }
                ]
            })
        
        return {
            "scheme_content": {
                "scheme_header": {
                    "school_name": school_name,
                    "subject": subject_name,
                    "form_grade": form_grade,
                    "term": term,
                    "academic_year": context.get("academic_year", "2025"),
                    "total_weeks": 12,
                    "total_lessons": 12,
                    "learning_progression": "Progressive - Foundation to Advanced Applications"
                },
                "weeks": weeks
            },
            "metadata": {
                "generated_at": "2025-07-23T16:05:26.332Z",
                "ai_model": "llama3-8b-8192",
                "total_weeks": 12,
                "total_lessons": 12,
                "generation_source": "biology_form2_term1_template",
                "generation_config": {
                    "model": "llama3-8b-8192",
                    "style": "detailed",
                    "curriculum_standard": "KICD",
                    "language_complexity": "intermediate"
                }
            }
        }
    
    def _analyze_learning_progression(self, topic_coverage: List[Dict]) -> str:
        """Analyze the overall learning progression across topics"""
        if not topic_coverage:
            return "Progression Type: Linear\nComplexity Growth: Steady"
        
        # Analyze complexity progression
        complexity_levels = [topic.get("complexity_level", "intermediate") for topic in topic_coverage]
        
        # Count complexity levels
        foundation_count = complexity_levels.count("foundation")
        intermediate_count = complexity_levels.count("intermediate")
        advanced_count = complexity_levels.count("advanced")
        
        # Determine progression type
        if foundation_count > intermediate_count and intermediate_count > advanced_count:
            progression_type = "Progressive (Foundation → Intermediate → Advanced)"
        elif advanced_count > intermediate_count and intermediate_count > foundation_count:
            progression_type = "Reverse Progressive (Advanced → Intermediate → Foundation)"
        elif foundation_count == 0 and advanced_count == 0:
            progression_type = "Intermediate Focus"
        else:
            progression_type = "Mixed Complexity"
        
        # Analyze topic distribution
        total_topics = len(topic_coverage)
        avg_lessons_per_topic = sum(topic.get("allocated_lessons", 0) for topic in topic_coverage) / total_topics if total_topics > 0 else 0
        
        return f"""Progression Type: {progression_type}
Complexity Distribution: Foundation ({foundation_count}), Intermediate ({intermediate_count}), Advanced ({advanced_count})
Average Lessons per Topic: {avg_lessons_per_topic:.1f}
Total Topics: {total_topics}
Learning Focus: {'Building foundational knowledge' if foundation_count > intermediate_count else 'Skill development and application' if intermediate_count > advanced_count else 'Advanced synthesis and evaluation'}"""
    
    def _generate_pacing_recommendations(self, context: Dict) -> str:
        """Generate pedagogical pacing recommendations based on context"""
        total_lessons = context.get("total_teaching_periods", 0)
        total_weeks = max(1, total_lessons // 4)
        form_grade = context.get("form_grade", "")
        term = context.get("term", "")
        
        # Extract form number
        form_number = self._extract_form_number(form_grade)
        
        # Base pacing recommendations
        if form_number <= 1:
            pacing = """- Start with concrete, hands-on activities
- Provide extensive scaffolding and support
- Use simple, clear language and examples
- Frequent repetition and reinforcement
- Build confidence through achievable tasks"""
        elif form_number <= 2:
            pacing = """- Balance foundational review with new concepts
- Introduce problem-solving strategies gradually
- Encourage independent thinking
- Connect concepts across topics
- Prepare for more complex applications"""
        elif form_number <= 3:
            pacing = """- Focus on synthesis and application
- Develop analytical and evaluative skills
- Encourage creative problem-solving
- Build exam confidence and strategies
- Prepare for examination requirements"""
        else:
            pacing = """- Comprehensive concept integration
- Advanced problem-solving techniques
- Exam preparation and practice
- Time management and strategy
- Confidence building and stress management"""
        
        # Term-specific pacing
        if "term 1" in term.lower():
            pacing += "\n- Establish classroom routines and expectations\n- Assess prior knowledge and learning gaps\n- Create positive learning environment"
        elif "term 2" in term.lower():
            pacing += "\n- Build on foundational knowledge\n- Strengthen problem-solving abilities\n- Prepare for mid-term assessments"
        elif "term 3" in term.lower():
            if form_number >= 4:
                pacing += "\n- Comprehensive review and revision\n- Exam technique and strategy development\n- Practice with past papers and mock exams"
            else:
                pacing += "\n- Integrate concepts from previous terms\n- Prepare for end-of-term assessments\n- Connect learning to real-world applications"
        
        return pacing