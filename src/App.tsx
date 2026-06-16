import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './routes/Home'
import EditorRoute from './routes/Editor'
import { useApplyTheme } from './store/useThemeStore'

function Shell() {
  useApplyTheme()
  return (
    <div className="absolute inset-0">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<EditorRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
