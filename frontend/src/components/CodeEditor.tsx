import { useState, useEffect } from 'react'

const defaultMermaidCode = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`

export function CodeEditor() {
  const [code, setCode] = useState(defaultMermaidCode)

  useEffect(() => {
    // Load diagram from URL or API if editing existing diagram
    // For now, using default code
  }, [])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-medium">Mermaid Code</h3>
        <p className="text-sm text-muted-foreground">Write your diagram in Mermaid syntax</p>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full p-4 font-mono text-sm bg-muted border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter Mermaid diagram code here..."
          spellCheck={false}
        />
      </div>
    </div>
  )
}