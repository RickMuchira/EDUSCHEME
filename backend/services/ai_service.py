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
        """Generate scheme of work - with fallback when API unavailable"""
        try:
            if not self.api_available:
                logger.info("Using fallback scheme generation")
                return self._create_fallback_scheme(context)
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
            logger.error(f"AI generation error: {str(e)}")
            return self._create_fallback_scheme(context)
    
    def _enhance_context_with_timetable(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance context with timetable data for better AI generation"""
        enhanced = context.copy()
        
        # Extract timetable data if available
        timetable_data = context.get("timetableData") or context.get("timetable_data") or {}
        
        # Process selected topics and subtopics
        selected_topics = context.get("selectedTopics", []) or timetable_data.get("selected_topics", [])
        selected_subtopics = context.get("selectedSubtopics", []) or timetable_data.get("selected_subtopics", [])
        lesson_slots = context.get("lessonSlots", []) or timetable_data.get("slots", [])
        
        # Ensure topics and subtopics have proper structure
        if selected_topics and isinstance(selected_topics[0], dict):
            enhanced["selected_topics_titles"] = [topic.get("title", topic.get("name", str(topic))) for topic in selected_topics]
        else:
            enhanced["selected_topics_titles"] = selected_topics
            
        if selected_subtopics and isinstance(selected_subtopics[0], dict):
            enhanced["selected_subtopics_titles"] = [sub.get("title", sub.get("name", str(sub))) for sub in selected_subtopics]
        else:
            enhanced["selected_subtopics_titles"] = selected_subtopics
        
        # Calculate total teaching periods from lesson slots
        total_periods = len(lesson_slots) if lesson_slots else context.get("totalLessons", 0) or context.get("total_lessons", 0)
        enhanced["total_teaching_periods"] = total_periods
        
        # Extract lesson distribution information
        if lesson_slots:
            # Group lessons by day
            lessons_by_day = {}
            for slot in lesson_slots:
                day = slot.get("day", slot.get("day_of_week", "Unknown"))
                if day not in lessons_by_day:
                    lessons_by_day[day] = []
                lessons_by_day[day].append({
                    "time": slot.get("time", slot.get("time_slot", "")),
                    "topic": slot.get("topic", slot.get("topic_name", "")),
                    "subtopic": slot.get("subtopic", slot.get("subtopic_name", "")),
                    "lesson_title": slot.get("lesson_title", ""),
                    "is_double": slot.get("is_double_lesson", False)
                })
            
            enhanced["lessons_by_day"] = lessons_by_day
            enhanced["weekly_lesson_count"] = len(set(slot.get("day", slot.get("day_of_week", "Unknown")) for slot in lesson_slots))
        
        # Add school context if missing
        if not enhanced.get("school_name"):
            enhanced["school_name"] = context.get("school_name", "Default School")
        if not enhanced.get("subject_name"):
            enhanced["subject_name"] = context.get("subject_name", "Subject")
        if not enhanced.get("form_grade"):
            enhanced["form_grade"] = context.get("form_grade", "Form 1")
        if not enhanced.get("term"):
            enhanced["term"] = context.get("term", "Term 1")
        if not enhanced.get("academic_year"):
            enhanced["academic_year"] = context.get("academic_year", "2024")
        
        # Add school level context
        enhanced["school_level"] = context.get("school_level", "Secondary")
        
        logger.info(f"Enhanced context: {total_periods} periods, {len(selected_topics)} topics, {len(selected_subtopics)} subtopics")
        return enhanced
    
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
        """Build comprehensive prompt using timetable context"""
        
        # Extract key information
        total_periods = context.get("total_teaching_periods", 0)
        selected_topics = context.get("selected_topics_titles", [])
        selected_subtopics = context.get("selected_subtopics_titles", [])
        lessons_by_day = context.get("lessons_by_day", {})
        
        # Build lesson distribution text
        if selected_topics:
            distribution_text = f"Selected Topics ({len(selected_topics)}):\n"
            for i, topic in enumerate(selected_topics, 1):
                distribution_text += f"{i}. {topic}\n"
        else:
            distribution_text = "No specific topics selected - generate comprehensive curriculum coverage"
        
        if selected_subtopics:
            distribution_text += f"\nSelected Subtopics ({len(selected_subtopics)}):\n"
            for i, subtopic in enumerate(selected_subtopics, 1):
                distribution_text += f"{i}. {subtopic}\n"
        
        # Build weekly lesson breakdown
        if lessons_by_day:
            weekly_text = "Actual Timetable Schedule:\n"
            for day, lessons in lessons_by_day.items():
                weekly_text += f"{day}: {len(lessons)} lesson(s)\n"
                for lesson in lessons:
                    weekly_text += f"  - {lesson.get('time', '')} | {lesson.get('topic', '')} | {lesson.get('subtopic', '')}\n"
        else:
            weekly_text = f"No specific timetable - distribute {total_periods} lessons across {max(1, total_periods // 4)} weeks"
        
        # Learning progression analysis
        form_number = self._extract_form_number(context.get("form_grade", "Form 1"))
        progression_analysis = f"""
Learning Progression Analysis for {context.get('form_grade', 'Form 1')}:
- Progression Type: {'Sequential' if form_number <= 2 else 'Spiral' if form_number <= 3 else 'Mastery-focused'}
- Cognitive Level: {'Concrete operations' if form_number <= 1 else 'Formal operations developing' if form_number <= 2 else 'Advanced formal operations'}
- Assessment Frequency: {'Weekly formative' if form_number <= 2 else 'Bi-weekly summative' if form_number <= 3 else 'Exam preparation focus'}
"""
        
        # Pacing recommendations
        weekly_lessons = len(lessons_by_day) if lessons_by_day else max(1, total_periods // 13)
        pacing_recommendations = f"""
Pacing Strategy:
- {weekly_lessons} lesson(s) per week across {max(1, total_periods // weekly_lessons)} weeks
- Each lesson should be 40-45 minutes (standard Kenyan school period)
- Include 2-3 assessment opportunities per term
- Balance theory (60%) and practical work (40%)
- Reserve 2 weeks for revision and assessment
"""
        
        # Subject references based on curriculum
        subject_name = context.get("subject_name", "").lower()
        references = self._get_subject_references(subject_name, context.get("form_grade", "Form 1"))
        
        prompt = f"""
Create a comprehensive scheme of work with the following details:

SCHOOL CONTEXT:
- School: {context.get("school_name", "School Name")}
- Subject: {context.get("subject_name", "Subject")}
- Form/Grade: {context.get("form_grade", "Form 1")}
- Term: {context.get("term", "Term 1")}
- Academic Year: {context.get("academic_year", "2024")}
- School Level: {context.get("school_level", "Secondary")}

ACTUAL TIMETABLE ALLOCATION:
- Total Teaching Periods: {total_periods}
- Estimated Weeks: {max(1, total_periods // max(1, weekly_lessons))}

CURRICULUM CONTENT:
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

GENERATION REQUIREMENTS:
1. Follow exact KICD scheme format
2. Each lesson must have 2-4 specific objectives starting with action verbs
3. Include varied teaching activities: Q/A, discussions, group work, practicals
4. Use materials available in Kenyan schools
5. Provide proper textbook page references
6. Ensure progressive learning from simple to complex
7. Include assessment opportunities (CATs, practical work)
8. Use local examples and contexts
9. Respect the actual timetable allocation and pacing
10. Build logical connections between topics and subtopics
11. Consider cognitive development appropriate for the form/grade level
12. Include cross-curricular connections where relevant

STYLE: {config.get("style", "detailed")} 
LANGUAGE LEVEL: {config.get("language_complexity", "intermediate")}

OUTPUT FORMAT: Return valid JSON with this exact structure:
{{
  "scheme_header": {{
    "school_name": "{context.get('school_name', 'School Name')}",
    "subject": "{context.get('subject_name', 'Subject')}",
    "form_grade": "{context.get('form_grade', 'Form 1')}",
    "term": "{context.get('term', 'Term 1')}",
    "academic_year": "{context.get('academic_year', '2024')}",
    "total_weeks": {max(1, total_periods // max(1, weekly_lessons))},
    "total_lessons": {total_periods},
    "learning_progression": "{progression_analysis.split('Progression Type:')[1].split('\\n')[0].strip() if 'Progression Type:' in progression_analysis else 'Progressive'}"
  }},
  "weeks": [
    {{
      "week_number": 1,
      "theme": "Week theme/focus",
      "learning_focus": "Specific learning focus for this week",
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
          "remarks": "Teaching tips and notes",
          "assessment_opportunities": "CAT, Practical work, etc.",
          "cross_curricular_links": "Connections to other subjects/topics"
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