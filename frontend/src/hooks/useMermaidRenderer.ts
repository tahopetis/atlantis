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
        curve: 'basis'
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

      // Clear previous content
      containerRef.current.innerHTML = ''

      // Generate unique ID for this render
      const renderId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      renderIdRef.current = renderId

      // Validate and render the diagram
      const { svg } = await mermaid.render(renderId, mermaidCode, containerRef.current)

      // Check if this is still the latest render
      if (renderIdRef.current === renderId) {
        containerRef.current.innerHTML = svg
        setValid(true)
      }
    } catch (err) {
      console.error('Mermaid rendering error:', err)
      const mermaidError = parseMermaidError(err)
      setError(mermaidError)
      setValid(false)

      // Clear the container on error
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
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
      // Clear the container if code is empty
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
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