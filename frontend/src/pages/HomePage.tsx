import { Link } from 'react-router-dom'
import { FileText, GitBranch, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HomePage() {
  const handleBrowseExamples = () => {
    // Navigate to editor with a default example
    window.location.href = '/editor'
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Atlantis</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive browser-based diagramming and documentation tool with Git integration.
            Create beautiful diagrams, version control your work, and collaborate with your team.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/editor">
            <Button size="lg" className="w-full sm:w-auto">
              <Zap className="h-4 w-4 mr-2" />
              Create New Diagram
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleBrowseExamples}
            data-testid="browse-examples-button"
          >
            <FileText className="h-4 w-4 mr-2" />
            Browse Examples
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="space-y-4 p-6 rounded-lg border">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Mermaid Integration</h3>
            <p className="text-sm text-muted-foreground">
              Use familiar Mermaid syntax to create beautiful diagrams with auto-layout and syntax validation.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-lg border">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Git Version Control</h3>
            <p className="text-sm text-muted-foreground">
              Store your diagrams in Git repositories with full version history, branching, and collaboration support.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-lg border">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Real-time Collaboration</h3>
            <p className="text-sm text-muted-foreground">
              Work together with your team in real-time with live editing and conflict-free synchronization.
            </p>
          </div>
        </div>

        <div className="mt-16 p-8 rounded-lg bg-muted/50">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-3">
              <h4 className="font-medium">1. Create a Diagram</h4>
              <p className="text-sm text-muted-foreground">
                Start with a blank canvas or choose from templates to create your first diagram using Mermaid syntax.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">2. Connect Git Repository</h4>
              <p className="text-sm text-muted-foreground">
                Link your diagrams to a Git repository to enable version control and collaboration features.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">3. Export & Share</h4>
              <p className="text-sm text-muted-foreground">
                Export your diagrams as PNG, SVG, or Markdown and share them with your team.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">4. Collaborate</h4>
              <p className="text-sm text-muted-foreground">
                Invite team members to edit diagrams together in real-time with live updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}