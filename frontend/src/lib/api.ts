import axios from 'axios'
import type { Diagram, GitRepository, GitCommit, ApiResponse, User } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or clear token
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Diagram API
export const diagramApi = {
  getAll: async (): Promise<Diagram[]> => {
    const response = await api.get<ApiResponse<Diagram[]>>('/api/diagrams')
    return response.data.data || []
  },

  getById: async (id: string): Promise<Diagram | null> => {
    const response = await api.get<ApiResponse<Diagram>>(`/api/diagrams/${id}`)
    return response.data.data || null
  },

  create: async (diagram: Partial<Diagram>): Promise<Diagram> => {
    const response = await api.post<ApiResponse<Diagram>>('/api/diagrams', diagram)
    return response.data.data!
  },

  update: async (id: string, diagram: Partial<Diagram>): Promise<Diagram> => {
    const response = await api.put<ApiResponse<Diagram>>(`/api/diagrams/${id}`, diagram)
    return response.data.data!
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/diagrams/${id}`)
  },

  export: async (id: string, format: string): Promise<Blob> => {
    const response = await api.get(`/api/diagrams/${id}/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  }
}

// Git API
export const gitApi = {
  getRepositories: async (): Promise<GitRepository[]> => {
    const response = await api.get<ApiResponse<GitRepository[]>>('/api/git/repositories')
    return response.data.data || []
  },

  addRepository: async (repo: Partial<GitRepository>): Promise<GitRepository> => {
    const response = await api.post<ApiResponse<GitRepository>>('/api/git/repositories', repo)
    return response.data.data!
  },

  getCommits: async (repoId: string, branch?: string): Promise<GitCommit[]> => {
    const response = await api.get<ApiResponse<GitCommit[]>>(`/api/git/repositories/${repoId}/commits`, {
      params: { branch }
    })
    return response.data.data || []
  },

  commit: async (repoId: string, message: string, files: string[]): Promise<GitCommit> => {
    const response = await api.post<ApiResponse<GitCommit>>(`/api/git/repositories/${repoId}/commit`, {
      message,
      files
    })
    return response.data.data!
  },

  push: async (repoId: string, branch: string): Promise<void> => {
    await api.post(`/api/git/repositories/${repoId}/push`, { branch })
  },

  pull: async (repoId: string, branch: string): Promise<void> => {
    await api.post(`/api/git/repositories/${repoId}/pull`, { branch })
  }
}

// User API
export const userApi = {
  getCurrent: async (): Promise<User | null> => {
    const response = await api.get<ApiResponse<User>>('/api/users/me')
    return response.data.data || null
  },

  update: async (user: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/api/users/me', user)
    return response.data.data!
  }
}

export default api