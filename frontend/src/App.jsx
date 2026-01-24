import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './pages/Dashboard';
import Statistiques from './pages/Statistiques';
import NouvelleDemande from './pages/NouvelleDemande';
import MesDemandes from './pages/MesDemandes';
import Validation from './pages/Validation';
import Calendrier from './pages/Calendrier';
import EmployeDetails from './pages/EmployeDetails';
import GestionProfils from './pages/GestionProfils';
import Profil from './pages/Profil';
import AjouterUtilisateur from './pages/AjouterUtilisateur';

function App() {
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);
  const [userId, setUserId] = useState(localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);

  const handleLogin = (email, id, role) => {
    setUserEmail(email);
    setUserId(id);
    setUserRole(role || null);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', id);
    if (role) localStorage.setItem('userRole', role);
  };

  async function handleLogout() {
    try {
      await fetch('http://localhost:8000/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // on ignore les erreurs réseau à la déconnexion
    } finally {
    setUserEmail(null);
      setUserId(null);
      setUserRole(null);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    }
  }

  const canAccessValidation = userRole === 'manager';

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
              userRole === 'manager'
                ? (
                  <Dashboard
                    userEmail={userEmail}
                    userRole={userRole}
                    onLogout={handleLogout}
                  />
                )
                : (
                  <MesDemandes
                    userEmail={userEmail}
                    userRole={userRole}
                    userId={userId}
                    onLogout={handleLogout}
                  />
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
          path="/employes/:id"
          element={
            userEmail && userRole === 'manager' ? (
              <EmployeDetails userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/nouvelle-demande"
          element={
            userEmail ? (
              <NouvelleDemande
                userEmail={userEmail}
                userRole={userRole}
                userId={userId}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/mes-demandes"
          element={
            userEmail ? (
              <MesDemandes
                userEmail={userEmail}
                userRole={userRole}
                userId={userId}
                onLogout={handleLogout}
              />
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
          path="/validation"
          element={
            userEmail ? (
              canAccessValidation ? (
                <Validation
                  userEmail={userEmail}
                  userRole={userRole}
                  onLogout={handleLogout}
                />
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
              <Calendrier
                userEmail={userEmail}
                userRole={userRole}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/gestion-profils"
          element={
            userEmail && userRole === 'manager' ? (
              <GestionProfils
                userEmail={userEmail}
                userRole={userRole}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/ajouter-utilisateur"
          element={
            userEmail && userRole === 'manager' ? (
              <AjouterUtilisateur
                userEmail={userEmail}
                userRole={userRole}
                onLogout={handleLogout}
              />
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