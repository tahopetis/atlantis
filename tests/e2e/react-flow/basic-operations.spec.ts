import { test, expect } from '../fixtures/custom-fixtures'
import { COORDINATES } from '../fixtures/test-data'

test.describe('React Flow Canvas - Basic Operations', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto()
    await editorPage.waitForEditorInitialization()

    // Switch to visual mode
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()
  })

  test('should display React Flow canvas with all components', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Check main components are visible
    await expect(canvas.container).toBeVisible()
    await expect(canvas.header).toBeVisible()
    await expect(canvas.nodePalette).toBeVisible()
    await expect(canvas.reactFlowCanvas).toBeVisible()
    await expect(canvas.background).toBeVisible()

    // Check for controls
    await expect(canvas.controls).toBeVisible()
    await expect(canvas.minimap).toBeVisible()

    // Check for tips panel
    const hasTips = await canvas.hasTipsPanel()
    if (hasTips) {
      await expect(canvas.tipsPanel).toBeVisible()
    }
  })

  test('should display available node types in palette', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas
    const nodeTypes = await canvas.getAvailableNodeTypes()

    // Should include basic node types
    expect(nodeTypes).toContain('rectangle')
    expect(nodeTypes).toContain('circle')
    expect(nodeTypes).toContain('diamond')
    expect(nodeTypes).toContain('parallelogram')

    // All node buttons should be visible
    const buttonCount = await canvas.nodeButtons.count()
    expect(buttonCount).toBe(nodeTypes.length)
  })

  test('should add node by clicking palette button', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Initial state - no nodes
    const initialNodeCount = await canvas.getNodeCount()
    expect(initialNodeCount).toBe(0)

    // Add a rectangle node
    await canvas.addNodeByClick('rectangle')

    // Should now have one node
    const newNodeCount = await canvas.getNodeCount()
    expect(newNodeCount).toBe(1)

    // Add another node type
    await canvas.addNodeByClick('circle')
    const finalNodeCount = await canvas.getNodeCount()
    expect(finalNodeCount).toBe(2)
  })

  test('should add node by drag and drop', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Initial state
    const initialNodeCount = await canvas.getNodeCount()
    expect(initialNodeCount).toBe(0)

    // Drag and drop a diamond node
    await canvas.addNodeByDragAndDrop('diamond', COORDINATES.center.x, COORDINATES.center.y)

    // Should have one node
    const newNodeCount = await canvas.getNodeCount()
    expect(newNodeCount).toBe(1)

    // Verify node position (approximately where we dropped it)
    const nodes = await canvas.getNodesData()
    expect(nodes).toHaveLength(1)
    expect(nodes[0].type).toBe('diamond')
    expect(nodes[0].position.x).toBeCloseTo(COORDINATES.center.x, -50) // Allow some tolerance
    expect(nodes[0].position.y).toBeCloseTo(COORDINATES.center.y, -50)
  })

  test('should create multiple nodes of different types', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    const nodeTypes = ['rectangle', 'circle', 'diamond', 'parallelogram']

    for (const nodeType of nodeTypes) {
      await canvas.addNodeByClick(nodeType)
      await editorPage.page.waitForTimeout(200) // Wait for node creation
    }

    // Should have 4 nodes
    const nodeCount = await canvas.getNodeCount()
    expect(nodeCount).toBe(4)

    // Verify node types
    const nodes = await canvas.getNodesData()
    const actualTypes = nodes.map(node => node.type).sort()
    const expectedTypes = nodeTypes.sort()
    expect(actualTypes).toEqual(expectedTypes)
  })

  test('should select nodes by clicking', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Add some nodes first
    await canvas.addNodeByClick('rectangle')
    await canvas.addNodeByClick('circle')
    await editorPage.page.waitForTimeout(500)

    // Select the first node
    await canvas.selectNode(0)
    await editorPage.page.waitForTimeout(100)

    // Node should be selected (this might be visual - check for selection state)
    const nodes = await canvas.getNodesData()
    expect(nodes).toHaveLength(2)

    // Select the second node by label (assuming it has a label)
    await canvas.selectNode(1)
    await editorPage.page.waitForTimeout(100)

    // Should still have the same number of nodes
    const nodeCountAfterSelection = await canvas.getNodeCount()
    expect(nodeCountAfterSelection).toBe(2)
  })

  test('should drag nodes to new positions', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Add a node
    await canvas.addNodeByDragAndDrop('rectangle', COORDINATES.topLeft.x, COORDINATES.topLeft.y)
    await editorPage.page.waitForTimeout(500)

    // Get initial position
    const initialNodes = await canvas.getNodesData()
    expect(initialNodes).toHaveLength(1)
    const initialPos = initialNodes[0].position

    // Drag node to new position
    await canvas.dragNode(0, COORDINATES.bottomRight.x, COORDINATES.bottomRight.y)
    await editorPage.page.waitForTimeout(200)

    // Verify new position
    const finalNodes = await canvas.getNodesData()
    expect(finalNodes).toHaveLength(1)
    const finalPos = finalNodes[0].position

    // Position should have changed
    expect(finalPos.x).not.toBe(initialPos.x)
    expect(finalPos.y).not.toBe(initialPos.y)

    // Should be approximately where we dragged it
    expect(finalPos.x).toBeCloseTo(COORDINATES.bottomRight.x, -50)
    expect(finalPos.y).toBeCloseTo(COORDINATES.bottomRight.y, -50)
  })

  test('should connect nodes with edges', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Add two nodes
    await canvas.addNodeByDragAndDrop('rectangle', COORDINATES.topLeft.x, COORDINATES.topLeft.y)
    await canvas.addNodeByDragAndDrop('circle', COORDINATES.topRight.x, COORDINATES.topRight.y)
    await editorPage.page.waitForTimeout(500)

    // Initial state - no edges
    const initialEdgeCount = await canvas.getEdgeCount()
    expect(initialEdgeCount).toBe(0)

    // Connect the nodes
    await canvas.connectNodes(0, 1)
    await editorPage.page.waitForTimeout(500)

    // Should now have one edge
    const finalEdgeCount = await canvas.getEdgeCount()
    expect(finalEdgeCount).toBe(1)

    // Should still have the same number of nodes
    const nodeCount = await canvas.getNodeCount()
    expect(nodeCount).toBe(2)
  })

  test('should create multiple connections', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Create a flow: A -> B -> C
    await canvas.addNodeByDragAndDrop('rectangle', COORDINATES.topLeft.x, COORDINATES.topLeft.y)
    await canvas.addNodeByDragAndDrop('rectangle', COORDINATES.center.x, COORDINATES.center.y)
    await canvas.addNodeByDragAndDrop('rectangle', COORDINATES.topRight.x, COORDINATES.topRight.y)
    await editorPage.page.waitForTimeout(500)

    // Connect A -> B and B -> C
    await canvas.connectNodes(0, 1)
    await editorPage.page.waitForTimeout(300)
    await canvas.connectNodes(1, 2)
    await editorPage.page.waitForTimeout(300)

    // Should have 2 edges
    const edgeCount = await canvas.getEdgeCount()
    expect(edgeCount).toBe(2)

    // Should have 3 nodes
    const nodeCount = await canvas.getNodeCount()
    expect(nodeCount).toBe(3)
  })

  test('should delete selected nodes', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Add some nodes
    await canvas.addNodeByClick('rectangle')
    await canvas.addNodeByClick('circle')
    await canvas.addNodeByClick('diamond')
    await editorPage.page.waitForTimeout(500)

    // Should have 3 nodes
    const initialNodeCount = await canvas.getNodeCount()
    expect(initialNodeCount).toBe(3)

    // Select and delete the second node
    await canvas.selectNode(1)
    await canvas.deleteSelectedNode()
    await editorPage.page.waitForTimeout(200)

    // Should have 2 nodes now
    const nodeCountAfterDeletion = await canvas.getNodeCount()
    expect(nodeCountAfterDeletion).toBe(2)
  })

  test('should clear all nodes and edges', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Create some nodes and edges
    await canvas.addNodeByClick('rectangle')
    await canvas.addNodeByClick('circle')
    await canvas.addNodeByClick('diamond')

    // Connect them
    await canvas.connectNodes(0, 1)
    await canvas.connectNodes(1, 2)
    await editorPage.page.waitForTimeout(500)

    // Verify we have content
    const nodeCount = await canvas.getNodeCount()
    const edgeCount = await canvas.getEdgeCount()
    expect(nodeCount).toBe(3)
    expect(edgeCount).toBe(2)

    // Clear all
    await canvas.clearAll()
    await editorPage.page.waitForTimeout(500)

    // Should be empty
    const finalNodeCount = await canvas.getNodeCount()
    const finalEdgeCount = await canvas.getEdgeCount()
    expect(finalNodeCount).toBe(0)
    expect(finalEdgeCount).toBe(0)
  })

  test('should handle canvas zoom controls', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Add a node to have something to zoom
    await canvas.addNodeByClick('rectangle')
    await editorPage.page.waitForTimeout(300)

    // Get initial transform
    const initialTransform = await canvas.getCanvasTransform()
    expect(initialTransform.zoom).toBe(1) // Should start at 100%

    // Zoom in
    await canvas.zoomIn()
    await editorPage.page.waitForTimeout(200)

    const zoomInTransform = await canvas.getCanvasTransform()
    expect(zoomInTransform.zoom).toBeGreaterThan(initialTransform.zoom)

    // Zoom out
    await canvas.zoomOut()
    await editorPage.page.waitForTimeout(200)

    const zoomOutTransform = await canvas.getCanvasTransform()
    expect(zoomOutTransform.zoom).toBeLessThan(zoomInTransform.zoom)

    // Fit view
    await canvas.fitView()
    await editorPage.page.waitForTimeout(500)

    // Should fit all nodes in view
    const fitTransform = await canvas.getCanvasTransform()
    expect(fitTransform.zoom).toBeGreaterThan(0)
    expect(fitTransform.zoom).toBeLessThan(5) // Reasonable zoom limits
  })

  test('should pan the canvas', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Add some nodes
    await canvas.addNodeByClick('rectangle')
    await canvas.addNodeByClick('circle')
    await editorPage.page.waitForTimeout(300)

    // Get initial transform
    const initialTransform = await canvas.getCanvasTransform()
    const initialX = initialTransform.x
    const initialY = initialTransform.y

    // Pan the canvas
    await canvas.panCanvas(100, 50)
    await editorPage.page.waitForTimeout(200)

    // Check that position changed
    const pannedTransform = await canvas.getCanvasTransform()
    expect(pannedTransform.x).not.toBe(initialX)
    expect(pannedTransform.y).not.toBe(initialY)
  })

  test('should display minimap with overview', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Should have minimap
    const hasMinimap = await canvas.hasMinimap()
    expect(hasMinimap).toBe(true)

    // Add nodes to populate minimap
    await canvas.addNodeByClick('rectangle')
    await canvas.addNodeByClick('circle')
    await canvas.addNodeByClick('diamond')
    await editorPage.page.waitForTimeout(500)

    // Minimap should still be visible
    await expect(canvas.minimap).toBeVisible()

    // Connect nodes to create edges
    await canvas.connectNodes(0, 1)
    await canvas.connectNodes(1, 2)
    await editorPage.page.waitForTimeout(300)

    // Should have edges visible in minimap
    await expect(canvas.minimap).toBeVisible()
  })

  test('should display background pattern', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Should have background
    const hasBackground = await canvas.hasBackgroundPattern()
    expect(hasBackground).toBe(true)

    await expect(canvas.background).toBeVisible()
  })

  test('should show tips panel with helpful information', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    const hasTips = await canvas.hasTipsPanel()
    if (hasTips) {
      await expect(canvas.tipsPanel).toBeVisible()

      // Should have tips content
      const tips = await canvas.getTipsContent()
      expect(tips.length).toBeGreaterThan(0)

      // Should include helpful tips
      const allTipsText = tips.join(' ').toLowerCase()
      expect(allTipsText).toContain('drag')
      expect(allTipsText).toContain('node')
    }
  })

  test('should handle rapid node creation without breaking', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Rapidly add nodes
    for (let i = 0; i < 10; i++) {
      await canvas.addNodeByClick('rectangle')
      await editorPage.page.waitForTimeout(50) // Very short delay
    }

    // Should have 10 nodes
    const nodeCount = await canvas.getNodeCount()
    expect(nodeCount).toBe(10)

    // Canvas should still be responsive
    await expect(canvas.container).toBeVisible()
    await expect(canvas.nodePalette).toBeVisible()
  })

  test('should handle empty canvas state', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Clear any existing content
    await canvas.clearAll()
    await editorPage.page.waitForTimeout(300)

    // Should have empty canvas
    const nodeCount = await canvas.getNodeCount()
    const edgeCount = await canvas.getEdgeCount()
    expect(nodeCount).toBe(0)
    expect(edgeCount).toBe(0)

    // Canvas components should still be visible
    await expect(canvas.container).toBeVisible()
    await expect(canvas.nodePalette).toBeVisible()
    await expect(canvas.reactFlowCanvas).toBeVisible()
  })
})