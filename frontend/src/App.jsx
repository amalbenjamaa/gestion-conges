import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './pages/Dashboard';
import Statistiques from './pages/Statistiques';
import NouvelleDemande from './pages/NouvelleDemande';
import MesDemandes from './pages/MesDemandes';
import Validation from './pages/Validation';
import Calendrier from './pages/Calendrier';
import Profil from './pages/Profil';
import EmployeDetails from './pages/EmployeDetails';
import GestionProfils from './pages/GestionProfils';
import AjouterUtilisateur from './pages/AjouterUtilisateur';
import OnlineStatus from './components/OnlineStatus';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

function App() {
  const [userEmail, setUserEmail] = useState(sessionStorage.getItem('userEmail') || null);
  const [userId, setUserId] = useState(sessionStorage.getItem('userId') ? parseInt(sessionStorage.getItem('userId')) : null);
  const [userRole, setUserRole] = useState(() => {
    const r = sessionStorage.getItem('userRole');
    return r ? r.toLowerCase() : null;
  });

  const handleLogin = (email, id) => {
    setUserEmail(email);
    setUserId(id);
    setUserRole(null);
    sessionStorage.setItem('userEmail', email);
    sessionStorage.setItem('userId', id);
    sessionStorage.removeItem('userRole');
  };

  useEffect(() => {
    if (!userEmail) return;
    fetch('http://localhost:8000/api/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        const byRole = typeof data.role === 'string' && data.role.toLowerCase() === 'manager';
        const marker = String(data.avatar_url ?? '') === '2';
        const effective = (byRole || marker) ? 'manager' : 'employe';
        setUserRole(effective);
        sessionStorage.setItem('userRole', effective);
        if (typeof data.id === 'number') {
          setUserId(data.id);
          sessionStorage.setItem('userId', String(data.id));
        }
        if (typeof data.email === 'string') {
          setUserEmail(data.email);
          sessionStorage.setItem('userEmail', data.email);
        }
      })
      .catch(() => {});
  }, [userEmail]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      void 0;
    } finally {
      setUserEmail(null);
      setUserId(null);
      setUserRole(null);
      sessionStorage.clear();
    }
  };

  return (
    <Router>
      <OnlineStatus />
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      
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
              userRole === 'manager'
                ? (
                  <Dashboard userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
                )
                : (
                  <MesDemandes userEmail={userEmail} userRole={userRole} userId={userId} onLogout={handleLogout} />
                )
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
              userRole !== 'manager' ? (
                <NouvelleDemande userEmail={userEmail} userRole={userRole} userId={userId} onLogout={handleLogout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/mes-demandes"
          element={
            userEmail ? (
              userRole !== 'manager' ? (
                <MesDemandes userEmail={userEmail} userRole={userRole} userId={userId} onLogout={handleLogout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/validation"
          element={
            userEmail ? (
              userRole === 'manager' ? (
                <Validation userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
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
              <Calendrier userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profil"
          element={
            userEmail ? (
              <Profil userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/employes/:id"
          element={
            userEmail && userRole === 'manager' ? (
              <EmployeDetails userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/gestion-profils"
          element={
            userEmail && userRole === 'manager' ? (
              <GestionProfils userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/ajouter-utilisateur"
          element={
            userEmail && userRole === 'manager' ? (
              <AjouterUtilisateur userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
