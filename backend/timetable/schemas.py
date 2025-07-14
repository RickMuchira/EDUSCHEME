from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class WorkloadLevel(str, Enum):
    LIGHT = "light"
    OPTIMAL = "optimal" 
    HEAVY = "heavy"
    OVERLOADED = "overloaded"

class DayOfWeek(str, Enum):
    MON = "MON"
    TUE = "TUE" 
    WED = "WED"
    THU = "THU"
    FRI = "FRI"

# === SLOT SCHEMAS ===
class TimetableSlotBase(BaseModel):
    day_of_week: DayOfWeek
    time_slot: str = Field(..., regex=r"^\d{1,2}:\d{2}$")  # e.g., "8:20"
    period_number: int = Field(..., ge=1, le=16)
    is_double_lesson: Optional[bool] = False
    double_position: Optional[str] = Field(None, regex=r"^(top|bottom)$")
    is_evening: Optional[bool] = False
    notes: Optional[str] = None

class TimetableSlotCreate(TimetableSlotBase):
    pass

class TimetableSlotUpdate(BaseModel):
    is_double_lesson: Optional[bool] = None
    double_position: Optional[str] = None
    notes: Optional[str] = None

class TimetableSlotResponse(TimetableSlotBase):
    id: str
    timetable_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# === TIMETABLE SCHEMAS ===
class TimetableBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class TimetableCreate(TimetableBase):
    subject_id: int = Field(..., gt=0)

class TimetableUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class TimetableResponse(TimetableBase):
    id: str
    user_id: int
    subject_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    slots: List[TimetableSlotResponse] = []

    class Config:
        from_attributes = True

# === ANALYTICS SCHEMAS ===
class TimetableAnalyticsResponse(BaseModel):
    id: str
    timetable_id: str
    total_sessions: int
    total_hours: float
    single_lessons: int
    double_lessons: int
    evening_lessons: int
    workload_level: WorkloadLevel
    pattern_type: str
    efficiency_score: int
    daily_distribution: Dict[str, int]
    recorded_at: datetime

    class Config:
        from_attributes = True

# === TEMPLATE SCHEMAS ===
class TemplateSlotData(BaseModel):
    day: DayOfWeek
    time_slot: str
    period: int
    is_double_lesson: Optional[bool] = False
    double_position: Optional[str] = None
    is_evening: Optional[bool] = False

class TimetableTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str
    slots: List[TemplateSlotData]
    is_public: Optional[bool] = False
    tags: Optional[str] = None

class TimetableTemplateResponse(BaseModel):
    id: str
    user_id: int
    name: str
    description: str
    template_data: List[TemplateSlotData]
    is_public: bool
    usage_count: int
    tags: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# === SPECIAL OPERATIONS ===
class DoubleLessonCreate(BaseModel):
    slot1_id: str
    slot2_id: str

class BulkSlotCreate(BaseModel):
    slots: List[TimetableSlotCreate]

class ConflictResolution(BaseModel):
    conflict_type: str
    affected_slots: List[str]
    resolution_action: str  # "replace", "move", "skip"
    new_time_slot: Optional[str] = None

# === AI TIPS SCHEMAS ===
class AITip(BaseModel):
    id: str
    type: str  # success, warning, info, optimization, timing, goal
    title: str
    message: str
    actionable: Optional[bool] = False
    priority: str  # low, medium, high

class AnalyticsWithTips(BaseModel):
    analytics: TimetableAnalyticsResponse
    ai_tips: List[AITip]
    conflict_warnings: List[str]
    workload_percentage: int

# === EXPORT SCHEMAS ===
class ExportFormat(str, Enum):
    PDF = "pdf"
    JSON = "json"
    ICAL = "ical"
    CSV = "csv"

class ExportRequest(BaseModel):
    format: ExportFormat
    include_analytics: Optional[bool] = True
    include_notes: Optional[bool] = True

# === SHARING SCHEMAS ===
class ShareCreate(BaseModel):
    is_public: Optional[bool] = False
    expires_in_days: Optional[int] = 30

class ShareResponse(BaseModel):
    id: str
    share_token: str
    share_url: str
    is_public: bool
    expires_at: Optional[datetime]
    view_count: int
    created_at: datetime

    class Config:
        from_attributes = True 