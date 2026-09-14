import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  Download,
  Loader2,
  Package,
  X,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import {
  fetchProduits,
  fetchCategories,
  createProduit,
  updateProduit,
  deleteProduit,
  exportCsv,
  type Produit,
  type Categorie,
} from '@/lib/db';

type FormState = {
  nom: string;
  categorie_id: string;
  prix: string;
  seuil_alerte: string;
};

const emptyForm: FormState = {
  nom: '',
  categorie_id: '',
  prix: '',
  seuil_alerte: '5',
};

export default function Produits() {
  const toast = useToast();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterLow, setFilterLow] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetchProduits(), fetchCategories()]);
      setProduits(p);
      setCategories(c);
    } catch {
      toast('Erreur lors du chargement des produits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = produits.filter((p) => {
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && p.categorie_id !== filterCat) return false;
    if (filterLow && p.quantite_actuelle >= p.seuil_alerte) return false;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, categorie_id: categories[0]?.id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (p: Produit) => {
    setEditing(p);
    setForm({
      nom: p.nom,
      categorie_id: p.categorie_id,
      prix: p.prix.toString(),
      seuil_alerte: p.seuil_alerte.toString(),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.categorie_id) {
      toast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    const prix = parseFloat(form.prix);
    const seuil = parseInt(form.seuil_alerte);
    if (isNaN(prix) || prix < 0) {
      toast('Le prix doit être un nombre positif', 'error');
      return;
    }
    if (isNaN(seuil) || seuil < 0) {
      toast("Le seuil d'alerte doit être un entier positif", 'error');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateProduit(editing.id, {
          nom: form.nom.trim(),
          categorie_id: form.categorie_id,
          prix,
          seuil_alerte: seuil,
        });
        toast('Produit mis à jour');
      } else {
        await createProduit({
          nom: form.nom.trim(),
          categorie_id: form.categorie_id,
          prix,
          seuil_alerte: seuil,
        });
        toast('Produit créé');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProduit(deleteId);
      toast('Produit supprimé');
      setDeleteId(null);
      await load();
    } catch {
      toast('Impossible de supprimer : ce produit a des mouvements associés', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    exportCsv(produits);
    toast('Export CSV téléchargé');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={filterLow}
              onChange={(e) => setFilterLow(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
            />
            Stock faible uniquement
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-900 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400">
            <Package className="w-12 h-12 mb-3" />
            <p className="text-sm">Aucun produit trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Nom</th>
                  <th className="text-left px-5 py-3 font-medium">Catégorie</th>
                  <th className="text-right px-5 py-3 font-medium">Prix</th>
                  <th className="text-right px-5 py-3 font-medium">Quantité</th>
                  <th className="text-right px-5 py-3 font-medium">Seuil</th>
                  <th className="text-center px-5 py-3 font-medium">Statut</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((p, idx) => {
                  const isLow = p.quantite_actuelle < p.seuil_alerte;
                  const isCritical = p.quantite_actuelle === 0;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-stone-50 transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-stone-50/50' : ''}`}
                      onClick={() => openEdit(p)}
                    >
                      <td className="px-5 py-3 font-medium text-stone-800">{p.nom}</td>
                      <td className="px-5 py-3 text-stone-600">{p.categorie?.nom ?? '—'}</td>
                      <td className="px-5 py-3 text-right text-stone-700">
                        {p.prix.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-stone-800">
                        {p.quantite_actuelle}
                      </td>
                      <td className="px-5 py-3 text-right text-stone-500">{p.seuil_alerte}</td>
                      <td className="px-5 py-3 text-center">
                        {isLow ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                              isCritical
                                ? 'bg-red-100 text-red-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {isCritical ? 'Rupture' : 'Faible'}
                          </span>
                        ) : (
                          <span className="inline-flex text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le produit' : 'Nouveau produit'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Nom du produit *</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
              placeholder="Ex: Huile d'olive vierge 75cl"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Catégorie *</label>
            <select
              value={form.categorie_id}
              onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
              required
            >
              <option value="">Sélectionner...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Prix (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.prix}
                onChange={(e) => setForm({ ...form, prix: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Seuil d'alerte *</label>
              <input
                type="number"
                min="0"
                value={form.seuil_alerte}
                onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
                placeholder="5"
                required
              />
            </div>
          </div>
          {editing && (
            <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-500">
              La quantité en stock ne se modifie pas ici : elle évolue via les mouvements
              (entrées/sorties) pour garantir la traçabilité.
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-900 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmer la suppression">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-stone-600">
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
              La suppression sera bloquée si des mouvements sont associés à ce produit.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
