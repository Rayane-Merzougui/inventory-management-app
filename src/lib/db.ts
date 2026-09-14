import { supabase } from './supabase';
import type { Categorie, Mouvement, Produit, RapportMensuel } from './supabase';

export type { Categorie, Mouvement, Produit, RapportMensuel };

// ---------- Categories ----------
export async function fetchCategories(): Promise<Categorie[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('nom');
  if (error) throw error;
  return data ?? [];
}

export async function createCategorie(nom: string): Promise<Categorie> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ nom })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategorie(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Produits ----------
export async function fetchProduits(): Promise<Produit[]> {
  const { data, error } = await supabase
    .from('produits')
    .select('*, categorie:categories(*)')
    .order('nom');
  if (error) throw error;
  return (data ?? []) as Produit[];
}

export async function createProduit(p: {
  nom: string;
  categorie_id: string;
  prix: number;
  seuil_alerte: number;
}): Promise<Produit> {
  const { data, error } = await supabase
    .from('produits')
    .insert({
      nom: p.nom,
      categorie_id: p.categorie_id,
      prix: p.prix,
      seuil_alerte: p.seuil_alerte,
      quantite_actuelle: 0,
    })
    .select('*, categorie:categories(*)')
    .single();
  if (error) throw error;
  return data as Produit;
}

export async function updateProduit(
  id: string,
  p: { nom: string; categorie_id: string; prix: number; seuil_alerte: number }
): Promise<Produit> {
  const { data, error } = await supabase
    .from('produits')
    .update({
      nom: p.nom,
      categorie_id: p.categorie_id,
      prix: p.prix,
      seuil_alerte: p.seuil_alerte,
    })
    .eq('id', id)
    .select('*, categorie:categories(*)')
    .single();
  if (error) throw error;
  return data as Produit;
}

export async function deleteProduit(id: string): Promise<void> {
  const { error } = await supabase.from('produits').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Mouvements ----------
export async function fetchMouvements(filters?: {
  produit_id?: string;
  date_debut?: string;
  date_fin?: string;
}): Promise<Mouvement[]> {
  let q = supabase
    .from('mouvements_stock')
    .select('*, produit:produits(*, categorie:categories(*))')
    .order('date', { ascending: false });
  if (filters?.produit_id) q = q.eq('produit_id', filters.produit_id);
  if (filters?.date_debut) q = q.gte('date', filters.date_debut);
  if (filters?.date_fin) q = q.lte('date', filters.date_fin);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Mouvement[];
}

export async function enregistrerMouvement(p: {
  produit_id: string;
  type: 'entree' | 'sortie';
  quantite: number;
  motif?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('enregistrer_mouvement', {
    p_produit_id: p.produit_id,
    p_type: p.type,
    p_quantite: p.quantite,
    p_motif: p.motif ?? null,
  });
  if (error) throw error;
  return data as string;
}

// ---------- Alertes ----------
export async function fetchAlertes(): Promise<
  { id: string; nom: string; quantite_actuelle: number; seuil_alerte: number }[]
> {
  const { data, error } = await supabase
    .from('v_alertes')
    .select('*')
    .order('quantite_actuelle', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---------- Rapport mensuel ----------
export async function fetchRapportMensuel(): Promise<RapportMensuel> {
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const debutMoisPrec = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const finMoisPrec = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Tous les mouvements du mois précédent
  const { data: mouvements, error } = await supabase
    .from('mouvements_stock')
    .select(
      'id, type, quantite, date, produit_id, produit:produits(nom, prix)'
    )
    .gte('date', debutMoisPrec.toISOString())
    .lte('date', finMoisPrec.toISOString());
  if (error) throw error;

  const list = (mouvements ?? []) as unknown as {
    id: string;
    type: 'entree' | 'sortie';
    quantite: number;
    date: string;
    produit_id: string;
    produit: { nom: string; prix: number };
  }[];

  let total_entrees = 0;
  let total_sorties = 0;
  let valeur_entrees = 0;
  let valeur_sorties = 0;
  const parProduit: Record<string, { nom: string; nb: number }> = {};
  const parJour: Record<string, { entrees: number; sorties: number }> = {};

  for (const m of list) {
    const prix = m.produit?.prix ?? 0;
    const jourKey = m.date.slice(0, 10);
    if (!parJour[jourKey]) parJour[jourKey] = { entrees: 0, sorties: 0 };
    if (m.type === 'entree') {
      total_entrees += m.quantite;
      valeur_entrees += m.quantite * prix;
      parJour[jourKey].entrees += m.quantite;
    } else {
      total_sorties += m.quantite;
      valeur_sorties += m.quantite * prix;
      parJour[jourKey].sorties += m.quantite;
    }
    if (!parProduit[m.produit_id]) {
      parProduit[m.produit_id] = { nom: m.produit?.nom ?? 'Inconnu', nb: 0 };
    }
    parProduit[m.produit_id].nb += 1;
  }

  const top_produits = Object.entries(parProduit)
    .map(([produit_id, v]) => ({ produit_id, nom: v.nom, nb_mouvements: v.nb }))
    .sort((a, b) => b.nb_mouvements - a.nb_mouvements)
    .slice(0, 5);

  const par_jour = Object.entries(parJour)
    .map(([date, v]) => ({ date, entrees: v.entrees, sorties: v.sorties }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_entrees,
    total_sorties,
    valeur_entrees,
    valeur_sorties,
    nombre_mouvements: list.length,
    top_produits,
    par_jour,
  };
}

// ---------- Export CSV ----------
export function exportCsv(produits: Produit[]): void {
  const headers = ['id', 'nom', 'catégorie', 'prix', 'quantité', 'seuil'];
  const rows = produits.map((p) => [
    p.id,
    p.nom,
    p.categorie?.nom ?? '',
    p.prix.toString(),
    p.quantite_actuelle.toString(),
    p.seuil_alerte.toString(),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventaire.csv';
  a.click();
  URL.revokeObjectURL(url);
}
