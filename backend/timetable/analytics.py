import json
from typing import List, Dict, Any, Tuple
from . import models, schemas
from datetime import datetime

class TimetableAnalyzer:
    """Rule-based analytics engine for timetable analysis"""
    
    def __init__(self):
        self.time_slots = {
            "7:00": {"period": 1, "minutes": 40},
            "7:40": {"period": 2, "minutes": 40},
            "8:20": {"period": 3, "minutes": 40},
            "9:00": {"period": 4, "minutes": 40},
            "9:40": {"period": 5, "minutes": 40},
            "10:20": {"period": 6, "minutes": 40},
            "11:00": {"period": 7, "minutes": 40},
            "11:40": {"period": 8, "minutes": 40},
            "12:20": {"period": 9, "minutes": 40},
            "13:00": {"period": 10, "minutes": 40},
            "13:40": {"period": 11, "minutes": 40},
            "14:20": {"period": 12, "minutes": 40},
            "15:00": {"period": 13, "minutes": 40},
            "15:40": {"period": 14, "minutes": 40},
            "16:20": {"period": 15, "minutes": 40, "is_evening": True},
            "17:00": {"period": 16, "minutes": 40, "is_evening": True},
        }

    def analyze_schedule(self, slots: List[models.TimetableSlot]) -> Dict[str, Any]:
        """Complete schedule analysis"""
        if not slots:
            return self._empty_analysis()
        
        # Basic calculations
        single_lessons = len([s for s in slots if not s.is_double_lesson])
        double_lessons = len([s for s in slots if s.is_double_lesson and s.double_position == "top"])
        evening_lessons = len([s for s in slots if s.is_evening])
        
        # Time calculations
        total_minutes = (single_lessons * 40) + (double_lessons * 80)
        total_hours = round(total_minutes / 60, 1)
        
        # Daily distribution
        daily_dist = self._calculate_daily_distribution(slots)
        
        # Pattern analysis
        pattern_result = self._detect_pattern(slots, daily_dist, double_lessons, evening_lessons)
        
        # Workload assessment
        workload_result = self._assess_workload(total_hours, len(daily_dist))
        
        # Efficiency score
        efficiency = self._calculate_efficiency(single_lessons + double_lessons, daily_dist)
        
        return {
            "total_sessions": single_lessons + double_lessons,
            "total_hours": total_hours,
            "single_lessons": single_lessons,
            "double_lessons": double_lessons,
            "evening_lessons": evening_lessons,
            "daily_distribution": daily_dist,
            "pattern_type": pattern_result["type"],
            "pattern_description": pattern_result["description"],
            "workload_level": workload_result["level"],
            "workload_percentage": workload_result["percentage"],
            "efficiency_score": efficiency,
            "recommendations": self._generate_recommendations(slots, workload_result, pattern_result)
        }

    def generate_ai_tips(self, slots: List[models.TimetableSlot], analysis: Dict[str, Any]) -> List[schemas.AITip]:
        """Generate contextual AI tips based on schedule analysis"""
        tips = []
        
        # Workload tips
        tips.extend(self._workload_tips(analysis))
        
        # Pattern-specific tips
        tips.extend(self._pattern_tips(analysis, slots))
        
        # Double lesson tips
        tips.extend(self._double_lesson_tips(analysis))
        
        # Evening lesson tips
        tips.extend(self._evening_lesson_tips(analysis))
        
        # Gap analysis tips
        tips.extend(self._gap_analysis_tips(slots))
        
        # Efficiency tips
        tips.extend(self._efficiency_tips(analysis))
        
        # Sort by priority and return top 5
        priority_order = {"high": 3, "medium": 2, "low": 1}
        tips.sort(key=lambda x: priority_order.get(x.priority, 0), reverse=True)
        
        return tips[:5]

    def detect_conflicts(self, slots: List[models.TimetableSlot]) -> List[str]:
        """Detect scheduling conflicts"""
        conflicts = []
        slot_map = {}
        
        for slot in slots:
            key = f"{slot.day_of_week}-{slot.time_slot}"
            if key in slot_map:
                conflicts.append(f"Double booking: {slot.day_of_week} {slot.time_slot}")
            else:
                slot_map[key] = slot
                
        return conflicts

    # === PRIVATE HELPER METHODS ===
    
    def _empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis for no slots"""
        return {
            "total_sessions": 0,
            "total_hours": 0.0,
            "single_lessons": 0,
            "double_lessons": 0,
            "evening_lessons": 0,
            "daily_distribution": {},
            "pattern_type": "Empty Schedule",
            "pattern_description": "No lessons scheduled yet",
            "workload_level": "light",
            "workload_percentage": 0,
            "efficiency_score": 0,
            "recommendations": ["Start by adding your first lesson"]
        }

    def _calculate_daily_distribution(self, slots: List[models.TimetableSlot]) -> Dict[str, int]:
        """Calculate lessons per day"""
        distribution = {}
        
        for slot in slots:
            # Count only the "top" part of double lessons to avoid double counting
            if slot.is_double_lesson and slot.double_position == "bottom":
                continue
                
            day = slot.day_of_week
            distribution[day] = distribution.get(day, 0) + 1
            
        return distribution

    def _detect_pattern(self, slots: List[models.TimetableSlot], daily_dist: Dict[str, int], 
                       double_lessons: int, evening_lessons: int) -> Dict[str, str]:
        """Detect schedule pattern type"""
        if not slots:
            return {"type": "Empty", "description": "No lessons scheduled"}
        
        days_count = len(daily_dist)
        daily_counts = list(daily_dist.values())
        max_daily = max(daily_counts) if daily_counts else 0
        min_daily = min(daily_counts) if daily_counts else 0
        variance = max_daily - min_daily
        
        # Pattern detection logic
        if double_lessons >= 2 and evening_lessons > 0:
            return {
                "type": "Mixed Intensive",
                "description": "Combination of double lessons and evening sessions for maximum flexibility"
            }
        
        if double_lessons >= 3:
            return {
                "type": "Double-Heavy",
                "description": "Multiple double lessons for deep learning and project-based activities"
            }
        
        if evening_lessons >= 2:
            return {
                "type": "Evening Focused",
                "description": "Multiple evening sessions for working learners and flexible schedules"
            }
        
        if days_count == 5 and variance <= 1:
            return {
                "type": "Daily Touchpoint",
                "description": "Consistent daily lessons for continuous learning momentum"
            }
        
        if variance <= 1 and days_count >= 3:
            return {
                "type": "Balanced Distribution",
                "description": "Even spread across multiple days for optimal work-life balance"
            }
        
        if "MON" in daily_dist and "TUE" in daily_dist and len(daily_dist) <= 3:
            return {
                "type": "Front-Loaded",
                "description": "Concentrated early-week schedule with lighter later periods"
            }
        
        if variance > 2:
            return {
                "type": "Irregular Pattern",
                "description": "Uneven distribution requiring careful planning for continuity"
            }
        
        return {
            "type": "Standard Pattern",
            "description": "Regular teaching schedule with good baseline structure"
        }

    def _assess_workload(self, total_hours: float, active_days: int) -> Dict[str, Any]:
        """Assess workload level and percentage"""
        # Recommended maximum: 8 hours per week
        max_recommended = 8.0
        percentage = min(100, int((total_hours / max_recommended) * 100))
        
        if total_hours < 2:
            level = "light"
        elif total_hours <= 5:
            level = "optimal"
        elif total_hours <= 7:
            level = "heavy"
        else:
            level = "overloaded"
            
        return {
            "level": level,
            "percentage": percentage
        }

    def _calculate_efficiency(self, total_sessions: int, daily_dist: Dict[str, int]) -> int:
        """Calculate efficiency score (0-100)"""
        if not daily_dist:
            return 0
            
        active_days = len(daily_dist)
        if active_days == 0:
            return 0
            
        # Base score from sessions per day ratio
        avg_sessions_per_day = total_sessions / active_days
        base_score = min(100, int(avg_sessions_per_day * 20))
        
        # Bonus for good distribution (low variance)
        daily_counts = list(daily_dist.values())
        variance = max(daily_counts) - min(daily_counts) if len(daily_counts) > 1 else 0
        distribution_bonus = max(0, 20 - (variance * 5))
        
        # Bonus for optimal number of days (3-4 days is ideal)
        day_bonus = 10 if 3 <= active_days <= 4 else 0
        
        return min(100, base_score + distribution_bonus + day_bonus)

    def _generate_recommendations(self, slots: List[models.TimetableSlot], 
                                workload: Dict[str, Any], pattern: Dict[str, str]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if workload["level"] == "light":
            recommendations.append("Consider adding more lessons for comprehensive curriculum coverage")
        elif workload["level"] == "overloaded":
            recommendations.append("Reduce lesson load or redistribute across more days")
            
        if pattern["type"] == "Irregular Pattern":
            recommendations.append("Plan connecting activities to maintain learning continuity")
            
        if len([s for s in slots if s.is_double_lesson]) > 0:
            recommendations.append("Prepare engaging activities for extended double lesson periods")
            
        return recommendations

    # === AI TIPS GENERATION ===
    
    def _workload_tips(self, analysis: Dict[str, Any]) -> List[schemas.AITip]:
        """Generate workload-related tips"""
        tips = []
        level = analysis["workload_level"]
        
        if level == "light":
            tips.append(schemas.AITip(
                id=f"workload-light-{datetime.now().timestamp()}",
                type="info",
                title="Light Schedule Detected",
                message="Your schedule has room for more lessons. Consider adding sessions for better curriculum coverage.",
                actionable=True,
                priority="medium"
            ))
        elif level == "optimal":
            tips.append(schemas.AITip(
                id=f"workload-optimal-{datetime.now().timestamp()}",
                type="success",
                title="Perfect Balance!",
                message="Your workload is optimal for effective teaching and student engagement.",
                priority="low"
            ))
        elif level == "heavy":
            tips.append(schemas.AITip(
                id=f"workload-heavy-{datetime.now().timestamp()}",
                type="warning",
                title="Intensive Teaching Load",
                message="Heavy schedule detected. Ensure adequate preparation time between lessons.",
                actionable=True,
                priority="high"
            ))
        elif level == "overloaded":
            tips.append(schemas.AITip(
                id=f"workload-overload-{datetime.now().timestamp()}",
                type="warning",
                title="Schedule Overload",
                message="Consider reducing lessons or redistributing across more days to prevent burnout.",
                actionable=True,
                priority="high"
            ))
            
        return tips

    def _pattern_tips(self, analysis: Dict[str, Any], slots: List[models.TimetableSlot]) -> List[schemas.AITip]:
        """Generate pattern-specific tips"""
        tips = []
        pattern = analysis["pattern_type"]
        
        if pattern == "Double-Heavy":
            tips.append(schemas.AITip(
                id=f"pattern-double-{datetime.now().timestamp()}",
                type="goal",
                title="Double Lesson Mastery",
                message="With multiple double lessons, focus on project-based learning and hands-on activities.",
                priority="high"
            ))
        elif pattern == "Daily Touchpoint":
            tips.append(schemas.AITip(
                id=f"pattern-daily-{datetime.now().timestamp()}",
                type="success",
                title="Excellent Consistency",
                message="Daily lessons create perfect learning momentum. Great for skill building and retention.",
                priority="medium"
            ))
        elif pattern == "Irregular Pattern":
            tips.append(schemas.AITip(
                id=f"pattern-irregular-{datetime.now().timestamp()}",
                type="optimization",
                title="Bridge the Gaps",
                message="Irregular pattern detected. Plan review activities and connecting materials between sessions.",
                actionable=True,
                priority="medium"
            ))
            
        return tips

    def _double_lesson_tips(self, analysis: Dict[str, Any]) -> List[schemas.AITip]:
        """Generate double lesson tips"""
        tips = []
        
        if analysis["double_lessons"] > 0:
            tips.append(schemas.AITip(
                id=f"double-lesson-{datetime.now().timestamp()}",
                type="success",
                title="Double Lesson Advantage",
                message="Perfect for creative projects, presentations, and in-depth discussions. Plan interactive activities!",
                priority="medium"
            ))
            
        if analysis["double_lessons"] >= 3:
            tips.append(schemas.AITip(
                id=f"double-intensive-{datetime.now().timestamp()}",
                type="timing",
                title="Intensive Session Planning",
                message="Multiple double lessons require varied activities. Mix lectures, practicals, and group work.",
                actionable=True,
                priority="high"
            ))
            
        return tips

    def _evening_lesson_tips(self, analysis: Dict[str, Any]) -> List[schemas.AITip]:
        """Generate evening lesson tips"""
        tips = []
        
        if analysis["evening_lessons"] > 0:
            tips.append(schemas.AITip(
                id=f"evening-lesson-{datetime.now().timestamp()}",
                type="info",
                title="Evening Session Strategy",
                message="Evening classes work well for review, conversation practice, and interactive learning.",
                priority="medium"
            ))
            
        return tips

    def _gap_analysis_tips(self, slots: List[models.TimetableSlot]) -> List[schemas.AITip]:
        """Analyze gaps in schedule"""
        tips = []
        
        # Find large gaps between lessons
        days_with_lessons = set(slot.day_of_week for slot in slots)
        all_days = ["MON", "TUE", "WED", "THU", "FRI"]
        
        gaps = []
        for i, day in enumerate(all_days[:-1]):
            if day in days_with_lessons:
                # Look for next lesson day
                for j in range(i + 1, len(all_days)):
                    if all_days[j] in days_with_lessons:
                        gap_size = j - i - 1
                        if gap_size >= 2:  # 2+ day gap
                            gaps.append(f"{day}-{all_days[j]} ({gap_size} days)")
                        break
        
        if gaps:
            tips.append(schemas.AITip(
                id=f"schedule-gaps-{datetime.now().timestamp()}",
                type="optimization",
                title="Schedule Gaps Detected",
                message=f"Large gaps found: {', '.join(gaps)}. Plan review materials to maintain continuity.",
                actionable=True,
                priority="medium"
            ))
            
        return tips

    def _efficiency_tips(self, analysis: Dict[str, Any]) -> List[schemas.AITip]:
        """Generate efficiency improvement tips"""
        tips = []
        
        if analysis["efficiency_score"] < 60:
            tips.append(schemas.AITip(
                id=f"efficiency-low-{datetime.now().timestamp()}",
                type="optimization",
                title="Efficiency Opportunity",
                message="Consider grouping lessons on fewer days to reduce setup time and increase focus.",
                actionable=True,
                priority="medium"
            ))
        elif analysis["efficiency_score"] >= 85:
            tips.append(schemas.AITip(
                id=f"efficiency-high-{datetime.now().timestamp()}",
                type="success",
                title="Highly Efficient Schedule",
                message="Excellent optimization! Your schedule maximizes teaching time and minimizes transitions.",
                priority="low"
            ))
            
        return tips

# Create analyzer instance
analyzer = TimetableAnalyzer() 