import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiBase.js';

function MotDePasseOublie() {
  const navigate = useNavigate();
  
  // États
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [phoneHint, setPhoneHint] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // ✅ AJOUT
  const [loading, setLoading] = useState(false);

  // Étape 1 : Vérifier l'email et générer le code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la demande');
        setLoading(false);
        return;
      }

      setPhoneHint(data.phone_hint);
      setGeneratedCode(data.code);
      setStep(2);
    } catch (err) {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérifier le téléphone et le code
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !phone || !code) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, code })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Vérification échouée');
        setLoading(false);
        return;
      }

      setResetToken(data.reset_token);
      setStep(3);
    } catch (err) {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  // Étape 3 : Réinitialiser le mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Réinitialisation échouée');
        setLoading(false);
        return;
      }

      // ✅ MODIFICATION : Afficher la notification au lieu de l'alerte
      setSuccess(true);
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Mot de passe oublié</h1>
          <p className="text-gray-600 text-sm">Étape {step} sur 3</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* ✅ NOTIFICATION DE SUCCÈS */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">✅ Mot de passe réinitialisé avec succès !</p>
                <p className="text-xs mt-1">Redirection vers la page de connexion...</p>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 1 : Demander le code */}
        {step === 1 && !success && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="votre.email@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer le code'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Retour à la connexion
            </button>
          </form>
        )}

        {/* ÉTAPE 2 : Vérifier téléphone et code */}
        {step === 2 && !success && (
          <form onSubmit={handleVerifyPhone} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
              <p className="mb-1"><strong>Email :</strong> {email}</p>
              <p>Un code a été généré pour le numéro : <strong>{phoneHint}</strong></p>
              {generatedCode && (
                <p className="mt-2 font-mono bg-white px-3 py-2 rounded border">
                  Code : <strong>{generatedCode}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
              <input
                type="tel"
                placeholder="0612345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code de vérification</label>
              <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Retour à l'étape 1
            </button>
          </form>
        )}

        {/* ÉTAPE 3 : Nouveau mot de passe */}
        {step === 3 && !success && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-green-800 mb-4">
              ✅ Vérification réussie ! Entrez votre nouveau mot de passe.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                placeholder="Minimum 6 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default MotDePasseOublie;