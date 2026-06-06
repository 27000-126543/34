import { Routes, Route, Navigate } from 'react-router-dom'
import { useGame } from './contexts/GameContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Restaurant from './pages/Restaurant'
import Chefs from './pages/Chefs'
import Research from './pages/Research'
import Market from './pages/Market'
import Competition from './pages/Competition'
import Alliance from './pages/Alliance'
import Report from './pages/Report'
import Leaderboard from './pages/Leaderboard'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useGame()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/restaurant" element={<PrivateRoute><AppLayout><Restaurant /></AppLayout></PrivateRoute>} />
      <Route path="/chefs" element={<PrivateRoute><AppLayout><Chefs /></AppLayout></PrivateRoute>} />
      <Route path="/research" element={<PrivateRoute><AppLayout><Research /></AppLayout></PrivateRoute>} />
      <Route path="/market" element={<PrivateRoute><AppLayout><Market /></AppLayout></PrivateRoute>} />
      <Route path="/competition" element={<PrivateRoute><AppLayout><Competition /></AppLayout></PrivateRoute>} />
      <Route path="/alliance" element={<PrivateRoute><AppLayout><Alliance /></AppLayout></PrivateRoute>} />
      <Route path="/report" element={<PrivateRoute><AppLayout><Report /></AppLayout></PrivateRoute>} />
      <Route path="/leaderboard" element={<PrivateRoute><AppLayout><Leaderboard /></AppLayout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
