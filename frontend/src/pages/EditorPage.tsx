import { Resizable } from '@/components/ui/resizable'
import { CodeEditor } from '@/components/CodeEditor'
import { DiagramCanvas } from '@/components/DiagramCanvas'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function EditorPage() {

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <ErrorBoundary>
          <Resizable defaultSizes={[50, 50]}>
            <div className="h-full border-r">
              <ErrorBoundary fallback={
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-destructive">Code Editor Error</p>
                    <p className="text-xs text-muted-foreground">The code editor encountered an error</p>
                  </div>
                </div>
              }>
                <CodeEditor />
              </ErrorBoundary>
            </div>
            <div className="h-full">
              <ErrorBoundary fallback={
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-destructive">Diagram Renderer Error</p>
                    <p className="text-xs text-muted-foreground">The diagram renderer encountered an error</p>
                  </div>
                </div>
              }>
                <DiagramCanvas />
              </ErrorBoundary>
            </div>
          </Resizable>
        </ErrorBoundary>
      </div>
    </div>
  )
}