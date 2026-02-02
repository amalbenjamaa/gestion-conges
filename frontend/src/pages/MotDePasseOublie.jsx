import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MotDePasseOublie() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Phone+Code, 3: New Password
  const [formData, setFormData] = useState({
    email: '',
    telephone: '',
    code: '',
    nouveau_password: '',
    confirm_password: ''
  });
  const [phoneHint, setPhoneHint] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Étape 1 : Demander le code de réinitialisation
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPhoneHint(data.phone_hint || '****');
        setStep(2);
        setSuccess('Un code à 6 chiffres a été généré. Entrez votre numéro de téléphone et le code.');
      } else {
        setError(data.error || 'Email non trouvé');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérifier le téléphone et le code
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/password-reset/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          phone: formData.telephone,
          code: formData.code
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResetToken(data.reset_token);
        setStep(3);
        setSuccess('Téléphone et code vérifiés ! Entrez votre nouveau mot de passe.');
      } else {
        setError(data.error || 'Numéro de téléphone ou code incorrect');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Étape 3 : Réinitialiser le mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.nouveau_password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.nouveau_password !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/password-reset/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reset_token: resetToken,
          new_password: formData.nouveau_password
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Mot de passe réinitialisé avec succès ! Redirection...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
          <p className="text-gray-600">Réinitialisez votre mot de passe en 3 étapes</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-bold`}>1</div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-bold`}>2</div>
          <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-bold`}>3</div>
        </div>

        {/* Formulaire */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Étape 1 : Email */}
          {step === 1 && (
            <form onSubmit={handleRequestCode}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre.email@exemple.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Un code de vérification sera généré pour votre numéro de téléphone
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Génération...' : 'Envoyer le code'}
              </button>
            </form>
          )}

          {/* Étape 2 : Téléphone + Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyPhone}>
              {phoneHint && (
                <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Code généré !</span> Votre numéro se termine par : <span className="font-mono font-bold">{phoneHint}</span>
                  </p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+33 6 12 34 56 78 ou 0612345678"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Entrez le numéro associé à votre compte</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code de vérification (6 chiffres)
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg tracking-wider text-center"
                  placeholder="123456"
                  maxLength="6"
                  pattern="\d{6}"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Le code expire dans 15 minutes</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Vérification...' : 'Vérifier'}
              </button>
            </form>
          )}

          {/* Étape 3 : Nouveau mot de passe */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="nouveau_password"
                  value={formData.nouveau_password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 6 caractères"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Retapez le mot de passe"
                  required
                />
                {formData.nouveau_password && formData.confirm_password && formData.nouveau_password !== formData.confirm_password && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
                {formData.nouveau_password && formData.confirm_password && formData.nouveau_password === formData.confirm_password && (
                  <p className="text-xs text-green-500 mt-1">✓ Les mots de passe correspondent</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || formData.nouveau_password !== formData.confirm_password}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MotDePasseOublie;