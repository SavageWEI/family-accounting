import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './stores/app'
import AuthProvider from './components/AuthProvider'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Stats from './pages/Stats'
import Family from './pages/Family'
import Profile from './pages/Profile'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useAppStore((s) => s.session)
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/family" element={<Family />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
