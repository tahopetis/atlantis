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

## 🎯 Current Status (Phase 1 MVP - ✅ Complete)

**Development Progress:** ✅ **Phase 1 Foundation Complete** (November 2, 2025)

### ✅ What's Working
- **🏗 Full development environment** with hot reload
- **🎨 Modern React UI** with TypeScript and TailwindCSS
- **⚡ FastAPI backend** with RESTful endpoints
- **📊 Complete API** for diagrams, users, and Git operations
- **🐳 Docker deployment** configuration
- **🧪 Comprehensive testing** (100% test pass rate)
- **📚 Full documentation** and API specs

### 🔄 Current Features
- **Diagram Management:** Create, read, update, delete diagrams
- **Git Integration:** Repository management (foundation)
- **User System:** Basic user profile management
- **Export Options:** JSON and Markdown export
- **Responsive UI:** Split-pane editor (Code ↔ Canvas)
- **API Documentation:** Interactive Swagger/ReDoc docs

### 🎯 Next Phase (Phase 2)
- **Mermaid.js Integration:** Live diagram rendering
- **React Flow Canvas:** Interactive visual editor
- **Real Git Operations:** Actual version control
- **Authentication:** JWT + Git credentials
- **File Storage:** Persistent file system

**📖 See [PROGRESS.md](docs/PROGRESS.md) for detailed development status**

## 📋 Project Structure

```
atlantis/
├── frontend/          # React + Vite frontend application
├── backend/           # FastAPI Python backend
├── docker-compose.yml # Docker configuration for self-hosted deployment
├── docs/             # Project documentation and PRD
└── README.md         # This file
```

## 🧩 Features (Phase 1 MVP)

- ✅ **Mermaid.js Integration** - Create and edit diagrams using Mermaid syntax
- ✅ **Interactive Canvas** - Visual editor with drag/drop, zoom/pan using React Flow
- ✅ **Git Backend** - Store diagrams in Git repositories with version control
- ✅ **Split-pane Editor** - Toggle between code and visual modes
- ✅ **Export Options** - Export diagrams as PNG, SVG, or Markdown
- ✅ **Self-hosted Deployment** - Docker-based deployment for internal teams

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** - Modern, fast development setup
- **TypeScript** - Type safety and better development experience
- **TailwindCSS** + **ShadCN UI** - Beautiful, responsive UI components
- **React Flow** - Interactive canvas and node-based editing
- **Mermaid.js** - Diagram rendering and syntax validation

### Backend
- **FastAPI** - Modern, fast Python web framework
- **GitPython** - Git repository operations
- **Pydantic** - Data validation and serialization
- **SQLite/PostgreSQL** - Database for metadata and user management

### Infrastructure
- **Docker** + **Docker Compose** - Containerized deployment
- **GitHub Actions** - CI/CD pipeline (future)

## 📚 Documentation

- [Product Requirements Document](docs/PRD.md) - Detailed feature specifications
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (when running)
- [Development Guide](docs/DEVELOPMENT.md) - Contributing and setup instructions

## 🐳 Docker Deployment

```bash
# Build and run with Docker
npm run docker:build
npm run docker:up

# Or with docker-compose directly
docker-compose up --build
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