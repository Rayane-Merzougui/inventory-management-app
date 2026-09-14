import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  BarChart3,
  Loader2,
  Download,
  Trophy,
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
import { fetchRapportMensuel, type RapportMensuel } from '@/lib/db';
import { useToast } from '@/components/Toast';

export default function Rapports() {
  const toast = useToast();
  const [rapport, setRapport] = useState<RapportMensuel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchRapportMensuel();
        setRapport(r);
      } catch {
        toast('Erreur lors du chargement du rapport', 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moisLabel = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const handleExport = () => {
    if (!rapport) return;
    const headers = ['Indicateur', 'Valeur'];
    const rows = [
      ['Mois', moisLabel],
      ['Total entrées (quantité)', rapport.total_entrees.toString()],
      ['Total sorties (quantité)', rapport.total_sorties.toString()],
      ['Valeur entrées (€)', rapport.valeur_entrees.toFixed(2)],
      ['Valeur sorties (€)', rapport.valeur_sorties.toFixed(2)],
      ['Nombre de mouvements', rapport.nombre_mouvements.toString()],
      ['', ''],
      ['Top 5 produits', ''],
      ...rapport.top_produits.map((p, i) => [
        `${i + 1}. ${p.nom}`,
        `${p.nb_mouvements} mouvements`,
      ]),
    ];
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${moisLabel.replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Rapport exporté');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!rapport) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
        Impossible de charger le rapport.
      </div>
    );
  }

  const stats = [
    {
      label: 'Entrées (quantité)',
      value: rapport.total_entrees,
      sub: `${rapport.valeur_entrees.toFixed(2)} €`,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Sorties (quantité)',
      value: rapport.total_sorties,
      sub: `${rapport.valeur_sorties.toFixed(2)} €`,
      icon: TrendingDown,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Mouvements totaux',
      value: rapport.nombre_mouvements,
      sub: 'ce mois',
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Produits actifs',
      value: rapport.top_produits.length,
      sub: 'mouvementés',
      icon: Package,
      color: 'bg-stone-100 text-stone-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-800 capitalize">{moisLabel}</h2>
          <p className="text-sm text-stone-500">Rapport mensuel automatique</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

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
              <p className="text-xs text-stone-400 mt-1">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-800 mb-4">Entrées / Sorties par jour</h3>
          {rapport.par_jour.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
              Aucune donnée pour ce mois.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rapport.par_jour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => v.slice(5)}
                />
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

        {/* Top 5 */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-stone-800">Top 5 produits mouvementés</h3>
          </div>
          {rapport.top_produits.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
              Aucun mouvement ce mois.
            </div>
          ) : (
            <div className="space-y-3">
              {rapport.top_produits.map((p, i) => {
                const max = rapport.top_produits[0].nb_mouvements;
                const pct = (p.nb_mouvements / max) * 100;
                return (
                  <div key={p.produit_id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0
                              ? 'bg-amber-100 text-amber-700'
                              : i === 1
                                ? 'bg-stone-200 text-stone-600'
                                : i === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-stone-700">{p.nom}</span>
                      </div>
                      <span className="text-sm text-stone-500 font-medium">
                        {p.nb_mouvements}
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden ml-8">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
