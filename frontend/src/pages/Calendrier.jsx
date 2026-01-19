import Layout from '../components/Layout';

function Calendrier({ userEmail, userRole }) {
  return (
    <Layout userEmail={userEmail} userRole={userRole}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Calendrier d'Équipe</h2>
        <p className="text-gray-600 text-sm">Visualisez les absences et congés de tous les collaborateurs</p>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="text-center py-12">
          <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Calendrier à implémenter</h3>
          <p className="text-gray-500 mb-4">Cette fonctionnalité affichera les absences et congés de tous les collaborateurs sur un calendrier mensuel.</p>
          <p className="text-sm text-gray-400">Bibliothèque suggérée : react-big-calendar ou react-calendar</p>
        </div>
      </div>
    </Layout>
  );
}

export default Calendrier;


