import { GitBranch, Save, Download, Settings } from 'lucide-react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

export function Header() {
  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center px-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              A
            </div>
            <span className="font-semibold">Atlantis</span>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-4 h-6" />

        <div className="flex-1" />

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <GitBranch className="h-4 w-4 mr-2" />
            main
          </Button>

          <Button variant="ghost" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Separator orientation="vertical" className="mx-2 h-6" />

          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}