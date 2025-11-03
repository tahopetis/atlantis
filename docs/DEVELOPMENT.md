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
│   │   ├── components/      # React components (Mermaid, React Flow)
│   │   ├── pages/          # Page components (Editor, Dashboard)
│   │   ├── lib/            # Utility functions and API clients
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # State management (Zustand)
│   │   ├── types/          # TypeScript type definitions
│   │   └── styles/         # Global styles and TailwindCSS
│   ├── public/             # Static assets
│   ├── package.json
│   └── vite.config.ts      # Vite configuration
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/           # API endpoints (auth, files, git)
│   │   ├── core/          # Core configuration (security, database)
│   │   ├── models/        # SQLAlchemy data models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic services
│   │   └── utils/         # Utility functions
│   ├── tests/             # Backend unit and integration tests
│   ├── alembic/           # Database migrations
│   ├── pyproject.toml     # Python project configuration
│   └── main.py           # Application entry point
├── tests/                  # Playwright E2E test suite
│   ├── e2e/              # End-to-end test files
│   │   ├── pages/        # Page Object Models
│   │   ├── fixtures/     # Test data and utilities
│   │   ├── mermaid/      # Mermaid.js specific tests
│   │   ├── react-flow/   # React Flow canvas tests
│   │   ├── auth/         # Authentication flow tests
│   │   ├── git/          # Git operation tests
│   │   └── files/        # File management tests
│   ├── global-setup.ts   # Global test configuration
│   └── playwright.config.ts # Playwright configuration
├── docs/                   # Documentation
│   ├── DEVELOPMENT.md     # This file
│   ├── PROGRESS.md        # Development progress tracking
│   ├── API.md             # API documentation
│   ├── PHASE2_IMPLEMENTATION.md # Phase 2 summary
│   └── DOCKER_TESTING.md  # Docker testing guide
├── docker-compose.yml      # Development Docker configuration
├── docker-compose.prod.yml # Production Docker configuration
├── playwright.config.ts    # Root Playwright configuration
└── README.md
```

## 🛠 Development Workflow

### Frontend Development

The frontend uses React with TypeScript and includes:

- **Vite** for fast development and building
- **TailwindCSS + ShadCN UI** for modern styling and components
- **React Router** for navigation and routing
- **Axios** for API communication
- **Zustand** for state management
- **Mermaid.js** for diagram rendering and validation
- **React Flow** for interactive visual editing
- **React Hook Form** for form management
- **Zod** for schema validation

**Key Features:**
- **Dual-mode Editor** - Seamless switching between code and visual editing
- **Live Diagram Rendering** - Real-time Mermaid diagram preview
- **Interactive Canvas** - Drag-and-drop visual editing with React Flow
- **Authentication** - JWT-based auth with refresh tokens
- **File Management** - Upload, download, and organize diagram files
- **Git Integration** - Connect to Git repositories and manage versions

**Common commands:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run unit tests (when implemented)
npm run test:e2e     # Run E2E tests
npm run test:e2e:ui  # Run E2E tests with UI mode
npm run type-check   # TypeScript type checking
```

### Backend Development

The backend uses FastAPI with Python and includes:

- **FastAPI** for the API framework
- **SQLAlchemy** for database ORM and migrations
- **Pydantic** for data validation and serialization
- **GitPython** for Git repository operations
- **JWT (PyJWT)** for authentication and authorization
- **Bcrypt** for password hashing and security
- **Alembic** for database migrations
- **Pytest** for testing

**Key Features:**
- **JWT Authentication** - Secure user authentication with access/refresh tokens
- **Git Integration** - Real Git operations with repository management
- **File Storage** - Secure user file storage with versioning
- **User Management** - Registration, profiles, and preferences
- **Security Features** - Rate limiting, audit logging, security headers
- **API Documentation** - Auto-generated Swagger/ReDoc documentation

**Common commands:**
```bash
uv run uvicorn main:app --reload    # Start development server
uv run pytest                       # Run tests
uv run pytest --cov=app            # Run tests with coverage
uv run pytest tests/test_auth.py -v # Run specific test modules
uv run ruff check                   # Run linting
uv run ruff format                  # Format code
uv run alembic upgrade head         # Run database migrations
uv run alembic revision --autogenerate -m "message" # Create migration
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

### E2E Testing (Playwright)

The application includes comprehensive end-to-end testing with Playwright:

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/mermaid/basic-rendering.spec.ts

# Run tests with debugging
npx playwright test --debug

# Generate test report
npx playwright test --reporter=html
```

**Test Coverage:**
- **Mermaid.js Rendering** - Diagram rendering, validation, error handling
- **React Flow Canvas** - Visual editing, node manipulation, mode switching
- **Authentication** - Login, registration, token management
- **Git Operations** - Repository management, commits, branches
- **File Management** - Upload, download, versioning, search
- **Cross-browser Testing** - Chrome, Firefox, Safari compatibility
- **Mobile Testing** - Responsive design on tablets and phones
- **Accessibility Testing** - WCAG compliance checks

### Backend Tests

```bash
cd backend

# Run all tests
uv run pytest

# Run tests with verbose output
uv run pytest -v

# Run tests with coverage
uv run pytest --cov=app

# Run specific test modules
uv run pytest tests/test_auth.py -v
uv run pytest tests/test_file_service.py -v
uv run pytest tests/test_git_service.py -v

# Run tests with coverage and HTML report
uv run pytest --cov=app --cov-report=html
```

### Test Organization

```
tests/
├── e2e/                    # E2E tests (Playwright)
│   ├── pages/             # Page Object Models
│   ├── fixtures/          # Test data and utilities
│   ├── mermaid/           # Mermaid.js tests
│   ├── react-flow/        # React Flow tests
│   ├── auth/              # Authentication tests
│   ├── git/               # Git operation tests
│   └── files/             # File management tests
└── backend/               # Backend tests
    ├── test_auth.py       # Authentication tests
    ├── test_file_service.py # File storage tests
    ├── test_git_service.py   # Git operations tests
    └── conftest.py        # Test configuration
```

### Running Tests in Docker

```bash
# Run backend tests in Docker
docker-compose exec backend pytest

# Run E2E tests in Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
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
VITE_APP_NAME=Atlantis
VITE_APP_VERSION=0.2.0
```

### Backend

Create `backend/.env`:
```env
# Database
DATABASE_URL=sqlite:///./atlantis.db

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
PASSWORD_MIN_LENGTH=8

# Git Settings
GIT_BASE_PATH=./repositories
GIT_MAX_REPO_SIZE_MB=1000
GIT_MAX_FILE_SIZE_MB=10
GIT_DISABLE_PUSH=false
GIT_DISABLE_PULL=false

# File Storage
FILE_STORAGE_PATH=./storage
FILE_MAX_SIZE_MB=10
FILE_MAX_FILES_PER_USER=1000
FILE_AUTO_VERSIONING=true
FILE_ALLOWED_EXTENSIONS=.mmd,.json,.md,.png,.svg

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW=300
RATE_LIMIT_REGISTER_ATTEMPTS=3
RATE_LIMIT_REGISTER_WINDOW=600

# Application
APP_NAME=Atlantis API
DEBUG=true
ENVIRONMENT=development

# CORS
ALLOWED_HOSTS=http://localhost:3000,http://localhost:5173
```

### Production Environment Variables

For production deployment, create `.env.production`:
```env
# Use strong, randomly generated secrets
SECRET_KEY=<strong-random-key-here>

# Use PostgreSQL for production
DATABASE_URL=postgresql://user:password@localhost:5432/atlantis

# Production settings
DEBUG=false
ENVIRONMENT=production

# Security headers
ALLOWED_HOSTS=https://yourdomain.com

# Performance and scaling
REDIS_URL=redis://localhost:6379
```

### Environment Setup Script

Use the provided setup script to configure your environment:
```bash
# Copy example environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Generate secure secret key
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
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

## 🎯 Phase 2 Feature Development

### Working with Mermaid.js

```typescript
// Import Mermaid in your components
import mermaid from 'mermaid';

// Configure Mermaid with custom theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#1f2937',
  }
});

// Render diagram from code
const renderDiagram = async (code: string, element: HTMLElement) => {
  try {
    const { svg } = await mermaid.render('mermaid-diagram', code);
    element.innerHTML = svg;
  } catch (error) {
    console.error('Mermaid rendering error:', error);
  }
};
```

### Working with React Flow

```typescript
// Import React Flow components
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background
} from 'reactflow';

// Create custom node types
const nodeTypes = {
  mermaidNode: MermaidNode,
  startNode: StartNode,
};

// Handle node interactions
const onNodeDragStop = (event: React.MouseEvent, node: Node) => {
  // Update node position in state
  updateNodePosition(node.id, node.position);
};

// Convert between Mermaid and React Flow
const convertMermaidToNodes = (mermaidCode: string): Node[] => {
  // Parse Mermaid code and convert to React Flow nodes
  const parsed = parseMermaid(mermaidCode);
  return transformToNodes(parsed);
};
```

### Authentication Integration

```typescript
// Set up axios interceptors for JWT tokens
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken
          });
          localStorage.setItem('access_token', response.data.access_token);
          // Retry original request
          return apiClient.request(error.config);
        } catch (refreshError) {
          // Redirect to login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/atlantis.git
   cd atlantis
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Set up your development environment**
   ```bash
   # Install dependencies
   npm install
   cd backend && uv sync && cd ..

   # Setup environment
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

4. **Make your changes**
   - Follow the existing code style and patterns
   - Add TypeScript types for new code
   - Include proper error handling
   - Update documentation as needed

5. **Add tests for new functionality**
   ```bash
   # Add E2E tests for new features
   npx playwright codegen http://localhost:5173

   # Add backend tests
   # Create test files in backend/tests/
   ```

6. **Run linting and tests**
   ```bash
   # Frontend
   npm run lint
   npm run type-check
   npm run test:e2e

   # Backend
   cd backend
   uv run ruff check
   uv run pytest
   ```

7. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

8. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub with detailed description
   ```

### Code Quality Standards

- **Frontend:** TypeScript strict mode, ESLint compliance, React best practices
- **Backend:** Type hints, PEP 8 compliance, comprehensive error handling
- **Tests:** Minimum 80% coverage, meaningful test cases, edge case coverage
- **Documentation:** Update READMEs, API docs, and code comments

### Pull Request Guidelines

- **Title:** Use conventional commit format (feat:, fix:, docs:, etc.)
- **Description:** Explain what changes were made and why
- **Testing:** Describe how the changes were tested
- **Screenshots:** Include screenshots for UI changes
- **Breaking Changes:** Clearly document any breaking changes

## 📚 Additional Resources

### Core Technologies
- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/)

### Specialized Libraries
- [Mermaid.js Documentation](https://mermaid.js.org/)
- [React Flow Documentation](https://reactflow.dev/)
- [Playwright Testing Documentation](https://playwright.dev/)
- [JWT Authentication Guide](https://jwt.io/introduction)

### Development Tools
- [Vite Documentation](https://vitejs.dev/)
- [UV Python Package Manager](https://github.com/astral-sh/uv)
- [Docker Documentation](https://docs.docker.com/)
- [ESLint Configuration](https://eslint.org/)

### Security & Best Practices
- [OWASP Security Guidelines](https://owasp.org/)
- [GitPython Documentation](https://gitpython.readthedocs.io/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)