
# 🧭 Product Requirements Document (PRD)

## Project: **Atlantis**

---

### 🧩 1. Overview

**Atlantis** is an interactive, browser-based diagramming and documentation tool designed for technical teams.
It combines **Mermaid.js syntax**, a **React-based canvas**, and **Git as a version-controlled backend** — allowing users to **create, link, and evolve diagrams collaboratively** with full history tracking.

Optional real-time collaboration will be supported through **Y.js**, enabling multi-user editing while maintaining Git as the system of record.

---

### 🎯 2. Objectives

| Goal                                    | Description                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| **Simplify architecture documentation** | Allow users to visually express systems and workflows using Mermaid syntax.       |
| **Enable version-controlled diagrams**  | Store all diagrams as text in Git for traceability, rollback, and branching.      |
| **Foster knowledge linking**            | Connect diagrams and concepts through node-based references.                      |
| **Support real-time teamwork**          | Enable live, conflict-free collaboration powered by CRDT technology.              |
| **Integrate with developer workflows**  | Seamlessly embed and sync diagrams with documentation tools like Wiki.js or Dify. |

---

### 🧱 3. Key Features

#### **3.1 Diagram Editing**

* Create, edit, and delete Mermaid diagrams.
* Toggle between **Mermaid code editor** and **canvas (visual)** mode.
* Auto-layout and syntax validation powered by Mermaid.js.
* Diagram autosave and version tagging.

#### **3.2 Canvas Interaction (React-based)**

* Interactive visual editor using **React Flow / Konva**.
* Node creation, linking, and editing.
* Zoom, pan, snap-to-grid, fit-to-screen.
* Contextual menu for linking nodes to other diagrams or documentation pages.

#### **3.3 Git-Backed Storage**

* Diagrams saved as `.mmd` or `.json` files.
* Commit, push, pull, and rollback from within the app.
* Visual Git history timeline and diffs.
* Support for remote Git servers (GitHub, GitLab, Gitea, or local).

#### **3.4 Cross-Linking Between Diagrams**

* Each node can reference another diagram.
* Hover previews of linked diagrams.
* “Graph of diagrams” mode to visualize relationships across diagrams.

#### **3.5 Real-Time Collaboration**

* Multi-user editing via **Y.js** and WebSockets.
* Presence indicators, cursors, and activity status.
* Auto-sync and commit to Git after collaborative sessions.
* Merge conflict-free storage via CRDT.

#### **3.6 Authentication & Access Control**

* Git-based login via tokens or SSH keys.
* Role-based access (Owner, Editor, Viewer).
* Integration with OAuth2/SSO (GitHub, GitLab, Keycloak).

#### **3.7 Integration & Extensibility**

* Embed diagrams into Markdown-based tools (Wiki.js, Docusaurus, Docsify).
* REST API and webhook triggers.
* Export to PNG, SVG, Markdown.
* Plugin architecture for custom nodes or syntax.

#### **3.8 GitOps Visualization**

* Timeline view: visualize diagram evolution across commits.
* Diff viewer between versions (highlight added/removed nodes).
* Branch comparison (feature branch vs main).
* “Architecture replay” mode showing system evolution over time.

---

### ⚙️ 4. Architecture Overview

#### **Frontend**

* Framework: **React + Vite**
* Canvas: **React Flow / Konva**
* Renderer: **Mermaid.js**
* Git integration: **isomorphic-git**
* Real-time sync: **Y.js + y-websocket**
* Styling: **TailwindCSS + ShadCN UI**

#### **Backend**

* Optional (for hosted or team mode):

  * API: **FastAPI** or **Node.js (Express)**
  * Git operations: **GitPython / simple-git**
  * Sync: **WebSocket server** for Y.js sessions
  * Metadata indexing (Postgres or SQLite)

#### **Storage**

* Git repo as single source of truth.
* Optional metadata DB for search, tags, and diagram linking.
* Compatible with **Gitea / GitLab / GitHub / self-hosted Git**.

---

### 🧠 5. User Stories

| Role             | Story                                                    | Priority |
| ---------------- | -------------------------------------------------------- | -------- |
| Architect        | Create new diagram and push it to Git repo               | ⭐⭐⭐⭐     |
| Engineer         | Link two related diagrams and view them as one graph     | ⭐⭐⭐⭐     |
| Reviewer         | View version history and rollback to older commit        | ⭐⭐⭐      |
| Team             | Collaborate live on the same diagram                     | ⭐⭐⭐⭐     |
| Technical Writer | Embed diagrams in documentation and auto-update from Git | ⭐⭐⭐      |
| Manager          | Visualize diagram evolution over time for audits         | ⭐⭐       |

---

### 🧩 6. Roadmap

| Phase                                      | Timeline  | Deliverables                                                                                                                                                                               | Key Focus                                               |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **Phase 1 – MVP**                          | Month 1   | ✅ Mermaid rendering engine <br> ✅ Basic React canvas (drag/drop, zoom/pan) <br> ✅ Local diagram save/load <br> ✅ Git commit/push integration (via isomorphic-git) <br> ✅ Export to PNG/SVG | Establish foundation, enable basic Git-based versioning |
| **Phase 2 – GitOps Foundation**            | Month 2   | ✅ Visual Git history timeline <br> ✅ Diff between diagram versions <br> ✅ Branching and rollback support <br> ✅ User authentication (Git token/SSH)                                        | Enable full Git lifecycle and version awareness         |
| **Phase 3 – Cross-Linking**                | Month 3   | ✅ Inter-diagram links via node references <br> ✅ “Graph of diagrams” overview view <br> ✅ Metadata indexing for relationships                                                              | Build connected diagram ecosystem                       |
| **Phase 4 – Collaboration Layer**          | Month 4–5 | ✅ Real-time editing via Y.js + WebSocket <br> ✅ Presence and cursor indicators <br> ✅ Conflict-free sync and auto Git commits <br> ✅ Activity logs per session                             | Introduce CRDT-powered live teamwork                    |
| **Phase 5 – Integrations & Embedding**     | Month 6   | ✅ Embed diagrams in Markdown/docs <br> ✅ REST API for fetching diagrams <br> ✅ Webhook triggers for CI/CD sync                                                                             | Extend usability and external integrations              |
| **Phase 6 – Enterprise Features**          | Month 7–8 | ✅ Role-based access control (RBAC) <br> ✅ SSO (OAuth2/Keycloak) <br> ✅ Multi-repo management <br> ✅ Audit log and compliance export                                                        | Enterprise-grade security and control                   |
| **Phase 7 – GitOps Visualizer**            | Month 9   | ✅ Time-lapse “architecture replay” mode <br> ✅ Branch comparison UI <br> ✅ Animated change diff viewer                                                                                     | Git-native visualization for architectural evolution    |
| **Phase 8 – Plugin & Extension Framework** | Month 10+ | ✅ Custom node and renderer plugins <br> ✅ Extension marketplace <br> ✅ Internal API documentation                                                                                          | Build an ecosystem for extensibility                    |

---

### 🧩 7. Non-Functional Requirements

| Category          | Requirement                                                    |
| ----------------- | -------------------------------------------------------------- |
| **Performance**   | Load and render diagrams with up to 500 nodes in <2 seconds    |
| **Scalability**   | Support teams of 100+ concurrent users (with Y.js backend)     |
| **Availability**  | 99.9% uptime (for hosted deployments)                          |
| **Security**      | Encrypted Git credentials, SSH key support, OAuth2 integration |
| **Portability**   | Docker & Helm deployment for on-premise and cloud              |
| **Extensibility** | Plugin architecture for future features                        |

---

### 🎨 8. UI/UX Principles

* Clean, modern interface inspired by **Atlantis** and **Excalidraw**.
* Split view: **Editor (Mermaid code)** ↔ **Canvas (Rendered Diagram)**.
* Floating toolbar for tools: *Select, Connect, Text, Shape, Link, Export*.
* Breadcrumbs for navigating linked diagrams.
* Git panel (commit message, branch selector, version diff).
* Realtime presence avatars for team mode.

---

### 📦 9. Deliverables

* **Frontend:** React-based SPA
* **Backend:** Optional API service (FastAPI or Node)
* **GitOps integration:** Commit, rollback, branch, diff
* **Deployment:** Dockerfile + Helm chart
* **Docs:**

  * Setup guide
  * Developer contribution guide
  * API and plugin documentation
* **Testing:** Unit + integration for rendering, Git ops, and collaboration

---