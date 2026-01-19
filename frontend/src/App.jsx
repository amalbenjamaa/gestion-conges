import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './pages/Dashboard';
import Statistiques from './pages/Statistiques';
import NouvelleDemande from './pages/NouvelleDemande';
import MesDemandes from './pages/MesDemandes';
import Validation from './pages/Validation';
import Calendrier from './pages/Calendrier';

function App() {
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);
  const [userId, setUserId] = useState(parseInt(localStorage.getItem('userId')) || 1);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);

  const handleLogin = (email, id, role) => {
    setUserEmail(email);
    setUserId(id);
    setUserRole(role || null);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', id);
    if (role) localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setUserEmail(null);
    setUserId(1);
    setUserRole(null);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
  };

  const canAccessValidation = userRole === 'manager' || userRole === 'admin';

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            userEmail ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            userEmail ? (
              <Dashboard userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/statistiques"
          element={
            userEmail ? (
              <Statistiques userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/nouvelle-demande"
          element={
            userEmail ? (
              <NouvelleDemande userEmail={userEmail} userRole={userRole} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/mes-demandes"
          element={
            userEmail ? (
              <MesDemandes userEmail={userEmail} userRole={userRole} userId={userId} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/validation"
          element={
            userEmail ? (
              canAccessValidation ? (
                <Validation userEmail={userEmail} userRole={userRole} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/calendrier"
          element={
            userEmail ? (
              <Calendrier userEmail={userEmail} userRole={userRole} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
