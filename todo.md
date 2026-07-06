# TODO — Implémentation Plawimadd Group

> **Contexte :** E-commerce électronique (Bénin) — Next.js 16 / Prisma / MySQL / NextAuth / Kkiapay
> **Objectif :** Implémenter les features issues de la rétro-ingénierie Alibaba.com (docs/technical_doc_part1 & part2)
> **Priorités :** 🏆 Alibaba Core | ⚡ Haute | 🔧 Moyenne | 🧹 Basse

---

## 🏆 ALIBABA CORE — ATTRIBUTS DYNAMIQUES (Mission 5 des docs)

> *Le "système magique" — Comment Alibaba gère 5000+ catégories avec le même code*

### A.1 Modèle de données — Schéma des attributs dynamiques
- [ ] **Créer le modèle `ProductVariant`** dans Prisma :
  - `id` (UUID PK), `productId` (FK), `sku` (unique), `variantName`, `price`, `stock`, `leadTimeDays`, `moq`, `weight`, `dimensions`, `attributesJson` (JSON)
- [ ] **Créer le modèle `AttributeValue`** (valeurs prédéfinies) :
  - `id` (UUID PK), `attributeId` (FK → Characteristic), `value`, `valueSlug`, `colorCode` (nullable), `imageUrl` (nullable), `sortOrder`, `isActive`
- [ ] **Créer le modèle `VariantAttribute`** (table de jonction) :
  - `id` (UUID PK), `variantId` (FK), `attributeId` (FK), `attributeValueId` (FK), `priceModifier` (DECIMAL), `stockAdjustment` (INT), `weightModifier` (DECIMAL)
- [ ] **Créer le modèle `VariantImage`** (images par variante) :
  - `id` (UUID PK), `variantId` (FK), `imageUrl`, `displayOrder`, `isMainImage`
- [ ] **Ajouter `attributesJson` (JSON) au modèle `Product`** pour stocker les attributs non-variants
- [ ] **Ajouter `moqMin`/`moqMax` (INT), `leadTimeRange` (VARCHAR), `certifications` (JSON), `tags` (JSON) au modèle `Product`**
- [ ] **Étendre `Characteristic`** : ajouter `attributeType` (ENUM: text/select/multi-select/range/color/size) et `isVariant` (BOOLEAN)
- [ ] Exécuter les migrations Prisma

### A.2 API — Attributs & Variantes
- [ ] **`GET /api/categories/[id]/attributes`** — Charger les attributs d'une catégorie avec leurs valeurs
- [ ] **`POST /api/admin/attribute-values`** — CRUD des valeurs d'attribut
- [ ] **`PUT /api/admin/characteristics`** — Étendre pour gérer `attributeType` et `isVariant`
- [ ] **`GET /api/products/[id]/variants`** — Lire toutes les variantes d'un produit
- [ ] **`POST /api/admin/variants`** — Créer/mettre à jour les variantes d'un produit
- [ ] **`POST /api/admin/variants/generate`** — Générer automatiquement les combinaisons SKU
- [ ] **`PATCH /api/admin/variants/[id]/stock`** — Mettre à jour le stock d'une variante

### A.3 Admin — Formulaire produit dynamique (Product Upload Wizard)
- [ ] **Étape 1 : Sélection de catégorie** — L'admin choisit la catégorie
- [ ] **Étape 2 : Infos produit** — Titre, description, upload images (multiples)
- [ ] **Étape 3 : Configuration des variantes** :
  - [ ] Charger les attributs depuis la DB selon catégorie
  - [ ] Rendu dynamique du formulaire (select, text, range, color, multi-select)
  - [ ] Groupes de variantes (Couleur, Stockage, RAM, etc.)
  - [ ] Prix modificateurs par valeur d'attribut
  - [ ] Ajustement de stock par variante
  - [ ] Génération automatique des SKU
  - [ ] Images différentes par variante
- [ ] **Étape 4 : Prix & MOQ** — Prix par paliers (quantité), MOQ min/max
- [ ] **Étape 5 : Options de livraison** — Délai, port, méthodes
- [ ] **Étape 6 : Certifications** — Badges CE, FCC, RoHS, ISO
- [ ] **Étape 7 : Revue & publication**
- [ ] Remplacer l'ancienne page `seller/add-products/` par le nouveau wizard

### A.4 Frontend — Sélecteur de variantes (PDP)
- [ ] **Composant `VariantSelector`** générique :
  - [ ] Rendu dynamique : select, boutons couleur, boutons taille
  - [ ] Mise à jour temps réel du prix selon variante sélectionnée
  - [ ] Mise à jour de l'image selon variante
  - [ ] Mise à jour du stock
  - [ ] Mise à jour du SKU affiché
  - [ ] Calcul des prix par paliers (quantity tiers)
- [ ] ```javascript
      // Logique de calcul
      const getVariantPrice = (product, selectedOptions, quantity) => {
        const variant = findVariant(product.variants, selectedOptions);
        const tier = findApplicableTier(variant.priceTiers, quantity);
        return { unitPrice: tier.price, total: tier.price * quantity };
      };
      ```
- [ ] Désactivation des combinaisons non disponibles (stock = 0)

### A.5 Frontend — Page Produit (PDP) complète
- [ ] **Galerie d'images** :
  - [ ] Image principale (400x400px) avec zoom au survol (2x)
  - [ ] Miniatures défilantes (max 6 visibles)
  - [ ] Vue 360° si disponible
  - [ ] Prévisualisation vidéo si fournie
  - [ ] Lazy loading des miniatures
- [ ] **Section prix sticky à droite** (reste visible au scroll)
- [ ] **Affichage des attributs dynamiques** (lecture depuis `attributesJson`)
- [ ] **Informations fournisseur** : logo, nom, vérification, temps de réponse, feedback
- [ ] **Badges & certifications** : Trade Assurance, Fast Dispatch, Sample Available
- [ ] **Livraison** : Délai, méthodes, port, coût estimé
- [ ] **Tabs produit** : Spécifications | Infos livraison | Avis | FAQ | Plus
- [ ] **Produits connexes** : Similar Products, Customers Also Viewed, Also Bought
- [ ] **Boutons d'action** : Add to Cart, Buy Now, Wishlist, Contact

---

## 🏆 ALIBABA CORE — RECHERCHE & FILTRES (Mission 2 des docs)

### B.1 Page de recherche (SRP) — `/all-products`
- [ ] **Refonte complète de la page** avec layout à 2 colonnes :
  - [ ] Barre latérale gauche (filtres) + grille produits à droite
- [ ] **Filtres avancés (sidebar)** :
  - [ ] Arbre de catégories expandable avec compteurs
  - [ ] Filtre prix (curseur min-max personnalisable)
  - [ ] Filtre type fournisseur (Vérifié, Gold, Certifié)
  - [ ] Filtre MOQ (tranches)
  - [ ] Filtre livraison (Ready to Ship, Made to Order)
  - [ ] Filtre certifications (CE, FCC, RoHS, ISO)
  - [ ] Filtre délai de livraison
  - [ ] Filtre note (⭐⭐⭐⭐⭐ 4.5+, etc.)
  - [ ] "Plus de filtres" expandable (couleurs, matériaux, tailles)
- [ ] **Tri** : Pertinence, Nouveauté, Prix croissant/décroissant, Mieux notés, Plus vendus
- [ ] **Carte produit (Product Card)** enrichie :
  - [ ] Image 250x250 avec lazy loading
  - [ ] Hover gallery (miniatures)
  - [ ] Badge fournisseur vérifié
  - [ ] Note et nombre d'avis
  - [ ] Prix par paliers (US $X.XX - $Y.YY)
  - [ ] MOQ
  - [ ] Capacité d'approvisionnement
  - [ ] Délai de livraison
  - [ ] Badge "Fast Dispatch"
  - [ ] Boutons Contact et Add to Cart

### B.2 Mega Menu (Navigation catégories)
- [ ] **Composant `MegaMenu`** dans la Navbar :
  - [ ] Menu déroulant dynamique chargé depuis `/api/categories`
  - [ ] Arbre à 3 niveaux (Root → Main → Sub)
  - [ ] Affichage responsive (drawer sur mobile)
  - [ ] Images catégories

---

## 🏆 ALIBABA CORE — PAGE D'ACCUEIL (Mission 2 des docs)

### C.1 Enhancements Homepage
- [ ] **Section "AI Mode" / Suggestions de recherche** : Tags cliquables → redirection vers recherche
- [ ] **Frequently Searched / Hot Products** : Carrousel horizontal défilant avec produits tendance
- [ ] **Search Suggestions** : Tags populaires (Caméra, Laptop, Smartphone…)
- [ ] **Section "Connect with Verified Suppliers"** (plus tard → feature fournisseur)
- [ ] **Bannières recommandées** : "US Local Stock", "5 days Delivery"

---

## 🏆 ALIBABA CORE — PANIER (Mission 2 des docs)

### D.1 Enhancements Panier
- [ ] **Avertissements MOQ** : Minimum non atteint / atteint par produit
- [ ] **Estimation frais de port** par pays
- [ ] **Calcul des taxes** estimées
- [ ] **"Save for Later"** : Déplacer un article dans une liste de sauvegarde
- [ ] **Sticky Order Summary** : Reste visible au scroll

---

## ⚡ HAUTE — FONDATIONS (prérequis aux features Alibaba)

### E.1 Base de données & Prisma
- [ ] Exécuter `prisma generate`
- [ ] Exécuter les migrations sur la DB de développement
- [ ] Exécuter `db:seed` (catégories, produits, permissions, rôles)
- [ ] Vérifier la cohérence seed.ts / seed-permissions.ts (fusionner)

### E.2 Authentification
- [ ] Configurer `NEXTAUTH_SECRET` et `JWT_SECRET`
- [ ] Configurer Google OAuth
- [ ] Tester le flux complet : inscription → connexion → session

### E.3 Paiements & Commandes
- [ ] Configurer les clés API Kkiapay (live mode)
- [ ] Tester le callback `kkiapay-callback/route.ts`
- [ ] Tester le flux complet : ajout panier → checkout → paiement → confirmation
- [ ] Tester la génération de facture PDF

### E.4 Environnement
- [ ] Créer le fichier `.env` avec les vraies valeurs
- [ ] Vérifier que `npm run build` passe
- [ ] Vérifier que `npm test` passe

---

## 🔧 MOYENNE

### F.1 Programme Étudiant
- [ ] Finaliser le flux : soumission → upload document → approbation admin
- [ ] Tester la création de commande avec installment (50% + 25% + 25%)
- [ ] Tester les rappels email pour échéances impayées
- [ ] Tester l'export CSV

### F.2 Dashboard Admin (stats, rapports, users)
- [ ] Tester `/api/dashboard/stats` (toutes les métriques)
- [ ] Tester la gestion des utilisateurs (création, bannissement, rôles)
- [ ] Tester les promotions & coupons
- [ ] Tester la corbeille (soft delete, purge 30 jours)

### F.3 Pages Frontend existantes
- [ ] Finaliser les pages : login, register, forgot/reset password
- [ ] Finaliser `/my-orders`, `/wishlist`, `/add-address`
- [ ] Finaliser `/contact` (envoi email)
- [ ] Vérifier toutes les animations Framer Motion

### F.4 Internationalisation
- [ ] Étendre `LanguageContext` à toute l'application
- [ ] Finaliser les traductions FR/EN

### F.5 Email & Notifications
- [ ] Configurer Nodemailer (Gmail App Password)
- [ ] Tester : reset password, approbation étudiant, rappel échéance, confirmation commande

---

## 🧹 BASSE

### G.1 Tests
- [ ] Ajouter des tests pour les API routes critiques
- [ ] Ajouter des tests pour les composants (React Testing Library)
- [ ] Ajouter des tests pour le système de variantes
- [ ] Ajouter des tests E2E (Cypress/Playwright)

### G.2 Nettoyage
- [ ] Supprimer `assets/assets.ts` (legacy dummy data)
- [ ] Nettoyer la duplication `admin/pages` / `admin/cms-pages`
- [ ] Supprimer le dossier vide `app/api/student/installment-invoice/`
- [ ] Corriger `prettier.config.cjs` (import ESM invalide)
- [ ] Audit CSP dans `next.config.js`

### G.3 SEO & Performance
- [ ] Meta tags (title, description, OG) sur chaque page
- [ ] Lazy loading des images
- [ ] SSR/ISR pour les pages critiques

---

## 📊 RÉSUMÉ — PRIORITÉ ALIBABA

| Lot | Description | Priorité | Tâches |
|-----|-------------|----------|--------|
| **A** | **Attributs Dynamiques (+ Variants + PDP)** | 🏆 **Alibaba Core** | ~35 |
| **B** | **Recherche & Filtres (SRP + Mega Menu)** | 🏆 **Alibaba Core** | ~15 |
| **C** | **Homepage Enhancements** | 🏆 **Alibaba Core** | ~5 |
| **D** | **Panier Enhancements** | 🏆 **Alibaba Core** | ~5 |
| E | Fondations & Infra | ⚡ Haute | ~10 |
| F | Features existantes | 🔧 Moyenne | ~30 |
| G | Cleanup & Tests | 🧹 Basse | ~15 |

**Total estimé : ~115 tâches — 60% sont les features Alibaba (A+B+C+D)**
