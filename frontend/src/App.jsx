import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import UserSurvey from './user/UserSurvey'
import AdminLogin from './admin/AdminLogin'
import AdminPanel from './admin/AdminPanel'

function App() {
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserSurvey />} />
        
        <Route
          path="/admin"
          element={
            adminLoggedIn ? (
              <AdminPanel onLogout={() => setAdminLoggedIn(false)} />
            ) : (
              <AdminLogin onLogin={() => setAdminLoggedIn(true)} />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
