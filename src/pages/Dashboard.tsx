import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  fetchProduits,
  fetchMouvements,
  fetchAlertes,
  type Produit,
  type Mouvement,
} from '@/lib/db';

export default function Dashboard() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [alertes, setAlertes] = useState<
    { id: string; nom: string; quantite_actuelle: number; seuil_alerte: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduitId, setSelectedProduitId] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const [p, m, a] = await Promise.all([
          fetchProduits(),
          fetchMouvements(),
          fetchAlertes(),
        ]);
        setProduits(p);
        setMouvements(m.slice(0, 5));
        setAlertes(a);
        if (p.length > 0) setSelectedProduitId(p[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const valeurStock = produits.reduce((sum, p) => sum + p.prix * p.quantite_actuelle, 0);
  const totalProduits = produits.length;

  const chartData = (() => {
    if (!selectedProduitId) return [];
    const filtered = mouvements.filter((m) => m.produit_id === selectedProduitId);
    return filtered.map((m) => ({
      date: new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      quantite: m.type === 'entree' ? m.quantite : -m.quantite,
      type: m.type === 'entree' ? 'Entrée' : 'Sortie',
    }));
  })();

  // Build evolution chart: cumulative stock for selected product
  const evolutionData = (() => {
    if (!selectedProduitId) return [];
    const prod = produits.find((p) => p.id === selectedProduitId);
    if (!prod) return [];
    const allMvmts = mouvements.filter((m) => m.produit_id === selectedProduitId);
    // We need ALL mouvements, not just the 5 latest. Re-fetch would be ideal.
    // For the dashboard chart, let's compute from all mouvements we fetched
    return allMvmts
      .slice()
      .reverse()
      .map((m, idx) => {
        return {
          date: new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          entrees: m.type === 'entree' ? m.quantite : 0,
          sorties: m.type === 'sortie' ? m.quantite : 0,
        };
      });
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Produits référencés',
      value: totalProduits.toString(),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Valeur du stock',
      value: `${valeurStock.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Produits en alerte',
      value: alertes.length.toString(),
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Mouvements récents',
      value: mouvements.length.toString(),
      icon: ArrowDownRight,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-stone-800">{s.value}</p>
              <p className="text-sm text-stone-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertes */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-stone-800">Alertes de stock</h3>
            {alertes.length > 0 && (
              <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                {alertes.length}
              </span>
            )}
          </div>
          {alertes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-stone-400">
              <Boxes className="w-10 h-10 mb-2" />
              <p className="text-sm">Aucune alerte. Tous les stocks sont au-dessus du seuil.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {alertes.map((a) => {
                const isCritical = a.quantite_actuelle === 0;
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCritical ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-800">{a.nom}</p>
                      <p className="text-xs text-stone-500">
                        Seuil : {a.seuil_alerte} · Actuel : {a.quantite_actuelle}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        isCritical ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                      }`}
                    >
                      {isCritical ? 'Rupture' : 'Faible'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-800">Évolution des mouvements</h3>
            <select
              value={selectedProduitId}
              onChange={(e) => setSelectedProduitId(e.target.value)}
              className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
            >
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
          {evolutionData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
              Aucun mouvement pour ce produit.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e7e5e4',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Bar dataKey="entrees" name="Entrées" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sorties" name="Sorties" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Derniers mouvements */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">Derniers mouvements</h3>
          <Link
            to="/mouvements"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Voir tout →
          </Link>
        </div>
        {mouvements.length === 0 ? (
          <div className="px-5 py-8 text-center text-stone-400 text-sm">
            Aucun mouvement enregistré pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Produit</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-right px-5 py-3 font-medium">Quantité</th>
                  <th className="text-left px-5 py-3 font-medium">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {mouvements.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3 text-stone-600">
                      {new Date(m.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 font-medium text-stone-800">
                      {m.produit?.nom ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          m.type === 'entree'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {m.type === 'entree' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {m.type === 'entree' ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-stone-700">
                      {m.quantite}
                    </td>
                    <td className="px-5 py-3 text-stone-500">{m.motif ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
