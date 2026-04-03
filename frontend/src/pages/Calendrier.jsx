import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../apiBase.js';

moment.locale('fr');
const localizer = momentLocalizer(moment);

function YearGrid({ date, events }) {
  const yearStart = moment(date).startOf('year');
  const months = Array.from({ length: 12 }, (_, i) => yearStart.clone().add(i, 'months'));
  const monthEventsCount = (m) => {
    const ms = m.clone().startOf('month').toDate();
    const me = m.clone().endOf('month').toDate();
    return events.filter(ev => ev.start <= me && ev.end >= ms).length;
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {months.map((m, idx) => (
        <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-white/60 backdrop-blur">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold text-gray-800">{m.format('MMMM YYYY')}</div>
            <div className="text-xs text-gray-500">{monthEventsCount(m)} événements</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (<div key={i} className="text-gray-500 text-center py-1">{d}</div>))}
            {Array.from({ length: m.clone().startOf('month').day() === 0 ? 6 : m.clone().startOf('month').day() - 1 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: m.daysInMonth() }, (_, i) => {
              const dayDate = m.clone().date(i + 1);
              const hasEvent = events.some(ev => moment(ev.start).isSameOrBefore(dayDate.endOf('day')) && moment(ev.end).isSameOrAfter(dayDate.startOf('day')));
              return (
                <div key={i} className={`text-center py-1 rounded ${hasEvent ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Calendrier({ userEmail, userRole, onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  const loadEvents = () => {
    setLoading(true);
    console.log('📅 Chargement calendrier...');
    console.log('👤 Role:', userRole);

    // Manager = tous les événements, Employé = seulement les siens
    const apiUrl = userRole === 'manager' 
      ? `${API_BASE_URL}/api/calendar/all`
      : `${API_BASE_URL}/api/calendar`;

    console.log('📡 API appelée:', apiUrl);

    fetch(apiUrl, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log('📅 Données reçues:', data);
        
        const eventsList = data.events || [];
        console.log('📋 Nombre d\'événements:', eventsList.length);
        
        const formattedEvents = eventsList.map(event => ({
          id: event.id,
          title: `${event.nom_complet || 'Congé'} - ${event.type_conge || 'Absence'}`,
          start: new Date(event.date_debut),
          end: new Date(moment(event.date_fin).add(1, 'day').format('YYYY-MM-DD')),
          resource: {
            type: event.type_conge,
            color: event.type_couleur || '#3b82f6',
            motif: event.motif,
            nom: event.nom_complet
          }
        }));
        
        console.log('✅ Événements formatés:', formattedEvents.length);
        setEvents(formattedEvents);
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Erreur calendrier:', err);
        setEvents([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEvents();
    
    const handleUpdate = () => {
      console.log('🔄 Rechargement du calendrier...');
      loadEvents();
    };
    
    window.addEventListener('demandeUpdated', handleUpdate);
    return () => {
      window.removeEventListener('demandeUpdated', handleUpdate);
    };
  }, [userRole]);

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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Calendrier {userRole === 'manager' ? "d'Équipe" : 'Personnel'}
        </h2>
        <p className="text-gray-600 text-sm">
          {userRole === 'manager' 
            ? 'Visualisez les absences et congés de tous les collaborateurs'
            : 'Visualisez vos congés validés'
          }
        </p>
      </div>
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-md border border-white/20">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Chargement du calendrier...</div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                className="px-3 py-1.5 rounded border text-sm hover:bg-gray-100"
                onClick={() => {
                  const d = view === 'year' ? moment(currentDate).add(-1, 'year').toDate() : moment(currentDate).add(-1, view === 'week' ? 'week' : 'month').toDate();
                  setCurrentDate(d);
                }}
              >
                Précédent
              </button>
              <button
                className="px-3 py-1.5 rounded border text-sm hover:bg-gray-100"
                onClick={() => setCurrentDate(new Date())}
              >
                Aujourd'hui
              </button>
              <button
                className="px-3 py-1.5 rounded border text-sm hover:bg-gray-100"
                onClick={() => {
                  const d = view === 'year' ? moment(currentDate).add(1, 'year').toDate() : moment(currentDate).add(1, view === 'week' ? 'week' : 'month').toDate();
                  setCurrentDate(d);
                }}
              >
                Suivant
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button className={`px-3 py-1.5 rounded border text-sm ${view === 'month' ? 'bg-blue-600 text-white' : ''}`} onClick={() => setView('month')}>Mois</button>
                <button className={`px-3 py-1.5 rounded border text-sm ${view === 'week' ? 'bg-blue-600 text-white' : ''}`} onClick={() => setView('week')}>Semaine</button>
                <button className={`px-3 py-1.5 rounded border text-sm ${view === 'day' ? 'bg-blue-600 text-white' : ''}`} onClick={() => setView('day')}>Jour</button>
                <button className={`px-3 py-1.5 rounded border text-sm ${view === 'year' ? 'bg-blue-600 text-white' : ''}`} onClick={() => setView('year')}>Année</button>
              </div>
            </div>
            {view === 'year' ? (
              <YearGrid date={currentDate} events={events} />
            ) : (
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  eventPropGetter={eventStyleGetter}
                  date={currentDate}
                  view={view}
                  onNavigate={(date) => setCurrentDate(date)}
                  onView={(v) => setView(v)}
                  views={['month', 'week', 'day']}
                  messages={{
                    next: 'Suivant',
                    previous: 'Précédent',
                    today: "Aujourd'hui",
                    month: 'Mois',
                    week: 'Semaine',
                    day: 'Jour',
                    date: 'Date',
                    time: 'Heure',
                    event: 'Événement',
                    noEventsInRange: 'Aucun congé dans cette période'
                  }}
                  culture="fr"
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default Calendrier;