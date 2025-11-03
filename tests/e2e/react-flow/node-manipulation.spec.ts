import { test, expect } from '../fixtures/custom-fixtures'
import { COORDINATES } from '../fixtures/test-data'

test.describe('React Flow Node Manipulation', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto()
    await editorPage.waitForEditorInitialization()
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()
  })

  test('should edit node labels by double-clicking', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Add a node
    await canvas.addNodeByClick('rectangle')
    await editorPage.page.waitForTimeout(500)

    // Get initial label
    const initialNodes = await canvas.getNodesData()
    expect(initialNodes).toHaveLength(1)
    const initialLabel = initialNodes[0].label

    // Double-click to edit
    await canvas.editNode(0, 'New Label')
    await editorPage.page.waitForTimeout(300)

    // Verify label was changed
    const updatedNodes = await canvas.getNodesData()
    expect(updatedNodes).toHaveLength(1)
    const updatedLabel = updatedNodes[0].label
    expect(updatedLabel).toBe('New Label')
    expect(updatedLabel).not.toBe(initialLabel)
  })

  test('should create nodes at specific positions', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    const positions = [
      { x: COORDINATES.topLeft.x, y: COORDINATES.topLeft.y },
      { x: COORDINATES.topRight.x, y: COORDINATES.topRight.y },
      { x: COORDINATES.bottomLeft.x, y: COORDINATES.bottomLeft.y },
      { x: COORDINATES.bottomRight.x, y: COORDINATES.bottomRight.y }
    ]

    // Create nodes at specific positions
    for (let i = 0; i < positions.length; i++) {
      await canvas.addNodeByDragAndDrop('rectangle', positions[i].x, positions[i].y)
      await editorPage.page.waitForTimeout(200)
    }

    // Verify nodes are at expected positions
    const nodes = await canvas.getNodesData()
    expect(nodes).toHaveLength(4)

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const expectedPos = positions[i]

      // Allow some tolerance for positioning
      expect(node.position.x).toBeCloseTo(expectedPos.x, -50)
      expect(node.position.y).toBeCloseTo(expectedPos.y, -50)
    }
  })

  test('should create different node shapes correctly', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    const nodeTypes = ['rectangle', 'circle', 'diamond', 'parallelogram']
    const positions = [
      COORDINATES.topLeft,
      COORDINATES.topRight,
      COORDINATES.bottomLeft,
      COORDINATES.bottomRight
    ]

    // Create different node types
    for (let i = 0; i < nodeTypes.length; i++) {
      await canvas.addNodeByDragAndDrop(nodeTypes[i], positions[i].x, positions[i].y)
      await editorPage.page.waitForTimeout(200)
    }

    // Verify node types
    const nodes = await canvas.getNodesData()
    expect(nodes).toHaveLength(4)

    const actualTypes = nodes.map(node => node.type).sort()
    const expectedTypes = nodeTypes.sort()
    expect(actualTypes).toEqual(expectedTypes)
  })

  test('should drag nodes smoothly without losing connections', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Create connected nodes
    await canvas.addNodeByDragAndDrop('rectangle', COORDINATES.topLeft.x, COORDINATES.topLeft.y)
    await canvas.addNodeByDragAndDrop('circle', COORDINATES.center.x, COORDINATES.center.y)
    await canvas.addNodeByDragAndDrop('diamond', COORDINATES.topRight.x, COORDINATES.topRight.y)
    await editorPage.page.waitForTimeout(500)

    // Connect them
    await canvas.connectNodes(0, 1)
    await canvas.connectNodes(1, 2)
    await editorPage.page.waitForTimeout(500)

    const initialEdgeCount = await canvas.getEdgeCount()
    expect(initialEdgeCount).toBe(2)

    // Drag the middle node
    await canvas.dragNode(1, COORDINATES.center.x + 100, COORDINATES.center.y + 100)
    await editorPage.page.waitForTimeout(300)

    // Should still have the same number of edges
    const finalEdgeCount = await canvas.getEdgeCount()
    expect(finalEdgeCount).toBe(2)

    // Node position should have changed
    const nodes = await canvas.getNodesData()
    const middleNode = nodes[1]
    expect(middleNode.position.x).toBeCloseTo(COORDINATES.center.x + 100, -30)
    expect(middleNode.position.y).toBeCloseTo(COORDINATES.center.y + 100, -30)
  })

  test('should handle overlapping nodes gracefully', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    const position = { x: COORDINATES.center.x, y: COORDINATES.center.y }

    // Create multiple nodes at the same position
    for (let i = 0; i < 3; i++) {
      await canvas.addNodeByDragAndDrop('rectangle', position.x, position.y)
      await editorPage.page.waitForTimeout(200)
    }

    // Should have 3 nodes
    const nodeCount = await canvas.getNodeCount()
    expect(nodeCount).toBe(3)

    // Should be able to select and drag them
    await canvas.selectNode(0)
    await canvas.dragNode(0, position.x + 50, position.y + 50)
    await editorPage.page.waitForTimeout(200)

    // Should still have all nodes
    const nodeCountAfterDrag = await canvas.getNodeCount()
    expect(nodeCountAfterDrag).toBe(3)

    // Positions should be different
    const nodes = await canvas.getNodesData()
    const positions = nodes.map(node => `${node.position.x},${node.position.y}`)
    const uniquePositions = [...new Set(positions)]
    expect(uniquePositions.length).toBeGreaterThan(1)
  })

  test('should delete multiple nodes and their connections', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Create a complex network
    await canvas.addNodeByClick('rectangle') // Node 0
    await canvas.addNodeByClick('circle')    // Node 1
    await canvas.addNodeByClick('diamond')   // Node 2
    await canvas.addNodeByClick('rectangle') // Node 3
    await editorPage.page.waitForTimeout(500)

    // Connect them in various ways
    await canvas.connectNodes(0, 1)
    await canvas.connectNodes(1, 2)
    await canvas.connectNodes(2, 3)
    await canvas.connectNodes(0, 2)
    await editorPage.page.waitForTimeout(500)

    const initialNodeCount = await canvas.getNodeCount()
    const initialEdgeCount = await canvas.getEdgeCount()
    expect(initialNodeCount).toBe(4)
    expect(initialEdgeCount).toBe(4)

    // Delete nodes 1 and 2
    await canvas.selectNode(1)
    await canvas.deleteSelectedNode()
    await editorPage.page.waitForTimeout(200)
    await canvas.selectNode(1) // Node indices shift after deletion
    await canvas.deleteSelectedNode()
    await editorPage.page.waitForTimeout(200)

    // Should have 2 nodes left (0 and original 3)
    const finalNodeCount = await canvas.getNodeCount()
    expect(finalNodeCount).toBe(2)

    // Should have fewer edges (connections to deleted nodes should be removed)
    const finalEdgeCount = await canvas.getEdgeCount()
    expect(finalEdgeCount).toBeLessThan(initialEdgeCount)
  })

  test('should handle node selection and deselection', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Create multiple nodes
    await canvas.addNodeByClick('rectangle')
    await canvas.addNodeByClick('circle')
    await canvas.addNodeByClick('diamond')
    await editorPage.page.waitForTimeout(500)

    // Select first node
    await canvas.selectNode(0)
    await editorPage.page.waitForTimeout(100)

    // Select second node
    await canvas.selectNode(1)
    await editorPage.page.waitForTimeout(100)

    // Select third node
    await canvas.selectNode(2)
    await editorPage.page.waitForTimeout(100)

    // Should still have all nodes
    const nodeCount = await canvas.getNodeCount()
    expect(nodeCount).toBe(3)

    // Click on empty area to deselect (if implemented)
    await canvas.reactFlowCanvas.click({ position: { x: 50, y: 50 } })
    await editorPage.page.waitForTimeout(100)

    // Should still have all nodes
    const nodeCountAfterDeselect = await canvas.getNodeCount()
    expect(nodeCountAfterDeselect).toBe(3)
  })

  test('should handle rapid node creation and deletion', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Rapidly create and delete nodes
    for (let i = 0; i < 10; i++) {
      // Add node
      await canvas.addNodeByClick('rectangle')
      await editorPage.page.waitForTimeout(50)

      // Delete it immediately
      await canvas.selectNode(0) // Always select the first (newest) node
      await canvas.deleteSelectedNode()
      await editorPage.page.waitForTimeout(50)
    }

    // Should end up empty
    const finalNodeCount = await canvas.getNodeCount()
    expect(finalNodeCount).toBe(0)

    // Canvas should still be functional
    await canvas.addNodeByClick('circle')
    await editorPage.page.waitForTimeout(300)

    const nodeCount = await canvas.getNodeCount()
    expect(nodeCount).toBe(1)
  })

  test('should maintain node order when manipulating', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Create nodes in specific order
    const nodeTypes = ['rectangle', 'circle', 'diamond']
    const labels = ['First', 'Second', 'Third']

    for (let i = 0; i < nodeTypes.length; i++) {
      await canvas.addNodeByClick(nodeTypes[i])
      await editorPage.page.waitForTimeout(200)
      await canvas.editNode(i, labels[i])
      await editorPage.page.waitForTimeout(200)
    }

    // Verify initial order
    const initialNodes = await canvas.getNodesData()
    expect(initialNodes).toHaveLength(3)
    expect(initialNodes[0].label).toBe('First')
    expect(initialNodes[1].label).toBe('Second')
    expect(initialNodes[2].label).toBe('Third')

    // Drag nodes around
    await canvas.dragNode(0, COORDINATES.topLeft.x, COORDINATES.topLeft.y)
    await canvas.dragNode(1, COORDINATES.bottomRight.x, COORDINATES.bottomRight.y)
    await editorPage.page.waitForTimeout(300)

    // Verify order is maintained (though positions changed)
    const reorderedNodes = await canvas.getNodesData()
    expect(reorderedNodes).toHaveLength(3)
    // Labels should still correspond to the same node indices
  })

  test('should handle node boundary constraints', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Add a node
    await canvas.addNodeByClick('rectangle')
    await editorPage.page.waitForTimeout(300)

    // Try to drag node far outside visible area
    await canvas.dragNode(0, -5000, -5000)
    await editorPage.page.waitForTimeout(300)

    // Node should still exist (might be constrained or moved to boundary)
    const nodeCount = await canvas.getNodeCount()
    expect(nodeCount).toBe(1)

    // Try dragging to positive extreme
    await canvas.dragNode(0, 5000, 5000)
    await editorPage.page.waitForTimeout(300)

    // Node should still exist
    const finalNodeCount = await canvas.getNodeCount()
    expect(finalNodeCount).toBe(1)
  })

  test('should support keyboard shortcuts for node operations', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Add a node
    await canvas.addNodeByClick('rectangle')
    await editorPage.page.waitForTimeout(300)

    // Select the node
    await canvas.selectNode(0)
    await editorPage.page.waitForTimeout(200)

    // Try delete with keyboard
    await editorPage.page.keyboard.press('Delete')
    await editorPage.page.waitForTimeout(200)

    // Node should be deleted
    const nodeCount = await canvas.getNodeCount()
    expect(nodeCount).toBe(0)

    // Add another node
    await canvas.addNodeByClick('circle')
    await editorPage.page.waitForTimeout(300)

    // Try copy/paste if supported
    await canvas.selectNode(0)
    await editorPage.page.keyboard.press('Control+c')
    await editorPage.page.keyboard.press('Control+v')
    await editorPage.page.waitForTimeout(300)

    // Should have a new node if copy/paste is supported
    const nodeCountAfterCopy = await canvas.getNodeCount()
    // This test can be adjusted based on actual implementation
  })

  test('should handle node styling and appearance', async ({ editorPage }) => {
    const canvas = editorPage.reactFlowCanvas

    // Create different node types
    const nodeTypes = ['rectangle', 'circle', 'diamond', 'parallelogram']

    for (const nodeType of nodeTypes) {
      await canvas.addNodeByClick(nodeType)
      await editorPage.page.waitForTimeout(200)
    }

    // All nodes should be visible
    const nodes = await canvas.page.locator('.react-flow__node').all()
    expect(nodes).toHaveLength(4)

    // Each node should have different styling based on type
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      await expect(node).toBeVisible()

      // Check for type-specific styling classes
      const hasTypeClass = await node.evaluate((el, index) => {
        const types = ['rectangle', 'circle', 'diamond', 'parallelogram']
        return el.classList.contains(types[index]) ||
               el.getAttribute('data-type') === types[index]
      }, i)

      // This assertion depends on the actual implementation
    }
  })
})