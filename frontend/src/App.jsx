import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './pages/Dashboard';
import Statistiques from './pages/Statistiques';
import NouvelleDemande from './pages/NouvelleDemande';
import MesDemandes from './pages/MesDemandes';
import Validation from './pages/Validation';
import Calendrier from './pages/Calendrier';
import Profil from './pages/Profil';
import OnlineStatus from './components/OnlineStatus';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

function App() {
  const [userEmail, setUserEmail] = useState(sessionStorage.getItem('userEmail') || null);
  const [userId, setUserId] = useState(parseInt(sessionStorage.getItem('userId')) || 1);

  const handleLogin = (email, id) => {
    setUserEmail(email);
    setUserId(id);
    sessionStorage.setItem('userEmail', email);
    sessionStorage.setItem('userId', id);
  };

  const handleLogout = () => {
    setUserEmail(null);
    setUserId(1);
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userId');
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
              <Dashboard userEmail={userEmail} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/statistiques"
          element={
            userEmail ? (
              <Statistiques userEmail={userEmail} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/nouvelle-demande"
          element={
            userEmail ? (
              <NouvelleDemande userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/mes-demandes"
          element={
            userEmail ? (
              <MesDemandes userEmail={userEmail} userId={userId} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/validation"
          element={
            userEmail ? (
              <Validation userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/calendrier"
          element={
            userEmail ? (
              <Calendrier userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profil"
          element={
            userEmail ? (
              <Profil userEmail={userEmail} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;