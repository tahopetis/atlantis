import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import { ReactFlowCanvas } from '../ReactFlowCanvas'
import { useDiagramStore } from '@/stores/useDiagramStore'

// Mock the store
jest.mock('@/stores/useDiagramStore')

// Mock ReactFlow components
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  ReactFlow: ({ children, onNodesChange, onEdgesChange, onConnect }: any) => (
    <div data-testid="react-flow-canvas">
      <div data-testid="mock-controls">
        <button onClick={() => onNodesChange([{ type: 'reset' }])}>Reset Nodes</button>
        <button onClick={() => onEdgesChange([{ type: 'reset' }])}>Reset Edges</button>
        <button onClick={() => onConnect({ source: 'node1', target: 'node2' })}>
          Connect Nodes
        </button>
      </div>
      {children}
    </div>
  ),
  Background: () => <div data-testid="react-flow-background" />,
  Controls: ({ className }: any) => <div data-testid="react-flow-controls" className={className} />,
  MiniMap: () => <div data-testid="react-flow-minimap" />,
  Panel: ({ children, position }: any) => (
    <div data-testid="react-flow-panel" data-position={position}>
      {children}
    </div>
  ),
  ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
  useNodesState: (initial: any) => [initial, jest.fn(), jest.fn()],
  useEdgesState: (initial: any) => [initial, jest.fn(), jest.fn()],
  addEdge: (params: any, edges: any) => [...edges, { id: 'edge1', ...params }],
}))

const mockUseDiagramStore = useDiagramStore as jest.MockedFunction<typeof useDiagramStore>

describe('ReactFlowCanvas', () => {
  const mockStore = {
    flowNodes: [],
    flowEdges: [],
    setFlowNodes: jest.fn(),
    setFlowEdges: jest.fn(),
    generateMermaidFromFlow: jest.fn(),
    setMode: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDiagramStore.mockReturnValue(mockStore as any)
  })

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <ReactFlowProvider>
        {component}
      </ReactFlowProvider>
    )
  }

  it('renders the visual editor interface', () => {
    renderWithProvider(<ReactFlowCanvas />)

    expect(screen.getByText('Visual Editor')).toBeInTheDocument()
    expect(screen.getByText('Drag and drop nodes to create your diagram')).toBeInTheDocument()
    expect(screen.getByText('Add Node:')).toBeInTheDocument()
    expect(screen.getByText('Export Code')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('displays node type buttons', () => {
    renderWithProvider(<ReactFlowCanvas />)

    expect(screen.getByText('rectangle')).toBeInTheDocument()
    expect(screen.getByText('circle')).toBeInTheDocument()
    expect(screen.getByText('diamond')).toBeInTheDocument()
    expect(screen.getByText('parallelogram')).toBeInTheDocument()
  })

  it('handles export code button click', () => {
    renderWithProvider(<ReactFlowCanvas />)

    const exportButton = screen.getByLabelText('Export to Mermaid code')
    fireEvent.click(exportButton)

    expect(mockStore.generateMermaidFromFlow).toHaveBeenCalled()
    expect(mockStore.setMode).toHaveBeenCalledWith('code')
  })

  it('handles clear canvas button click', () => {
    renderWithProvider(<ReactFlowCanvas />)

    const clearButton = screen.getByLabelText('Clear all nodes and edges')
    fireEvent.click(clearButton)

    expect(mockStore.setFlowNodes).toHaveBeenCalledWith([])
    expect(mockStore.setFlowEdges).toHaveBeenCalledWith([])
  })

  it('handles mode switch to code', () => {
    renderWithProvider(<ReactFlowCanvas />)

    const codeButton = screen.getByRole('tab', { name: /code/i })
    fireEvent.click(codeButton)

    expect(mockStore.generateMermaidFromFlow).toHaveBeenCalled()
    expect(mockStore.setMode).toHaveBeenCalledWith('code')
  })

  it('shows visual tab as selected', () => {
    renderWithProvider(<ReactFlowCanvas />)

    const visualTab = screen.getByRole('tab', { name: /visual/i })
    expect(visualTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders React Flow components', () => {
    renderWithProvider(<ReactFlowCanvas />)

    expect(screen.getByTestId('react-flow-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('react-flow-background')).toBeInTheDocument()
    expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument()
    expect(screen.getByTestId('react-flow-minimap')).toBeInTheDocument()
    expect(screen.getByTestId('react-flow-panel')).toBeInTheDocument()
  })

  it('displays helpful tips panel', () => {
    renderWithProvider(<ReactFlowCanvas />)

    expect(screen.getByText('Tips:')).toBeInTheDocument()
    expect(screen.getByText('• Drag nodes from palette')).toBeInTheDocument()
    expect(screen.getByText('• Click nodes to select')).toBeInTheDocument()
    expect(screen.getByText('• Drag handles to connect')).toBeInTheDocument()
    expect(screen.getByText('• Double-click to edit labels')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    renderWithProvider(<ReactFlowCanvas />)

    // Check for proper ARIA roles and labels
    expect(screen.getByRole('tablist', { name: 'Editor mode' })).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Node shapes' })).toBeInTheDocument()
    expect(screen.getByRole('main', { name: 'Visual diagram editor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add rectangle node' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add circle node' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add diamond node' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add parallelogram node' })).toBeInTheDocument()
  })
})