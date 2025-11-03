import { useRef, useState, useCallback } from 'react'
import { AlertCircle, Loader2, ZoomIn, ZoomOut, Maximize2, RotateCcw, Code, Eye } from 'lucide-react'
import { useMermaidRenderer } from '@/hooks/useMermaidRenderer'
import { useDiagramStore } from '@/stores/useDiagramStore'
import { ReactFlowCanvas } from './ReactFlowCanvas'

export function DiagramCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showZoomControls, setShowZoomControls] = useState(false)

  const {
    zoom,
    autoFit,
    setZoom,
    resetZoom,
    fitToScreen,
    code,
    error,
    isValid,
    isLoading,
    mode,
    setMode,
    parseMermaidToFlow
  } = useDiagramStore()

  const { renderDiagram } = useMermaidRenderer({
    containerRef,
    debounceMs: 300,
    theme: 'default',
    autoRender: true
  })

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom + 0.1, 3))
  }, [zoom, setZoom])

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom - 0.1, 0.1))
  }, [zoom, setZoom])

  const handleFitToScreen = useCallback(() => {
    fitToScreen()
  }, [fitToScreen])

  const handleResetZoom = useCallback(() => {
    resetZoom()
  }, [resetZoom])

  const handleManualRender = useCallback(() => {
    renderDiagram()
  }, [renderDiagram])

  const handleModeSwitch = useCallback((newMode: 'code' | 'visual') => {
    if (newMode === 'visual' && mode === 'code') {
      // Parse existing Mermaid code when switching to visual mode
      parseMermaidToFlow()
    }
    setMode(newMode)
  }, [mode, setMode, parseMermaidToFlow])

  // Render visual mode (React Flow)
  if (mode === 'visual') {
    return <ReactFlowCanvas />
  }

  // Render code mode (Mermaid) - at this point, mode is guaranteed to be 'code'
  const isCodeMode = true

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="font-medium">Diagram Preview</h3>
            {/* Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => handleModeSwitch('code')}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-1 transition-colors ${
                  isCodeMode ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>Code</span>
              </button>
              <button
                onClick={() => handleModeSwitch('visual')}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-1 transition-colors ${
                  !isCodeMode ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Visual</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Rendering...' : isValid ? 'Visual representation of your Mermaid diagram' : 'Syntax error in diagram'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.1}
              className="p-1.5 text-sm bg-muted hover:bg-muted/80 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-mono px-2 py-1 bg-muted/50 rounded min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-1.5 text-sm bg-muted hover:bg-muted/80 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleFitToScreen}
            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded flex items-center space-x-1"
            title="Fit to screen"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Fit to Screen</span>
          </button>
          <button
            onClick={handleResetZoom}
            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded flex items-center space-x-1"
            title="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-destructive">Syntax Error</h4>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              {(error.line || error.column) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {error.line && `Line: ${error.line}`}
                  {error.line && error.column && ' • '}
                  {error.column && `Column: ${error.column}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diagram container */}
      <div
        className="flex-1 p-4 bg-muted/30 relative overflow-hidden"
        onMouseEnter={() => setShowZoomControls(true)}
        onMouseLeave={() => setShowZoomControls(false)}
      >
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Rendering diagram...</span>
            </div>
          </div>
        )}

        {/* Mermaid diagram container */}
        <div
          ref={containerRef}
          className={`w-full h-full flex items-center justify-center transition-transform duration-200 ${
            autoFit ? 'transform-none' : ''
          }`}
          style={{
            transform: autoFit ? 'none' : `scale(${zoom})`,
            transformOrigin: 'center'
          }}
        >
          {/* Empty state when no code */}
          {!code.trim() && !error && (
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Start Creating</h4>
                <p className="text-sm text-muted-foreground">
                  Write Mermaid diagram code in the editor to see it rendered here
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Try one of these examples:</p>
                <code className="block p-2 bg-muted rounded text-left whitespace-pre">
                  {`graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[End]
    B -->|No| D[Debug]`}
                </code>
              </div>
            </div>
          )}

          {/* Error fallback display */}
          {error && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h4 className="font-medium text-destructive">Rendering Failed</h4>
                <p className="text-sm text-muted-foreground">
                  Please check your Mermaid syntax and try again
                </p>
              </div>
              <button
                onClick={handleManualRender}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Floating zoom controls on hover */}
        {showZoomControls && !error && code.trim() && (
          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-1 shadow-lg">
            <div className="flex items-center space-x-1">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.1}
                className="p-1.5 text-sm hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono px-2 py-1 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-1.5 text-sm hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-border mx-1" />
              <button
                onClick={handleFitToScreen}
                className="p-1.5 text-sm hover:bg-muted rounded"
                title="Fit to screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}