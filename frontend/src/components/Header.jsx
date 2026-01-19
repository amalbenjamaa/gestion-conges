function Header({ userEmail, onLogout }) {
  // Extraire le nom depuis l'email (ex: "thomas.leroy@example.com" -> "Thomas Leroy")
  const getUserName = () => {
    if (!userEmail) return 'Utilisateur';
    const name = userEmail.split('@')[0];
    return name.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || userEmail;
  };

  const userName = getUserName();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white bg-slate-800 px-4 py-2 rounded">DYNAMIX SERVICES</h1>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Espace Manager</h2>
          <p className="text-xs text-gray-500">Vue d'overview et suivi des congés par employé</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="font-semibold text-sm text-gray-800">{userName}</p>
              <p className="text-xs text-gray-500">Manager</p>
            </div>
            <button 
              onClick={onLogout} 
              className="text-gray-400 hover:text-gray-600 ml-2 text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
