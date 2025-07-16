import json
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from io import BytesIO, StringIO
import csv

def generate_share_token() -> str:
    """Generate unique share token for timetable sharing"""
    return str(uuid.uuid4()).replace('-', '')

def format_time_range(start_time: str, duration_minutes: int = 40) -> str:
    """Format time slot as range (e.g., '9:00-9:40')"""
    try:
        hour, minute = map(int, start_time.split(':'))
        start_minutes = hour * 60 + minute
        end_minutes = start_minutes + duration_minutes
        
        end_hour = end_minutes // 60
        end_minute = end_minutes % 60
        
        return f"{start_time}-{end_hour:02d}:{end_minute:02d}"
    except:
        return start_time

def calculate_weekly_summary(slots: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate weekly summary statistics"""
    if not slots:
        return {
            "total_lessons": 0,
            "total_hours": 0,
            "busiest_day": None,
            "lightest_day": None,
            "average_per_day": 0
        }
    
    # Count lessons per day
    daily_counts = {}
    total_lessons = 0
    
    for slot in slots:
        day = slot.get("day_of_week", "")
        if slot.get("is_double_lesson") and slot.get("double_position") == "bottom":
            continue  # Don't double count
            
        daily_counts[day] = daily_counts.get(day, 0) + 1
        total_lessons += 1
    
    if not daily_counts:
        return {
            "total_lessons": 0,
            "total_hours": 0,
            "busiest_day": None,
            "lightest_day": None,
            "average_per_day": 0
        }
    
    # Calculate hours (assuming 40min singles, 80min doubles)
    single_count = sum(1 for slot in slots if not slot.get("is_double_lesson"))
    double_count = sum(1 for slot in slots 
                      if slot.get("is_double_lesson") and slot.get("double_position") == "top")
    
    total_hours = (single_count * 40 + double_count * 80) / 60
    
    # Find busiest and lightest days
    busiest_day = max(daily_counts.items(), key=lambda x: x[1])
    lightest_day = min(daily_counts.items(), key=lambda x: x[1])
    
    return {
        "total_lessons": total_lessons,
        "total_hours": round(total_hours, 1),
        "busiest_day": {"day": busiest_day[0], "count": busiest_day[1]},
        "lightest_day": {"day": lightest_day[0], "count": lightest_day[1]},
        "average_per_day": round(total_lessons / len(daily_counts), 1) if daily_counts else 0
    }

def export_to_csv(timetable_data: Dict[str, Any]) -> str:
    """Export timetable to CSV format"""
    output = StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Day", "Time", "Period", "Type", "Duration", "Evening", "Notes"
    ])
    
    # Sort slots by day and time
    slots = timetable_data.get("slots", [])
    day_order = {"MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5}
    
    sorted_slots = sorted(slots, key=lambda x: (
        day_order.get(x.get("day_of_week", ""), 6),
        x.get("period_number", 0)
    ))
    
    for slot in sorted_slots:
        lesson_type = "Double" if slot.get("is_double_lesson") else "Single"
        duration = "80 min" if slot.get("is_double_lesson") else "40 min"
        evening = "Yes" if slot.get("is_evening") else "No"
        
        writer.writerow([
            slot.get("day_of_week", ""),
            slot.get("time_slot", ""),
            slot.get("period_number", ""),
            lesson_type,
            duration,
            evening,
            slot.get("notes", "")
        ])
    
    return output.getvalue()

def export_to_json(timetable_data: Dict[str, Any], include_analytics: bool = True) -> str:
    """Export timetable to JSON format"""
    export_data = {
        "export_info": {
            "generated_at": datetime.utcnow().isoformat(),
            "format_version": "1.0",
            "source": "EduScheme Timetable Builder"
        },
        "timetable": {
            "id": timetable_data.get("id"),
            "name": timetable_data.get("name"),
            "description": timetable_data.get("description"),
            "created_at": timetable_data.get("created_at"),
            "subject_id": timetable_data.get("subject_id")
        },
        "schedule": []
    }
    
    # Add slots
    for slot in timetable_data.get("slots", []):
        slot_data = {
            "day": slot.get("day_of_week"),
            "time": slot.get("time_slot"),
            "period": slot.get("period_number"),
            "duration_minutes": 80 if slot.get("is_double_lesson") else 40,
            "type": "double" if slot.get("is_double_lesson") else "single",
            "is_evening": slot.get("is_evening", False),
            "notes": slot.get("notes")
        }
        export_data["schedule"].append(slot_data)
    
    # Add analytics if requested
    if include_analytics and "analytics" in timetable_data:
        analytics = timetable_data["analytics"]
        export_data["analytics"] = {
            "total_sessions": analytics.get("total_sessions"),
            "total_hours": analytics.get("total_hours"),
            "workload_level": analytics.get("workload_level"),
            "pattern_type": analytics.get("pattern_type"),
            "efficiency_score": analytics.get("efficiency_score")
        }
    
    return json.dumps(export_data, indent=2, default=str)

def generate_ical_event(slot: Dict[str, Any], subject_name: str = "Lesson", 
                       start_date: Optional[datetime] = None) -> str:
    """Generate iCal event for a single lesson slot"""
    if not start_date:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Map day to weekday number (Monday = 0)
    day_mapping = {"MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4}
    target_weekday = day_mapping.get(slot.get("day_of_week", "MON"), 0)
    
    # Calculate the date for this weekday
    days_ahead = target_weekday - start_date.weekday()
    if days_ahead <= 0:  # Target day already happened this week
        days_ahead += 7
    
    event_date = start_date + timedelta(days=days_ahead)
    
    # Parse time
    try:
        hour, minute = map(int, slot.get("time_slot", "9:00").split(':'))
        start_time = event_date.replace(hour=hour, minute=minute)
        
        # Duration
        duration_minutes = 80 if slot.get("is_double_lesson") else 40
        end_time = start_time + timedelta(minutes=duration_minutes)
        
        # Format for iCal
        dtstart = start_time.strftime("%Y%m%dT%H%M%S")
        dtend = end_time.strftime("%Y%m%dT%H%M%S")
        
        event = f"""BEGIN:VEVENT
UID:{uuid.uuid4()}@eduscheme.com
DTSTART:{dtstart}
DTEND:{dtend}
SUMMARY:{subject_name}
DESCRIPTION:{'Double lesson' if slot.get('is_double_lesson') else 'Single lesson'}
LOCATION:Classroom
STATUS:CONFIRMED
END:VEVENT"""
        
        return event
    except:
        return ""

def validate_time_slot(time_slot: str) -> bool:
    """Validate time slot format (HH:MM)"""
    try:
        hour, minute = map(int, time_slot.split(':'))
        return 0 <= hour <= 23 and 0 <= minute <= 59
    except:
        return False

def validate_day_of_week(day: str) -> bool:
    """Validate day of week"""
    return day in ["MON", "TUE", "WED", "THU", "FRI"]

def detect_scheduling_conflicts(slots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Detect conflicts in schedule"""
    conflicts = []
    slot_map = {}
    
    for i, slot in enumerate(slots):
        key = f"{slot.get('day_of_week')}-{slot.get('time_slot')}"
        
        if key in slot_map:
            conflicts.append({
                "type": "time_conflict",
                "message": f"Multiple lessons scheduled for {slot.get('day_of_week')} {slot.get('time_slot')}",
                "affected_slots": [slot_map[key], i],
                "severity": "high"
            })
        else:
            slot_map[key] = i
    
    return conflicts

def optimize_schedule_gaps(slots: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Analyze and suggest optimization for schedule gaps"""
    suggestions = []
    
    # Group by day
    daily_slots = {}
    for slot in slots:
        day = slot.get("day_of_week", "")
        if day not in daily_slots:
            daily_slots[day] = []
        daily_slots[day].append(slot)
    
    # Check for large gaps within days
    for day, day_slots in daily_slots.items():
        if len(day_slots) < 2:
            continue
            
        # Sort by period
        sorted_slots = sorted(day_slots, key=lambda x: x.get("period_number", 0))
        
        for i in range(len(sorted_slots) - 1):
            current_period = sorted_slots[i].get("period_number", 0)
            next_period = sorted_slots[i + 1].get("period_number", 0)
            gap = next_period - current_period - 1
            
            if gap >= 3:  # Gap of 3+ periods
                suggestions.append({
                    "type": "large_gap",
                    "day": day,
                    "gap_size": gap,
                    "suggestion": f"Consider filling the {gap}-period gap on {day} or moving lessons closer together"
                })
    
    return suggestions 