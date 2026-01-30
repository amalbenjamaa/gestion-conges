import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children, userEmail, userRole, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} />
      <div className="flex-1 ml-64 bg-gray-50">
        <Header userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />
        <main className="p-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;