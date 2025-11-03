import { FileText, Folder, Plus, GitBranch } from 'lucide-react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

export function Sidebar() {
  const handleNewDiagram = () => {
    // Navigate to editor with a new diagram
    window.location.href = '/editor'
  }

  const handleDiagramClick = (diagramName: string) => {
    // Placeholder for opening specific diagrams
    alert(`Opening diagram: ${diagramName}`)
  }

  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4">
        <Button
          className="w-full justify-start"
          variant="default"
          onClick={handleNewDiagram}
          data-testid="new-diagram-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Diagram
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <Folder className="h-4 w-4" />
              <span>Diagrams</span>
            </div>

            <div className="space-y-1 pl-6">
              <div
                className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                onClick={() => handleDiagramClick('System Architecture')}
                data-testid="diagram-system-architecture"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm">System Architecture</span>
              </div>
              <div
                className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                onClick={() => handleDiagramClick('Database Schema')}
                data-testid="diagram-database-schema"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm">Database Schema</span>
              </div>
              <div
                className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                onClick={() => handleDiagramClick('API Flow')}
                data-testid="diagram-api-flow"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm">API Flow</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              <span>Git Repository</span>
            </div>

            <div className="space-y-1 pl-6">
              <div className="text-sm text-muted-foreground p-2">
                <div className="font-medium">atlantis-diagrams</div>
                <div className="text-xs">Branch: main</div>
                <div className="text-xs">Last commit: 2 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}