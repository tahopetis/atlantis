import * as React from "react"
import { cn } from "@/lib/utils"

interface ResizableProps {
  children: React.ReactNode[]
  defaultSizes?: number[]
  minSizes?: number[]
  direction?: "horizontal" | "vertical"
  className?: string
}

export function Resizable({
  children,
  defaultSizes = [50, 50],
  minSizes = [20, 20],
  direction = "horizontal",
  className
}: ResizableProps) {
  const [sizes, setSizes] = React.useState(defaultSizes)
  const [isDragging, setIsDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseDown = (index: number) => {
    if (isDragging) return
    setIsDragging(true)
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const containerSize = direction === "horizontal"
        ? containerRect.width
        : containerRect.height

      const mousePos = direction === "horizontal"
        ? e.clientX - containerRect.left
        : e.clientY - containerRect.top

      const newSize = (mousePos / containerSize) * 100
      const clampedSize = Math.max(minSizes[index], Math.min(100 - minSizes[index + 1], newSize))

      setSizes(prev => {
        const newSizes = [...prev]
        newSizes[index] = clampedSize
        newSizes[index + 1] = 100 - clampedSize
        return newSizes
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full",
        direction === "vertical" ? "flex-col" : "flex-row",
        className
      )}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <div
            style={{
              [direction === "horizontal" ? "width" : "height"]: `${sizes[index]}%`,
              display: "flex",
              flexDirection: direction === "horizontal" ? "row" : "column"
            }}
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div
              className={cn(
                "bg-border hover:bg-muted-foreground cursor-col-resize transition-colors",
                direction === "horizontal"
                  ? "w-1 cursor-col-resize"
                  : "h-1 cursor-row-resize"
              )}
              onMouseDown={() => handleMouseDown(index)}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}