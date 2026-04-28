'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function PublicAccessPage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKey = (n: string) => {
    if (code.length < 6) {
      const newCode = [...code, n];
      setCode(newCode);
      if (newCode.length === 6) validateCode(newCode.join(''));
    }
  };

  const handleDelete = () => setCode((prev) => prev.slice(0, -1));

  const validateCode = async (fullCode: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/api/access/${fullCode}`);
      // Stocker les permissions et rediriger
      sessionStorage.setItem('access_code', fullCode);
      sessionStorage.setItem('access_permissions', JSON.stringify(data.data));
      router.push(`/shared/${data.data.project.id}?code=${fullCode}`);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Code invalide ou expiré';
      setError(msg);
      setCode([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-primary-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Lock className="text-white w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Accès Bilnov</h1>
        <p className="text-gray-500 mt-1">Saisissez votre code à 6 chiffres</p>
      </div>

      {/* Affichage du code */}
      <div className="flex gap-3 mb-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-12 h-16 border-2 rounded-xl flex items-center justify-center text-2xl font-bold bg-white shadow-sm transition-colors ${
              i < code.length ? 'border-primary-500' : 'border-gray-200'
            }`}
          >
            {code[i] ? '•' : ''}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 max-w-xs text-center">
          {error}
        </div>
      )}

      {/* Pavé numérique */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleKey(n.toString())}
            disabled={loading}
            className="h-16 rounded-full bg-white shadow hover:bg-gray-50 active:bg-gray-100 font-bold text-xl text-gray-700 transition-colors disabled:opacity-50"
          >
            {n}
          </button>
        ))}
        <button
          onClick={handleDelete}
          disabled={loading || code.length === 0}
          className="h-16 rounded-full bg-white shadow hover:bg-gray-50 font-medium text-sm text-gray-500 transition-colors disabled:opacity-30"
        >
          ⌫
        </button>
        <button
          onClick={() => handleKey('0')}
          disabled={loading}
          className="h-16 rounded-full bg-white shadow hover:bg-gray-50 active:bg-gray-100 font-bold text-xl text-gray-700 transition-colors disabled:opacity-50"
        >
          0
        </button>
        <div />
      </div>

      {loading && (
        <p className="text-primary-700 text-sm mt-6 animate-pulse">Vérification...</p>
      )}
    </div>
  );
}
