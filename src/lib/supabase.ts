import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Categorie = {
  id: string;
  nom: string;
  created_at?: string;
};

export type Produit = {
  id: string;
  nom: string;
  categorie_id: string;
  categorie?: Categorie;
  prix: number;
  quantite_actuelle: number;
  seuil_alerte: number;
  created_at?: string;
};

export type Mouvement = {
  id: string;
  produit_id: string;
  type: 'entree' | 'sortie';
  quantite: number;
  date: string;
  motif: string | null;
  utilisateur_id: string | null;
  produit?: Produit;
};

export type RapportMensuel = {
  total_entrees: number;
  total_sorties: number;
  valeur_entrees: number;
  valeur_sorties: number;
  nombre_mouvements: number;
  top_produits: { produit_id: string; nom: string; nb_mouvements: number }[];
  par_jour: { date: string; entrees: number; sorties: number }[];
};
