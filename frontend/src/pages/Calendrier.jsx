import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Layout from '../components/Layout';

moment.locale('fr');
const localizer = momentLocalizer(moment);

function Calendrier({ userEmail, userRole, onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = () => {
    setLoading(true);
    // Récupérer les événements pour le mois actuel
    const start = moment().startOf('month').format('YYYY-MM-DD');
    const end = moment().endOf('month').format('YYYY-MM-DD');
    
    fetch(`http://localhost:8000/api/calendar?start=${start}&end=${end}`)
      .then(res => res.json())
      .then(data => {
        const formattedEvents = (Array.isArray(data) ? data : []).map(event => ({
          id: event.id,
          title: `${event.title} - ${event.type}`,
          start: new Date(event.start),
          end: new Date(moment(event.end).add(1, 'day').format('YYYY-MM-DD')), // Ajouter 1 jour car end est inclusif
          resource: {
            type: event.type,
            color: event.color || '#3b82f6',
            statut: event.statut
          }
        }));
        setEvents(formattedEvents);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEvents();
    
    // Écouter les mises à jour de demandes
    const handleUpdate = () => loadEvents();
    window.addEventListener('demandeUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('demandeUpdated', handleUpdate);
    };
  }, []);

  const eventStyleGetter = (event) => {
    const color = event.resource?.color || '#3b82f6';
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: 'white',
        borderRadius: '5px',
        border: 'none',
        padding: '2px 5px'
      }
    };
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Calendrier d'Équipe</h2>
        <p className="text-gray-600 text-sm">Visualisez les absences et congés de tous les collaborateurs</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Chargement du calendrier...</div>
        ) : (
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={eventStyleGetter}
              messages={{
                next: 'Suivant',
                previous: 'Précédent',
                today: "Aujourd'hui",
                month: 'Mois',
                week: 'Semaine',
                day: 'Jour',
                agenda: 'Agenda',
                date: 'Date',
                time: 'Heure',
                event: 'Événement',
                noEventsInRange: 'Aucun congé dans cette période'
              }}
              culture="fr"
            />
        </div>
        )}
      </div>
    </Layout>
  );
}

export default Calendrier;
