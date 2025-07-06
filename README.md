# EDUSCHEME

A comprehensive educational management system built with modern web technologies.

## 🚀 Features

- **Backend**: FastAPI with SQLAlchemy for robust API development
- **Frontend**: Next.js with TypeScript for a modern, responsive UI
- **Database**: SQLite for development (easily configurable for production)
- **Authentication**: Secure user authentication and authorization
- **Admin Panel**: Comprehensive admin interface for managing subjects and users

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** - SQL toolkit and ORM
- **Pydantic** - Data validation using Python type annotations
- **Uvicorn** - ASGI server for running FastAPI applications

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful and accessible UI components
- **React Hook Form** - Performant forms with easy validation

## 📁 Project Structure

```
EDUSCHEME/
├── backend/                 # FastAPI backend
│   ├── config.py           # Configuration settings
│   ├── crud.py             # Database operations
│   ├── database.py         # Database connection
│   └── venv/               # Python virtual environment
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions and API client
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Git**

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## 📚 API Documentation

Once the backend is running, you can access:
- **Interactive API docs**: `http://localhost:8000/docs`
- **ReDoc documentation**: `http://localhost:8000/redoc`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=sqlite:///./eduscheme.db
SECRET_KEY=your-secret-key-here
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
The FastAPI application can be deployed to various platforms:
- **Railway**
- **Render**
- **Heroku**
- **DigitalOcean App Platform**

### Frontend Deployment
The Next.js application can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Render**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Rick Muchira** - *Initial work*

## 🙏 Acknowledgments

- FastAPI community for the excellent framework
- Next.js team for the amazing React framework
- Shadcn/ui for the beautiful component library
- All contributors who help improve this project 