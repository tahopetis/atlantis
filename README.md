# 🌊 Atlantis

**Interactive browser-based diagramming and documentation tool with Git integration**

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+) - Frontend development
- **Python** (v3.11+) - Backend development
- **Git** - Version control
- **Docker** (optional) - Containerized deployment

### Installation

```bash
# Install dependencies
npm install
cd backend && uv sync
cd ../frontend && npm install

# Start development servers
npm run dev
```

This will start:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Docker Deployment

```bash
# Quick start with Docker
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## 🎯 Current Status (Phase 2 - ✅ Complete)

**Development Progress:** ✅ **Phase 2 Implementation Complete** (November 3, 2025)

### ✅ What's Working
- **🏗 Full development environment** with hot reload
- **🎨 Modern React UI** with TypeScript and TailwindCSS
- **⚡ FastAPI backend** with RESTful endpoints
- **📊 Complete API** for diagrams, users, and Git operations
- **🐳 Docker deployment** configuration
- **🧪 Comprehensive testing** (22 E2E tests + backend tests)
- **📚 Full documentation** and API specs

### 🚀 Phase 2 Features (Now Available)
- **🎨 Mermaid.js Integration:** Live diagram rendering with syntax validation
- **🖱️ React Flow Canvas:** Interactive node-based visual editing with dual-mode interface
- **🔐 JWT Authentication:** Complete auth system with Git token support
- **📁 File Storage System:** .mmd/.json support with user directories and versioning
- **🔀 Real Git Operations:** GitPython integration with repository management, commits, branches
- **🧪 E2E Test Suite:** Playwright testing with 22 comprehensive test files
- **🐳 Production Docker:** Refined containerized deployment ready

### 🔄 Current Features
- **Dual-Mode Editing:** Seamless switching between code and visual editors
- **Live Diagram Rendering:** Real-time Mermaid diagram preview
- **Interactive Visual Editor:** Drag-and-drop node editing with React Flow
- **Git Integration:** Full repository management with authentication
- **User Authentication:** JWT-based auth with Git token support
- **File Management:** Persistent storage with versioning
- **Export Options:** JSON, Markdown, PNG, SVG export
- **Responsive UI:** Optimized for desktop, tablet, and mobile
- **API Documentation:** Interactive Swagger/ReDoc docs

### 🎯 Next Phase (Phase 3)
- **Real-time Collaboration:** WebSocket support with Y.js
- **Advanced Git Features:** Pull requests, merge conflicts
- **Team Management:** Multi-user workspaces
- **Performance Optimization:** Caching and lazy loading
- **Advanced Export:** PDF, Word, and custom formats

**📖 See [PROGRESS.md](docs/PROGRESS.md) for detailed development status**

## 📋 Project Structure

```
atlantis/
├── frontend/          # React + Vite frontend application
├── backend/           # FastAPI Python backend with auth & file storage
├── tests/             # Playwright E2E test suite (22 test files)
├── docs/             # Project documentation and specifications
├── docker-compose.yml # Docker configuration for full-stack deployment
├── playwright.config.ts # E2E testing configuration
└── README.md         # This file
```

## 🧩 Features (Phase 2 - Complete)

### Core Diagramming
- ✅ **Mermaid.js Integration** - Live diagram rendering with syntax validation and error handling
- ✅ **Interactive Canvas** - Visual editor with drag/drop, zoom/pan using React Flow
- ✅ **Dual-Mode Editing** - Seamless switching between code and visual editors
- ✅ **Real-time Preview** - Instant diagram updates as you type
- ✅ **Syntax Validation** - Live Mermaid syntax checking with helpful error messages

### Git & Version Control
- ✅ **Git Repository Management** - Clone, browse, and manage Git repositories
- ✅ **Commit Operations** - Create commits with custom messages
- ✅ **Branch Management** - Switch between and create branches
- ✅ **Git Authentication** - Support for GitHub, GitLab, and Bitbucket tokens
- ✅ **File History** - View and restore previous versions

### Authentication & Security
- ✅ **JWT Authentication** - Secure user login with access/refresh tokens
- ✅ **Git Token Support** - Multi-provider Git token management
- ✅ **User Management** - Registration, profile management, password changes
- ✅ **Security Features** - Rate limiting, audit logging, secure headers

### File Management
- ✅ **File Storage System** - User-specific directories with secure access
- ✅ **Multi-format Support** - .mmd, .json, .md, .png, .svg files
- ✅ **Version Control** - Automatic file versioning with rollback capability
- ✅ **Advanced Search** - Filter by type, tags, projects, date ranges
- ✅ **Import/Export** - Support for various diagram formats

### Testing & Quality
- ✅ **E2E Test Suite** - 22 comprehensive Playwright tests
- ✅ **Cross-browser Testing** - Chrome, Firefox, Safari compatibility
- ✅ **Mobile Testing** - Responsive design testing on multiple viewports
- ✅ **Accessibility Testing** - WCAG compliance checks
- ✅ **Performance Testing** - Rendering times and memory usage monitoring

### Deployment & Operations
- ✅ **Docker Deployment** - Production-ready containerization
- ✅ **Environment Configuration** - Flexible configuration via environment variables
- ✅ **Health Checks** - Application and database health monitoring
- ✅ **API Documentation** - Interactive Swagger/ReDoc documentation

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** - Modern, fast development setup
- **TypeScript** - Type safety and better development experience
- **TailwindCSS** + **ShadCN UI** - Beautiful, responsive UI components
- **React Flow** - Interactive canvas and node-based editing
- **Mermaid.js** - Diagram rendering and syntax validation
- **React Router** - Client-side routing and navigation
- **Axios** - HTTP client for API communication

### Backend
- **FastAPI** - Modern, fast Python web framework
- **GitPython** - Git repository operations and integration
- **SQLAlchemy** - Database ORM and migrations
- **Pydantic** - Data validation and serialization
- **JWT (PyJWT)** - Authentication and authorization
- **Bcrypt** - Password hashing and security
- **SQLite/PostgreSQL** - Database for metadata and user management
- **Python-multipart** - File upload handling

### Testing & Quality
- **Playwright** - E2E testing framework with cross-browser support
- **Pytest** - Backend unit and integration testing
- **ESLint** - Frontend code quality and linting
- **Ruff** - Python linting and formatting
- **TypeScript** - Static type checking and validation

### Infrastructure
- **Docker** + **Docker Compose** - Containerized deployment
- **Nginx** - Reverse proxy and static file serving
- **UV** - Fast Python package management
- **Node.js** - Frontend build tooling and development

## 📚 Documentation

### Core Documentation
- [Product Requirements Document](docs/PRD.md) - Detailed feature specifications
- [Development Guide](docs/DEVELOPMENT.md) - Contributing and setup instructions
- [Progress Tracking](docs/PROGRESS.md) - Development progress and milestones
- [API Reference](docs/API.md) - Complete API documentation

### Feature Documentation
- [Authentication System](backend/AUTHENTICATION_README.md) - JWT auth and Git token management
- [File Storage System](backend/FILE_STORAGE_README.md) - File management and versioning
- [Docker Testing Guide](docs/DOCKER_TESTING.md) - Container testing procedures
- [E2E Testing](tests/e2e/README.md) - Playwright test suite documentation

### Interactive Documentation
- [API Documentation](http://localhost:8000/docs) - Interactive Swagger docs (when running)
- [ReDoc Documentation](http://localhost:8000/redoc) - Alternative API docs (when running)

## 🐳 Docker Deployment

### Quick Start
```bash
# Build and run with Docker
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Development Workflow
```bash
# Build containers
docker-compose build

# Run in development mode
docker-compose up

# Run with hot reload (development)
docker-compose -f docker-compose.dev.yml up

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

### Testing in Docker
```bash
# Run backend tests
docker-compose exec backend pytest

# Run E2E tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Build and test
docker-compose -f docker-compose.test.yml build
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for technical teams who love Git and great documentation.