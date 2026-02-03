import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Layout from '../components/Layout';

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
            {Array.from({ length: m.clone().startOf('month').day() || 0 }).map((_, i) => (
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
  const [view, setView] = useState('month'); // 'month' | 'week' | 'day' | 'year'

  const loadEvents = (startDate, endDate) => {
    setLoading(true);
    const start = moment(startDate).format('YYYY-MM-DD');
    const end = moment(endDate).format('YYYY-MM-DD');

    fetch(`http://localhost:8000/api/calendar?start=${start}&end=${end}`, {
      credentials: 'include'
    })
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

  const getRangeForView = (date, v) => {
    const m = moment(date);
    if (v === 'week') {
      return { start: m.clone().startOf('week').toDate(), end: m.clone().endOf('week').toDate() };
    }
    if (v === 'day') {
      return { start: m.clone().startOf('day').toDate(), end: m.clone().endOf('day').toDate() };
    }
    // default month
    return { start: m.clone().startOf('month').toDate(), end: m.clone().endOf('month').toDate() };
  };

  useEffect(() => {
    const { start, end } = getRangeForView(currentDate, view === 'year' ? 'month' : view);
    setTimeout(() => loadEvents(start, end), 0);

    const handleUpdate = () => {
      const { start: s, end: e } = getRangeForView(currentDate, view === 'year' ? 'month' : view);
      setTimeout(() => loadEvents(s, e), 0);
    };
    window.addEventListener('demandeUpdated', handleUpdate);
    return () => {
      window.removeEventListener('demandeUpdated', handleUpdate);
    };
  }, [currentDate, view]);

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
