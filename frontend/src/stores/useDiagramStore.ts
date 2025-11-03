import { create } from 'zustand'
import { Node, Edge } from 'reactflow'
import { parseMermaidToFlow } from '@/utils/mermaidParser'

export interface MermaidError {
  message: string
  line?: number
  column?: number
  hash?: string
}

export type EditorMode = 'code' | 'visual'

export interface DiagramState {
  code: string
  isLoading: boolean
  error: MermaidError | null
  isValid: boolean
  zoom: number
  autoFit: boolean
  mode: EditorMode
  flowNodes: Node[]
  flowEdges: Edge[]
}

export interface DiagramActions {
  setCode: (code: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: MermaidError | null) => void
  setValid: (valid: boolean) => void
  setZoom: (zoom: number) => void
  setAutoFit: (autoFit: boolean) => void
  resetZoom: () => void
  fitToScreen: () => void
  clearError: () => void
  setMode: (mode: EditorMode) => void
  setFlowNodes: (nodes: Node[]) => void
  setFlowEdges: (edges: Edge[]) => void
  updateFlowData: (nodes: Node[], edges: Edge[]) => void
  generateMermaidFromFlow: () => void
  parseMermaidToFlow: () => void
}

const defaultMermaidCode = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`

export const useDiagramStore = create<DiagramState & DiagramActions>((set, get) => ({
  // Initial state
  code: defaultMermaidCode,
  isLoading: false,
  error: null,
  isValid: true,
  zoom: 1,
  autoFit: true,
  mode: 'code',
  flowNodes: [],
  flowEdges: [],

  // Actions
  setCode: (code: string) =>
    set({
      code,
      error: null,
      isValid: true
    }),

  setLoading: (isLoading: boolean) =>
    set({ isLoading }),

  setError: (error: MermaidError | null) =>
    set({
      error,
      isValid: error === null
    }),

  setValid: (valid: boolean) =>
    set({ isValid: valid }),

  setZoom: (zoom: number) =>
    set({
      zoom: Math.max(0.1, Math.min(3, zoom)),
      autoFit: false
    }),

  setAutoFit: (autoFit: boolean) =>
    set({ autoFit }),

  resetZoom: () =>
    set({
      zoom: 1,
      autoFit: true
    }),

  fitToScreen: () =>
    set({
      autoFit: true
    }),

  clearError: () =>
    set({
      error: null,
      isValid: true
    }),

  setMode: (mode: EditorMode) =>
    set({ mode }),

  setFlowNodes: (flowNodes: Node[]) =>
    set({ flowNodes }),

  setFlowEdges: (flowEdges: Edge[]) =>
    set({ flowEdges }),

  updateFlowData: (flowNodes: Node[], flowEdges: Edge[]) =>
    set({ flowNodes, flowEdges }),

  generateMermaidFromFlow: () => {
    const { flowNodes, flowEdges } = get()

    if (flowNodes.length === 0) {
      set({ code: '' })
      return
    }

    let mermaidCode = 'graph TD\n'

    // Add nodes
    flowNodes.forEach((node, index) => {
      const id = node.id
      const label = node.data?.label || `Node ${index + 1}`
      const nodeType = node.type || 'default'

      // Map React Flow node types to Mermaid shapes
      let shapePrefix = ''
      let shapeSuffix = ''
      switch (nodeType) {
        case 'input':
          shapePrefix = '('
          shapeSuffix = ')'
          break
        case 'output':
          shapePrefix = '(['
          shapeSuffix = '])'
          break
        case 'diamond':
          shapePrefix = '{'
          shapeSuffix = '}'
          break
        case 'parallelogram':
          shapePrefix = '[/'
          shapeSuffix = '/]'
          break
        case 'circle':
          shapePrefix = '(('
          shapeSuffix = '))'
          break
        case 'stadium':
          shapePrefix = '(['
          shapeSuffix = '])'
          break
        case 'subroutine':
          shapePrefix = '[['
          shapeSuffix = ']]'
          break
        case 'cylinder':
          shapePrefix = '[('
          shapeSuffix = ')]'
          break
        case 'hexagon':
          shapePrefix = '{{'
          shapeSuffix = '}}'
          break
        default:
          shapePrefix = '['
          shapeSuffix = ']'
      }

      mermaidCode += `    ${id}${shapePrefix}${label}${shapeSuffix}\n`
    })

    // Add edges
    flowEdges.forEach((edge) => {
      const source = edge.source
      const target = edge.target
      const label = edge.label || edge.data?.label

      // Map React Flow edge types to Mermaid arrow styles
      let arrowStyle = '-->'
      switch (edge.type) {
        case 'straight':
          arrowStyle = '-->'
          break
        case 'step':
          arrowStyle = '-->'
          break
        case 'smoothstep':
          arrowStyle = '-->'
          break
        default:
          arrowStyle = '-->'
      }

      if (label) {
        mermaidCode += `    ${source} ${arrowStyle} |${label}| ${target}\n`
      } else {
        mermaidCode += `    ${source} ${arrowStyle} ${target}\n`
      }
    })

    set({ code: mermaidCode.trim() })
  },

  parseMermaidToFlow: () => {
    const { code } = get()
    const { nodes, edges } = parseMermaidToFlow(code)
    set({ flowNodes: nodes, flowEdges: edges })
  },
}))