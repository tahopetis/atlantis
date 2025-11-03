import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, AlertCircle, Play, Copy, Download } from 'lucide-react'
import { useDiagramStore } from '@/stores/useDiagramStore'

const defaultMermaidCode = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`

const exampleDiagrams = [
  {
    name: 'Flowchart',
    code: `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`
  },
  {
    name: 'Sequence Diagram',
    code: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`
  },
  {
    name: 'Class Diagram',
    code: `classDiagram
    class Animal {
        +String name
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`
  },
  {
    name: 'Gantt Chart',
    code: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`
  },
  {
    name: 'State Diagram',
    code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
  },
  {
    name: 'Pie Chart',
    code: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`
  },
  {
    name: 'Journey Diagram',
    code: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`
  }
]

export function CodeEditor() {
  const {
    code,
    setCode,
    isValid,
    isLoading
  } = useDiagramStore()

  const [showExamples, setShowExamples] = useState(false)

  useEffect(() => {
    // Initialize with default code if store is empty
    if (!code.trim()) {
      setCode(defaultMermaidCode)
    }
  }, [code, setCode])

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
  }, [setCode])

  const handleExampleSelect = useCallback((exampleCode: string) => {
    setCode(exampleCode)
    setShowExamples(false)
  }, [setCode])

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code)
  }, [code])

  const handleDownloadCode = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.mmd'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [code])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Mermaid Code</h3>
            <p className="text-sm text-muted-foreground">Write your diagram in Mermaid syntax</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <div className="flex items-center space-x-1 text-sm">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : isValid ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
              <span className="text-muted-foreground">
                {isLoading ? 'Validating...' : isValid ? 'Valid' : 'Error'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="px-3 py-1.5 text-sm bg-background hover:bg-muted rounded flex items-center space-x-1"
          >
            <Play className="w-4 h-4" />
            <span>Examples</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyCode}
            disabled={!code.trim()}
            className="p-1.5 text-sm bg-background hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy code"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadCode}
            disabled={!code.trim()}
            className="p-1.5 text-sm bg-background hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download code"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Examples dropdown */}
      {showExamples && (
        <div className="border-b bg-background">
          <div className="p-4">
            <h4 className="text-sm font-medium mb-3">Example Diagrams</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exampleDiagrams.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleSelect(example.code)}
                  className="text-left p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  <div className="font-medium text-sm mb-1">{example.name}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {example.code.split('\n')[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Code editor */}
      <div className="flex-1 p-4 relative">
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="w-full h-full p-4 font-mono text-sm bg-muted border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter Mermaid diagram code here..."
          spellCheck={false}
          style={{
            minHeight: '200px',
            lineHeight: '1.5'
          }}
        />

        {/* Line numbers (overlay) */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="font-mono text-xs text-muted-foreground space-y-0" style={{ lineHeight: '1.5' }}>
            {code.split('\n').map((_, index) => (
              <div key={index} className="text-right pr-2">
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Editor overlay for line numbers */}
        <style>{`
          textarea {
            padding-left: 3rem;
          }
        `}</style>
      </div>

      {/* Footer with syntax hint */}
      <div className="p-3 border-t bg-muted/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {code.split('\n').length} lines • {code.length} characters
          </div>
          <div>
            Press Tab for indentation • Ctrl+Enter to validate
          </div>
        </div>
      </div>
    </div>
  )
}