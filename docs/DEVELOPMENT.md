# Development Guide

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+) - for frontend development
- **Python** (v3.11+) - for backend development
- **Git** - for version control
- **Docker** & **Docker Compose** - for containerized deployment

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd atlantis
   ```

2. **Install dependencies**

   **Frontend:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

   **Backend:**
   ```bash
   cd backend
   uv sync
   cd ..
   ```

3. **Start development servers**

   **Option 1: Start both services together**
   ```bash
   npm run dev
   ```

   **Option 2: Start services separately**
   ```bash
   # Terminal 1 - Frontend
   cd frontend && npm run dev

   # Terminal 2 - Backend
   cd backend && uv run uvicorn main:app --reload
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🏗 Project Structure

```
atlantis/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utility functions
│   │   ├── store/          # State management
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core configuration
│   │   ├── models/        # Data models
│   │   └── services/      # Business logic
│   ├── tests/             # Test files
│   └── pyproject.toml
├── docs/                   # Documentation
├── docker-compose.yml      # Docker configuration
└── README.md
```

## 🛠 Development Workflow

### Frontend Development

The frontend uses React with TypeScript and includes:

- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Zustand** for state management

**Common commands:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Backend Development

The backend uses FastAPI with Python and includes:

- **FastAPI** for the API framework
- **Pydantic** for data validation
- **GitPython** for Git operations
- **Pytest** for testing

**Common commands:**
```bash
uv run uvicorn main:app --reload    # Start development server
uv run pytest                       # Run tests
uv run pytest --cov=app            # Run tests with coverage
uv run ruff check                   # Run linting
```

## 🐳 Docker Development

### Using Docker Compose

1. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

2. **View logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

### Individual Docker Commands

```bash
# Build frontend
docker build -t atlantis-frontend ./frontend

# Build backend
docker build -t atlantis-backend ./backend

# Run backend only
docker run -p 8000:8000 atlantis-backend

# Run frontend only
docker run -p 3000:3000 atlantis-frontend
```

## 🧪 Testing

### Frontend Tests

```bash
cd frontend
npm run test              # Run tests
npm run test:ui           # Run tests with UI
npm run test:coverage     # Run tests with coverage
```

### Backend Tests

```bash
cd backend
uv run pytest                # Run tests
uv run pytest -v             # Run tests with verbose output
uv run pytest --cov=app      # Run tests with coverage
```

## 📝 Code Style

### Frontend

- Uses **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** strict mode enabled

### Backend

- Uses **Ruff** for linting and formatting
- **Python 3.11+** with type hints
- Follows **PEP 8** style guidelines

## 🔧 Environment Configuration

### Frontend

Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

### Backend

Create `backend/.env`:
```env
DATABASE_URL=sqlite:///./atlantis.db
SECRET_KEY=your-secret-key-here
GIT_BASE_PATH=./repositories
DEBUG=true
```

## 🚀 Deployment

### Production Build

1. **Build frontend**
   ```bash
   cd frontend && npm run build
   ```

2. **Deploy backend**
   ```bash
   cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Docker Deployment

```bash
# Build and deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🐛 Debugging

### Frontend Debugging

- Use browser DevTools for debugging
- React DevTools extension recommended
- Check browser console for errors

### Backend Debugging

- Use `print()` statements for quick debugging
- Use Python debugger: `import pdb; pdb.set_trace()`
- Check FastAPI auto-generated docs at `/docs`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run linting and tests
6. Submit a pull request

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Mermaid.js Documentation](https://mermaid.js.org/)
- [Docker Documentation](https://docs.docker.com/)