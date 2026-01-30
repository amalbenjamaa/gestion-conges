import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

function Calendrier({ userEmail, userRole, onLogout }) {
  const [demandes, setDemandes] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/demandes?statut=validee')
      .then(res => res.json())
      .then(data => {
        setDemandes(data.demandes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isDateInDemande = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return demandes.some(d => 
      dateStr >= d.date_debut && dateStr <= d.date_fin
    );
  };

  const getDemandeForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return demandes.find(d => 
      dateStr >= d.date_debut && dateStr <= d.date_fin
    );
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Calendrier des Congés</h2>
        <p className="text-gray-600 text-sm">Vue d'ensemble des congés validés</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* En-tête du calendrier */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={previousMonth}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Précédent
            </button>
            <h3 className="text-xl font-bold text-gray-800">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={nextMonth}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Suivant →
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Jours du mois */}
          <div className="grid grid-cols-7 gap-2">
            {/* Jours vides avant le début du mois */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))}

            {/* Jours du mois */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const hasEvent = isDateInDemande(day);
              const demande = getDemandeForDate(day);
              const isToday = 
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-2 flex flex-col items-center justify-center transition-all ${
                    isToday ? 'border-blue-600 border-2' : 'border-gray-200'
                  } ${hasEvent ? 'bg-green-100 hover:bg-green-200' : 'hover:bg-gray-50'}`}
                  title={hasEvent ? `${demande.nom_complet} - ${demande.type}` : ''}
                >
                  <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {hasEvent && (
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-1"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="mt-6 flex gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 rounded"></div>
              <span className="text-sm text-gray-600">Aujourd'hui</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span className="text-sm text-gray-600">Congé validé</span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Calendrier;