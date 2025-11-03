import { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useDiagramStore } from '@/stores/useDiagramStore'
import { Code, Eye, Trash2 } from 'lucide-react'

// Node types
const nodeTypes: NodeTypes = {
  rectangle: RectangleNode,
  circle: CircleNode,
  diamond: DiamondNode,
  parallelogram: ParallelogramNode,
}

// Edge types
const edgeTypes: EdgeTypes = {
  default: DefaultEdge,
}

// Custom node components
function RectangleNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${
        selected ? 'border-blue-500' : 'border-gray-200'
      } min-w-[100px] text-center`}
    >
      <div className="text-sm font-medium">{data.label}</div>
    </div>
  )
}

function CircleNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div
      className={`w-20 h-20 shadow-md rounded-full bg-white border-2 flex items-center justify-center ${
        selected ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <div className="text-xs font-medium text-center px-2">{data.label}</div>
    </div>
  )
}

function DiamondNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div
      className={`px-4 py-2 shadow-md bg-white border-2 transform rotate-45 ${
        selected ? 'border-blue-500' : 'border-gray-200'
      } min-w-[80px] h-16 flex items-center justify-center`}
    >
      <div className="text-sm font-medium transform -rotate-45">{data.label}</div>
    </div>
  )
}

function ParallelogramNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div
      className={`px-4 py-2 shadow-md bg-white border-2 transform skew-x-12 ${
        selected ? 'border-blue-500' : 'border-gray-200'
      } min-w-[100px] text-center`}
    >
      <div className="text-sm font-medium transform -skew-x-12">{data.label}</div>
    </div>
  )
}

function DefaultEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
}: any) {
  const edgePath = `M${sourceX},${sourceY} L${targetX},${targetY}`

  return (
    <g>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        stroke="#b1b1b7"
        strokeWidth={2}
      />
      {data?.label && (
        <text>
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle" className="text-xs fill-gray-600">
            {data.label}
          </textPath>
        </text>
      )}
    </g>
  )
}

function ReactFlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  const {
    flowNodes,
    flowEdges,
    setFlowNodes,
    setFlowEdges,
    generateMermaidFromFlow,
    setMode,
  } = useDiagramStore()

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Update store when nodes/edges change
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes)
    setNodes(nodes)
  }, [nodes, onNodesChange, setNodes])

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes)
    setEdges(edges)
  }, [edges, onEdgesChange, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = addEdge(params, edges)
      setEdges(newEdge)
      setFlowEdges(newEdge)
    },
    [edges, setEdges, setFlowEdges]
  )

  const onInit = useCallback((rfi: any) => {
    setReactFlowInstance(rfi)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds || !reactFlowInstance) return

      const type = event.dataTransfer.getData('application/reactflow')
      if (typeof type === 'undefined' || !type) return

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: `New ${type}` },
      }

      const newNodes = [...nodes, newNode]
      setNodes(newNodes)
      setFlowNodes(newNodes)
    },
    [reactFlowInstance, nodes, setNodes, setFlowNodes]
  )

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleClearCanvas = () => {
    setNodes([])
    setEdges([])
    setFlowNodes([])
    setFlowEdges([])
  }

  const handleExportCode = () => {
    generateMermaidFromFlow()
    setMode('code')
  }

  const handleSwitchToCodeMode = () => {
    generateMermaidFromFlow()
    setMode('code')
  }

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `New ${type}` },
    }

    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    setFlowNodes(newNodes)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="font-medium">Visual Editor</h3>
            {/* Mode Toggle */}
            <nav className="flex items-center bg-muted rounded-lg p-1" role="tablist" aria-label="Editor mode">
              <button
                onClick={handleSwitchToCodeMode}
                className={`px-2 sm:px-3 py-1.5 text-sm rounded-md flex items-center space-x-1 transition-colors hover:bg-background/50`}
                role="tab"
                aria-selected="false"
                aria-controls="code-panel"
                tabIndex={0}
              >
                <Code className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">Code</span>
              </button>
              <button
                className={`px-2 sm:px-3 py-1.5 text-sm rounded-md flex items-center space-x-1 transition-colors bg-background shadow-sm`}
                role="tab"
                aria-selected="true"
                aria-controls="visual-panel"
                tabIndex={0}
              >
                <Eye className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">Visual</span>
              </button>
            </nav>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop nodes to create your diagram
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCode}
            className="px-2 sm:px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center space-x-1"
            aria-label="Export to Mermaid code"
          >
            <Code className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleClearCanvas}
            className="px-2 sm:px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 flex items-center space-x-1"
            aria-label="Clear all nodes and edges"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </header>

      {/* Node Palette */}
      <section className="p-4 border-b bg-muted/30" aria-label="Node tools">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm font-medium whitespace-nowrap">Add Node:</span>
          <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Node shapes">
            {['rectangle', 'circle', 'diamond', 'parallelogram'].map((type) => (
              <button
                key={type}
                draggable
                onDragStart={(event) => onDragStart(event, type)}
                onClick={() => addNode(type)}
                className="px-2 sm:px-3 py-2 text-sm bg-white border rounded cursor-move hover:bg-gray-50 capitalize border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                aria-label={`Add ${type} node`}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* React Flow Canvas */}
      <main className="flex-1" ref={reactFlowWrapper} role="main" aria-label="Visual diagram editor">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-gray-50"
          aria-label="Diagram canvas"
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'circle': return '#60a5fa'
                case 'diamond': return '#f59e0b'
                case 'parallelogram': return '#8b5cf6'
                default: return '#6b7280'
              }
            }}
            className="bg-white border border-gray-200 rounded-lg"
          />
          <Controls className="bg-white border border-gray-200 rounded-lg shadow-lg" />
          <Panel position="top-left" className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-md">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-medium">Tips:</div>
              <div>• Drag nodes from palette</div>
              <div>• Click nodes to select</div>
              <div>• Drag handles to connect</div>
              <div>• Double-click to edit labels</div>
            </div>
          </Panel>
        </ReactFlow>
      </main>
    </div>
  )
}

export function ReactFlowCanvas() {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvasInner />
    </ReactFlowProvider>
  )
}