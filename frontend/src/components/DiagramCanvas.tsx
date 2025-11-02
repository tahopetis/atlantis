import { useRef } from 'react'

export function DiagramCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-medium">Diagram Preview</h3>
          <p className="text-sm text-muted-foreground">Visual representation of your Mermaid diagram</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded">
            Fit to Screen
          </button>
          <button className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded">
            Reset Zoom
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 p-4 bg-muted/30 flex items-center justify-center"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/30 rounded" />
          </div>
          <div>
            <h4 className="font-medium">Diagram Canvas</h4>
            <p className="text-sm text-muted-foreground">
              Your Mermaid diagram will be rendered here
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            This is a placeholder. The actual Mermaid rendering will be implemented in the next phase.
          </p>
        </div>
      </div>
    </div>
  )
}