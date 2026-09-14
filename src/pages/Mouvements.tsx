import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Filter,
  History,
  Send,
  X,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import {
  fetchMouvements,
  fetchProduits,
  enregistrerMouvement,
  type Mouvement,
  type Produit,
} from '@/lib/db';

export default function Mouvements() {
  const toast = useToast();
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [produitId, setProduitId] = useState('');
  const [type, setType] = useState<'entree' | 'sortie'>('entree');
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');

  // Filters
  const [filterProduit, setFilterProduit] = useState('');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        fetchMouvements({
          produit_id: filterProduit || undefined,
          date_debut: filterDateDebut ? `${filterDateDebut}T00:00:00` : undefined,
          date_fin: filterDateFin ? `${filterDateFin}T23:59:59` : undefined,
        }),
        fetchProduits(),
      ]);
      setMouvements(m);
      setProduits(p);
      if (!produitId && p.length > 0) setProduitId(p[0].id);
    } catch {
      toast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProduit, filterDateDebut, filterDateFin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produitId) {
      toast('Veuillez sélectionner un produit', 'error');
      return;
    }
    const q = parseInt(quantite);
    if (isNaN(q) || q <= 0) {
      toast('La quantité doit être un entier positif', 'error');
      return;
    }
    setSaving(true);
    try {
      await enregistrerMouvement({
        produit_id: produitId,
        type,
        quantite: q,
        motif: motif.trim() || undefined,
      });
      toast(`Mouvement de ${type === 'entree' ? 'entrée' : 'sortie'} enregistré`);
      setQuantite('');
      setMotif('');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setFilterProduit('');
    setFilterDateDebut('');
    setFilterDateFin('');
  };

  const hasFilters = filterProduit || filterDateDebut || filterDateFin;

  return (
    <div className="space-y-5">
      {/* Quick entry form */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-stone-800">Enregistrer un mouvement</h3>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Produit</label>
            <select
              value={produitId}
              onChange={(e) => setProduitId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
              required
            >
              <option value="">Sélectionner...</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} (stock: {p.quantite_actuelle})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('entree')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === 'entree'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Entrée
              </button>
              <button
                type="button"
                onClick={() => setType('sortie')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === 'sortie'
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Sortie
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Quantité</label>
            <input
              type="number"
              min="1"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Motif</label>
            <input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
              placeholder="Ex: Réapprovisionnement"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? '...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-stone-500" />
          <h3 className="text-sm font-semibold text-stone-700">Filtrer l'historique</h3>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700"
            >
              <X className="w-3 h-3" />
              Réinitialiser
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filterProduit}
            onChange={(e) => setFilterProduit(e.target.value)}
            className="px-3 py-2 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
          >
            <option value="">Tous les produits</option>
            {produits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
          <div>
            <input
              type="date"
              value={filterDateDebut}
              onChange={(e) => setFilterDateDebut(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
            />
          </div>
          <div>
            <input
              type="date"
              value={filterDateFin}
              onChange={(e) => setFilterDateFin(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100">
          <History className="w-5 h-5 text-stone-500" />
          <h3 className="font-semibold text-stone-800">Historique des mouvements</h3>
          <span className="ml-auto text-sm text-stone-500">{mouvements.length} mouvement(s)</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : mouvements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400">
            <History className="w-12 h-12 mb-3" />
            <p className="text-sm">Aucun mouvement trouvé avec ces filtres.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Produit</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-right px-5 py-3 font-medium">Quantité</th>
                  <th className="text-left px-5 py-3 font-medium">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {mouvements.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-stone-50 transition-colors ${idx % 2 === 1 ? 'bg-stone-50/50' : ''}`}
                  >
                    <td className="px-5 py-3 text-stone-600 whitespace-nowrap">
                      {new Date(m.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
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
