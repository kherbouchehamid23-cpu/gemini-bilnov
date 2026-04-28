'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', description: '', structureType: 'BUILDING', sector: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/api/projects', form);
      router.push(`/projects/${data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Retour
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Nouveau projet</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              maxLength={100}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Appartement T4 - Paris 11e"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Description optionnelle..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de structure</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'BUILDING', label: '🏠 Bâtiment', desc: 'Étages et pièces' },
                { value: 'FREE', label: '🔧 Structure libre', desc: 'Multi-industrie' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, structureType: opt.value }))}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    form.structureType === opt.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
            <select
              value={form.sector}
              onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionner (optionnel)</option>
              <option value="Immobilier">Immobilier</option>
              <option value="Architecture">Architecture</option>
              <option value="Industrie">Industrie</option>
              <option value="Événementiel">Événementiel</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-700 text-white py-3 rounded-lg font-medium hover:bg-primary-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Création...' : 'Créer le projet'}
          </button>
        </form>
      </div>
    </div>
  );
}
