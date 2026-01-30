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
import Solde from './pages/Solde';
import AjouterUtilisateur from './pages/AjouterUtilisateur';

function App() {
  const [userEmail, setUserEmail] = useState(sessionStorage.getItem('userEmail') || null);
  const [userId, setUserId] = useState(parseInt(sessionStorage.getItem('userId')) || 1);
  const [userRole, setUserRole] = useState(parseInt(sessionStorage.getItem('userRole')) || 1);

  const handleLogin = (email, id, role) => {
    setUserEmail(email);
    setUserId(id);
    setUserRole(role);
    sessionStorage.setItem('userEmail', email);
    sessionStorage.setItem('userId', id);
    sessionStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setUserEmail(null);
    setUserId(1);
    setUserRole(1);
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userRole');
  };

  const isManager = userRole === 2;

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            userEmail ? (
              <Navigate to={isManager ? "/dashboard" : "/mes-demandes"} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        
        {/* Routes MANAGER uniquement */}
        {isManager && (
          <>
            <Route
              path="/dashboard"
              element={<Dashboard userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />}
            />
            <Route
              path="/statistiques"
              element={<Statistiques userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />}
            />
            <Route
              path="/validation"
              element={<Validation userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />}
            />
            <Route
              path="/ajouter-utilisateur"
              element={<AjouterUtilisateur userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />}
            />
          </>
        )}
        
        {/* Routes COMMUNES */}
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
        
        {/* Routes EMPLOYÉ uniquement */}
        <Route
          path="/mes-demandes"
          element={
            userEmail ? (
              <MesDemandes userEmail={userEmail} userId={userId} userRole={userRole} onLogout={handleLogout} />
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
          path="/solde"
          element={
            userEmail ? (
              <Solde userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Redirection par défaut */}
        <Route 
          path="/" 
          element={
            userEmail ? (
              <Navigate to={isManager ? "/dashboard" : "/mes-demandes"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;