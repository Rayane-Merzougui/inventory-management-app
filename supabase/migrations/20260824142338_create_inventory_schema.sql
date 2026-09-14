/*
# Inventaire Épicerie Fine — Schéma complet

## Contexte
Outil de gestion de stock pour une épicerie fine. Règle métier fondamentale :
la quantité en stock d'un produit n'est JAMAIS modifiée directement. Chaque
mouvement (entrée/sortie) est enregistré dans `mouvements_stock` et, dans la
même opération atomique, la `quantite_actuelle` du produit est ajustée. Cela
garantit traçabilité et intégrité des données.

## 1. Nouvelles tables

### `categories`
- `id` (uuid, PK)
- `nom` (text, unique, not null)
- `created_at` (timestamptz)

### `produits`
- `id` (uuid, PK)
- `nom` (text, not null)
- `categorie_id` (uuid, FK → categories, not null)
- `prix` (numeric(10,2), not null)
- `quantite_actuelle` (int, not null, default 0)
- `seuil_alerte` (int, not null, default 5)
- `created_at` (timestamptz)

### `mouvements_stock`
- `id` (uuid, PK)
- `produit_id` (uuid, FK → produits, not null)
- `type` (text: 'entree' | 'sortie', not null)
- `quantite` (int, not null, check > 0)
- `date` (timestamptz, default now())
- `motif` (text)
- `utilisateur_id` (uuid, FK → auth.users, nullable)
- `created_at` (timestamptz)

## 2. Sécurité (RLS)
- RLS activée sur `categories`, `produits`, `mouvements_stock`.
- Toutes les politiques sont `TO authenticated` avec `USING (true)` / `WITH CHECK (true)`
  car les données sont partagées entre tous les administrateurs authentifiés
  (application mono-admin, l'auth sert de porte d'entrée, pas d'isolation par utilisateur).

## 3. Fonction RPC `enregistrer_mouvement`
- SECURITY DEFINER, exécutable par `authenticated`.
- Insère le mouvement ET met à jour `quantite_actuelle` atomiquement.
- Lève une exception si une sortie ferait passer le stock en négatif.

## 4. Données de démonstration (seed)
- 6 catégories, ~20 produits, ~12 mouvements sur les derniers jours.
*/

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cat_select" ON categories;
CREATE POLICY "cat_select" ON categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cat_insert" ON categories;
CREATE POLICY "cat_insert" ON categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cat_update" ON categories;
CREATE POLICY "cat_update" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cat_delete" ON categories;
CREATE POLICY "cat_delete" ON categories FOR DELETE TO authenticated USING (true);

-- ============================================================
-- PRODUITS
-- ============================================================
CREATE TABLE IF NOT EXISTS produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  categorie_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  prix numeric(10,2) NOT NULL,
  quantite_actuelle int NOT NULL DEFAULT 0,
  seuil_alerte int NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prod_select" ON produits;
CREATE POLICY "prod_select" ON produits FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "prod_insert" ON produits;
CREATE POLICY "prod_insert" ON produits FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "prod_update" ON produits;
CREATE POLICY "prod_update" ON produits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "prod_delete" ON produits;
CREATE POLICY "prod_delete" ON produits FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie_id);

-- ============================================================
-- MOUVEMENTS STOCK
-- ============================================================
CREATE TABLE IF NOT EXISTS mouvements_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entree', 'sortie')),
  quantite int NOT NULL CHECK (quantite > 0),
  date timestamptz DEFAULT now(),
  motif text,
  utilisateur_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mvmt_select" ON mouvements_stock;
CREATE POLICY "mvmt_select" ON mouvements_stock FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "mvmt_insert" ON mouvements_stock;
CREATE POLICY "mvmt_insert" ON mouvements_stock FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "mvmt_update" ON mouvements_stock;
CREATE POLICY "mvmt_update" ON mouvements_stock FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "mvmt_delete" ON mouvements_stock;
CREATE POLICY "mvmt_delete" ON mouvements_stock FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_mouvements_produit ON mouvements_stock(produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(date);

-- ============================================================
-- FONCTION RPC : enregistrer_mouvement (atomique)
-- ============================================================
CREATE OR REPLACE FUNCTION enregistrer_mouvement(
  p_produit_id uuid,
  p_type text,
  p_quantite int,
  p_motif text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_nouvelle_quantite int;
BEGIN
  IF p_type NOT IN ('entree', 'sortie') THEN
    RAISE EXCEPTION 'Type de mouvement invalide : %', p_type;
  END IF;
  IF p_quantite <= 0 THEN
    RAISE EXCEPTION 'La quantité doit être positive';
  END IF;

  INSERT INTO mouvements_stock (produit_id, type, quantite, motif, utilisateur_id)
  VALUES (p_produit_id, p_type, p_quantite, p_motif, auth.uid())
  RETURNING id INTO v_id;

  IF p_type = 'entree' THEN
    UPDATE produits
      SET quantite_actuelle = quantite_actuelle + p_quantite
      WHERE id = p_produit_id;
  ELSE
    SELECT quantite_actuelle - p_quantite INTO v_nouvelle_quantite
      FROM produits WHERE id = p_produit_id;
    IF v_nouvelle_quantite < 0 THEN
      RAISE EXCEPTION 'Stock insuffisant : la sortie de % ferait passer la quantité à %', p_quantite, v_nouvelle_quantite;
    END IF;
    UPDATE produits
      SET quantite_actuelle = quantite_actuelle - p_quantite
      WHERE id = p_produit_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION enregistrer_mouvement(uuid, text, int, text) TO authenticated;

-- ============================================================
-- VUE : alertes (produits sous seuil)
-- ============================================================
CREATE OR REPLACE VIEW v_alertes AS
SELECT id, nom, quantite_actuelle, seuil_alerte
FROM produits
WHERE quantite_actuelle < seuil_alerte
ORDER BY quantite_actuelle ASC;

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO categories (nom)
SELECT v FROM (VALUES
  ('Épicerie'), ('Boissons'), ('Fruits & Légumes'), ('Fromages'),
  ('Charcuterie'), ('Condiments')
) AS t(v)
WHERE NOT EXISTS (SELECT 1 FROM categories);

-- Produits de démonstration (idempotent via ON CONFLICT DO NOTHING sur nom)
INSERT INTO produits (nom, categorie_id, prix, quantite_actuelle, seuil_alerte)
SELECT v.nom, c.id, v.prix, v.quantite, v.seuil
FROM (VALUES
  ('Huile d''olive vierge 75cl', 'Épicerie', 12.90, 8, 5),
  ('Vinaigre balsamique 50cl', 'Condiments', 9.50, 3, 5),
  ('Pâtes artisanales 500g', 'Épicerie', 6.20, 24, 10),
  ('Riz basmati 1kg', 'Épicerie', 7.80, 15, 8),
  ('Farine de blé T65 1kg', 'Épicerie', 3.50, 40, 10),
  ('Miel de châtaignier 250g', 'Épicerie', 11.00, 4, 5),
  ('Confiture artisanale 300g', 'Épicerie', 6.90, 12, 6),
  ('Café de spécialité 250g', 'Boissons', 14.50, 7, 5),
  ('Thé vert bio 100g', 'Boissons', 8.90, 9, 5),
  ('Jus de pomme fermier 1L', 'Boissons', 5.50, 2, 6),
  ('Limonade artisanale 75cl', 'Boissons', 4.20, 18, 8),
  ('Vin rouge Côtes du Rhône', 'Boissons', 13.00, 11, 4),
  ('Pommes gala (kg)', 'Fruits & Légumes', 3.20, 25, 10),
  ('Tomates anciennes (kg)', 'Fruits & Légumes', 4.80, 1, 8),
  ('Poires conférence (kg)', 'Fruits & Légumes', 3.90, 14, 10),
  ('Comté 24 mois 250g', 'Fromages', 9.80, 6, 4),
  ('Brie de Meaux 300g', 'Fromages', 8.50, 2, 4),
  ('Roquefort 200g', 'Fromages', 10.20, 5, 4),
  ('Saucisson sec 200g', 'Charcuterie', 7.90, 10, 5),
  ('Jambon cru de Bayonne 150g', 'Charcuterie', 9.40, 3, 5),
  ('Pâté de campagne 180g', 'Charcuterie', 5.60, 16, 6)
) AS v(nom, cat, prix, quantite, seuil)
JOIN categories c ON c.nom = v.cat
WHERE NOT EXISTS (SELECT 1 FROM produits p WHERE p.nom = v.nom);

-- Mouvements de démonstration (uniquement si la table est vide)
DO $$
DECLARE
  v_count int;
  p_huile uuid; p_vinaigre uuid; p_pates uuid; p_cafe uuid; p_jus uuid;
  p_tomates uuid; p_brie uuid; p_saucisson uuid; p_jambon uuid; p_comte uuid;
BEGIN
  SELECT count(*) INTO v_count FROM mouvements_stock;
  IF v_count > 0 THEN RETURN; END IF;

  SELECT id INTO p_huile FROM produits WHERE nom = 'Huile d''olive vierge 75cl';
  SELECT id INTO p_vinaigre FROM produits WHERE nom = 'Vinaigre balsamique 50cl';
  SELECT id INTO p_pates FROM produits WHERE nom = 'Pâtes artisanales 500g';
  SELECT id INTO p_cafe FROM produits WHERE nom = 'Café de spécialité 250g';
  SELECT id INTO p_jus FROM produits WHERE nom = 'Jus de pomme fermier 1L';
  SELECT id INTO p_tomates FROM produits WHERE nom = 'Tomates anciennes (kg)';
  SELECT id INTO p_brie FROM produits WHERE nom = 'Brie de Meaux 300g';
  SELECT id INTO p_saucisson FROM produits WHERE nom = 'Saucisson sec 200g';
  SELECT id INTO p_jambon FROM produits WHERE nom = 'Jambon cru de Bayonne 150g';
  SELECT id INTO p_comte FROM produits WHERE nom = 'Comté 24 mois 250g';

  INSERT INTO mouvements_stock (produit_id, type, quantite, date, motif) VALUES
    (p_huile,     'entree', 10, now() - interval '9 days', 'Réapprovisionnement fournisseur'),
    (p_huile,     'sortie', 2,  now() - interval '7 days', 'Vente client'),
    (p_vinaigre,  'entree', 5,  now() - interval '8 days', 'Commande initiale'),
    (p_vinaigre,  'sortie', 2,  now() - interval '5 days', 'Vente client'),
    (p_pates,     'entree', 30, now() - interval '10 days', 'Réapprovisionnement'),
    (p_pates,     'sortie', 6,  now() - interval '4 days', 'Vente client'),
    (p_cafe,      'entree', 10, now() - interval '6 days', 'Réapprovisionnement'),
    (p_cafe,      'sortie', 3,  now() - interval '2 days', 'Vente client'),
    (p_jus,       'entree', 12, now() - interval '6 days', 'Réapprovisionnement'),
    (p_jus,       'sortie', 10, now() - interval '1 days', 'Vente client'),
    (p_tomates,   'entree', 8,  now() - interval '3 days', 'Arrivage marché'),
    (p_tomates,   'sortie', 7,  now() - interval '1 days', 'Vente client'),
    (p_brie,      'entree', 6,  now() - interval '5 days', 'Réapprovisionnement'),
    (p_brie,      'sortie', 4,  now() - interval '2 days', 'Vente client'),
    (p_saucisson, 'entree', 15, now() - interval '8 days', 'Réapprovisionnement'),
    (p_saucisson, 'sortie', 5,  now() - interval '3 days', 'Vente client'),
    (p_jambon,    'entree', 8,  now() - interval '4 days', 'Réapprovisionnement'),
    (p_jambon,    'sortie', 5,  now() - interval '1 days', 'Vente client'),
    (p_comte,     'entree', 10, now() - interval '7 days', 'Réapprovisionnement'),
    (p_comte,     'sortie', 4,  now() - interval '2 days', 'Vente client');
END;
$$;