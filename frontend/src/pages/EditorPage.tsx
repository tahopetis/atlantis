import { Resizable } from '@/components/ui/resizable'
import { CodeEditor } from '@/components/CodeEditor'
import { DiagramCanvas } from '@/components/DiagramCanvas'

export function EditorPage() {

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <Resizable defaultSizes={[50, 50]}>
          <div className="h-full border-r">
            <CodeEditor />
          </div>
          <div className="h-full">
            <DiagramCanvas />
          </div>
        </Resizable>
      </div>
    </div>
  )
}