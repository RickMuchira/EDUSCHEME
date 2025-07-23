# EDUSCHEME - AI-Powered Educational Scheme Generator

An intelligent system for generating curriculum schemes of work tailored to the Kenyan education system.

## Recent Fixes (Latest Update)

### ✅ Backend Issues Fixed
- **Fixed timetable endpoint validation error** - Resolved 500 error that was occurring when fetching timetables
- **Updated scheme generation to 12 weeks** - Changed from 13 to 12 weeks as requested
- **Enhanced Biology Form 2 Term 1 context** - AI now properly uses Biology, Form 2, Term 1 context for scheme generation
- **Improved mock data** - Better Biology-specific timetable data with proper topics and subtopics
- **Groq API integration** - Enhanced fallback mode while maintaining Groq API support

### 🎯 Biology Form 2 Term 1 Specifics
- **Subject**: Biology
- **Form/Grade**: Form 2  
- **Term**: Term 1
- **Total Weeks**: 12 (exactly as requested)
- **Total Lessons**: 48
- **Key Topics**: 
  - Cell Biology (Cell Structure, Cell Division)
  - Nutrition in Plants and Animals (Photosynthesis, Respiration)
  - Transport in Plants (Water Transport, Mineral Salt Transport)

### 🔧 Technical Improvements
- Fixed frontend-backend connection issues
- Enhanced AI service with Biology-specific curriculum knowledge
- Improved error handling and logging
- Better validation for scheme generation responses

## Getting Started

### Backend Setup
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
For enhanced AI generation, set up your Groq API key:
```bash
export GROQ_API_KEY=gsk_your_actual_api_key_here
```

If no API key is provided, the system uses an enhanced Biology Form 2 Term 1 template.

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Schemes
- `POST /api/schemes/generate` - Generate Biology Form 2 Term 1 scheme
- `GET /api/schemes/{id}` - Get specific scheme
- `PUT /api/schemes/{id}/content` - Save generated content

### Timetables
- `GET /api/timetables/by-scheme/{scheme_id}` - Get timetable data (now fixed)

## Features

- ✅ AI-powered scheme generation (Groq + enhanced fallback)
- ✅ Biology Form 2 Term 1 curriculum compliance
- ✅ KICD standards alignment
- ✅ 12-week scheme structure
- ✅ Practical activities and assessments
- ✅ Cross-curricular connections
- ✅ Local context integration

## Project Structure

```
EDUSCHEME/
├── backend/           # FastAPI backend
├── frontend/          # Next.js frontend  
├── README.md         # This file
└── .gitignore
```

## Recent Updates Log

**2025-07-23**: Fixed timetable validation errors, updated to 12 weeks, enhanced Biology Form 2 Term 1 context, improved Groq integration with quality fallback. 