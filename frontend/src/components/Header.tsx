import { GitBranch, Save, Download, Settings } from 'lucide-react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

export function Header() {
  const handleSave = () => {
    // Placeholder save functionality
    alert('Save functionality would be implemented here')
  }

  const handleExport = () => {
    // Placeholder export functionality
    alert('Export functionality would be implemented here')
  }

  const handleSettings = () => {
    // Placeholder settings functionality
    alert('Settings functionality would be implemented here')
  }

  const handleBranchSwitch = () => {
    // Placeholder branch switching functionality
    alert('Branch switching functionality would be implemented here')
  }

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center px-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              A
            </div>
            <span data-testid="app-title" className="font-semibold">Atlantis</span>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-4 h-6" />

        <div className="flex-1" />

        <div className="flex items-center space-x-2">
          <Button
            data-testid="main-button"
            variant="ghost"
            size="sm"
            aria-label="Switch to main branch"
            onClick={handleBranchSwitch}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            main
          </Button>

          <Button
            data-testid="save-button"
            variant="ghost"
            size="sm"
            aria-label="Save current diagram"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          <Button
            data-testid="export-button"
            variant="ghost"
            size="sm"
            aria-label="Export diagram"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Separator orientation="vertical" className="mx-2 h-6" />

          <Button
            data-testid="settings-button"
            variant="ghost"
            size="icon"
            aria-label="Open settings"
            onClick={handleSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}