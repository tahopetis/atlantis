export interface Diagram {
  id: string
  title: string
  description?: string
  mermaidCode: string
  createdAt: string
  updatedAt: string
  gitPath?: string
  gitBranch?: string
  gitCommit?: string
  tags?: string[]
}

export interface GitRepository {
  id: string
  name: string
  url: string
  localPath: string
  defaultBranch: string
  currentBranch: string
  lastCommit?: GitCommit
}

export interface GitCommit {
  hash: string
  message: string
  author: string
  date: string
  files: string[]
}

export interface GitDiff {
  filePath: string
  additions: number
  deletions: number
  changes: GitChange[]
}

export interface GitChange {
  type: 'added' | 'removed' | 'modified'
  line: number
  content: string
}

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  gitToken?: string
  repositories: GitRepository[]
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'json' | 'markdown'
  theme?: 'light' | 'dark' | 'forest' | 'neutral'
  width?: number
  height?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface DiagramNode {
  id: string
  type: string
  data: Record<string, any>
  position: { x: number; y: number }
  connections?: string[]
}

export interface DiagramEdge {
  id: string
  source: string
  target: string
  type?: string
  data?: Record<string, any>
}