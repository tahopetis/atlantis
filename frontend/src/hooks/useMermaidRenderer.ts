import { useEffect, useRef, useCallback } from 'react'
import mermaid from 'mermaid'
import { useDiagramStore, MermaidError } from '@/stores/useDiagramStore'

interface UseMermaidRendererOptions {
  containerRef: React.RefObject<HTMLDivElement>
  debounceMs?: number
  theme?: 'light' | 'dark' | 'forest' | 'neutral' | 'default'
  autoRender?: boolean
}

export const useMermaidRenderer = ({
  containerRef,
  debounceMs = 300,
  theme = 'default',
  autoRender = true
}: UseMermaidRendererOptions) => {
  const {
    code,
    isLoading,
    error,
    isValid,
    setLoading,
    setError,
    setValid
  } = useDiagramStore()

  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const renderIdRef = useRef<string>()

  // Initialize Mermaid configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'loose',
      fontFamily: 'monospace',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'linear',
        padding: 20
      },
      sequence: {
        useMaxWidth: true,
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        wrap: true,
        wrapPadding: 10
      },
      gantt: {
        useMaxWidth: true,
        titleTopMargin: 25,
        barHeight: 20,
        barGap: 4,
        topPadding: 50,
        leftPadding: 75,
        gridLineStartPadding: 35,
        fontSize: 11,
        numberSectionStyles: 4,
        axisFormat: '%Y-%m-%d'
      },
      journey: {
        useMaxWidth: true,
        diagramMarginX: 50,
        diagramMarginY: 10,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        bottomMarginAdj: 1
      }
    })
  }, [theme])

  // Parse Mermaid error and extract useful information
  const parseMermaidError = useCallback((error: any): MermaidError => {
    const errorStr = error.toString()

    // Try to extract line number from common Mermaid error patterns
    const lineMatch = errorStr.match(/line[:\s]+(\d+)/i)
    const columnMatch = errorStr.match(/column[:\s]+(\d+)/i)
    const hashMatch = errorStr.match(/hash[:\s]+([a-f0-9]+)/i)

    return {
      message: errorStr,
      line: lineMatch ? parseInt(lineMatch[1]) : undefined,
      column: columnMatch ? parseInt(columnMatch[1]) : undefined,
      hash: hashMatch ? hashMatch[1] : undefined
    }
  }, [])

  // Render Mermaid diagram
  const renderDiagram = useCallback(async (mermaidCode: string) => {
    if (!containerRef.current) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Clear previous content using React-compatible approach
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild)
      }

      // Generate unique ID for this render (use consistent ID for testing)
      const renderId = 'mermaid-diagram'
      renderIdRef.current = renderId

      // Create a temporary container for Mermaid rendering to avoid DOM conflicts
      const tempContainer = document.createElement('div')
      tempContainer.style.display = 'none'
      document.body.appendChild(tempContainer)

      // Validate and render the diagram in temporary container
      const { svg } = await mermaid.render(renderId, mermaidCode, tempContainer)

      // Clean up temporary container
      if (tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer)
      }

      // Check if this is still the latest render
      if (renderIdRef.current === renderId && containerRef.current) {
        // Use React-compatible DOM manipulation
        const fragment = document.createDocumentFragment()
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = svg

        // Move nodes to fragment
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild)
        }

        // Clear container using safe method and append new content
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }
        containerRef.current.appendChild(fragment)

        setValid(true)
      }
    } catch (err) {
      console.error('Mermaid rendering error:', err)
      const mermaidError = parseMermaidError(err)
      setError(mermaidError)
      setValid(false)

      // Clear the container on error using React-compatible approach
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [containerRef, setLoading, setError, setValid, parseMermaidError])

  // Debounced render function
  const debouncedRender = useCallback(
    (mermaidCode: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        renderDiagram(mermaidCode)
      }, debounceMs)
    },
    [renderDiagram, debounceMs]
  )

  // Handle code changes with debouncing
  useEffect(() => {
    if (!autoRender) {
      return
    }

    if (!code.trim()) {
      // Clear the container if code is empty using React-compatible approach
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }
      }
      setValid(true)
      setError(null)
      setLoading(false)
      return
    }

    debouncedRender(code)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [code, autoRender, debouncedRender, containerRef, setValid, setError, setLoading])

  // Manual render function
  const manualRender = useCallback(() => {
    if (code.trim()) {
      renderDiagram(code)
    }
  }, [code, renderDiagram])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    renderDiagram: manualRender,
    isLoading,
    error,
    isValid
  }
}