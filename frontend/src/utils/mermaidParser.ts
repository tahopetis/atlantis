import { Node, Edge } from 'reactflow'

/**
 * Parse Mermaid graph code and convert to React Flow nodes and edges
 */
export function parseMermaidToFlow(mermaidCode: string): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  if (!mermaidCode.trim()) {
    return { nodes, edges }
  }

  const lines = mermaidCode.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('graph'))

  lines.forEach((line, index) => {
    // Parse nodes (simple parsing for basic node definitions)
    const nodeMatch = line.match(/^(\w+)\s*(\(|\[|\{|\[\/|\(\[|\[\[|\[\(|{{)\s*([^)\]\}]+)\s*(\)|\]|\}|\/\]|\]\)|\]\]|\)\]|}})?\s*$/)

    if (nodeMatch) {
      const [, id, startLabel, label, endLabel] = nodeMatch
      const fullLabel = label || `Node ${index + 1}`

      let nodeType = 'default'

      // Determine node type based on brackets
      if (startLabel === '(' && endLabel === ')') {
        nodeType = 'stadium' // Rounded edges
      } else if (startLabel === '{' && endLabel === '}') {
        nodeType = 'diamond' // Diamond shape
      } else if (startLabel === '[/' && endLabel === '/]') {
        nodeType = 'parallelogram' // Parallelogram
      } else if (startLabel === '((' && endLabel === '))') {
        nodeType = 'circle' // Circle
      } else if (startLabel === '[[' && endLabel === ']]') {
        nodeType = 'subroutine' // Subroutine
      } else if (startLabel === '[(' && endLabel === ')]') {
        nodeType = 'cylinder' // Database
      } else if (startLabel === '{{' && endLabel === '}}') {
        nodeType = 'hexagon' // Hexagon
      } else {
        nodeType = 'rectangle' // Default rectangle
      }

      const node: Node = {
        id,
        type: nodeType,
        position: {
          x: 100 + (index % 3) * 200,
          y: 100 + Math.floor(index / 3) * 150
        },
        data: { label: fullLabel.trim() },
      }

      nodes.push(node)
    }

    // Parse edges (connections between nodes)
    const edgeMatch = line.match(/^(\w+)\s*(-->|\.-\.|===)\s*(\|([^|]+)\|)?\s*(\w+)$/)

    if (edgeMatch) {
      const [, source, , , label, target] = edgeMatch

      const edge: Edge = {
        id: `${source}-${target}`,
        source,
        target,
        type: 'default',
        label: label || undefined,
        data: label ? { label } : undefined,
      }

      edges.push(edge)
    }
  })

  return { nodes, edges }
}

/**
 * Generate a unique ID for new nodes
 */
export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a unique ID for new edges
 */
export function generateEdgeId(source: string, target: string): string {
  return `${source}-${target}-${Date.now()}`
}