import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { EditorPage } from '@/pages/EditorPage'
import { HomePage } from '@/pages/HomePage'

function App() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="editor/:id?" element={<EditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App