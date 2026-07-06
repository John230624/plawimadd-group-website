# RÉTRO-INGÉNIERIE TECHNIQUE ALIBABA.COM
## Documentation Architecturale Complète

**Date**: Juillet 2026  
**Version**: 1.0  
**Auteur**: Analyse Technique Senior  
**Objectif**: Comprendre et reproduire l'architecture de la plus grande marketplace B2B au monde

---

# TABLE DES MATIÈRES
1. [Cartographie du Site](#mission-1-cartographie)
2. [Architecture Générale](#architecture-générale)
3. [Structure de Navigation](#structure-navigation)
4. [Analyse Visuelle](#mission-2-analyse-visuelle)
5. [Composants UI/UX](#composants-ui)
6. [Structure Technique](#structure-technique)

---

# MISSION 1: CARTOGRAPHIE COMPLÈTE DU SITE {#mission-1-cartographie}

## Arbre de Navigation Complet

```
ALIBABA.COM
│
├── ACCUEIL (Homepage)
│   ├── Hero Section
│   ├── AI Mode CTA
│   ├── Featured Categories
│   ├── Trending Products
│   ├── Frequently Searched (Hot Products)
│   ├── Recommendations
│   └── Promotional Banners
│
├── RECHERCHE & DÉCOUVERTE
│   ├── Search Results Page (SRP)
│   │   ├── Filtres avancés (Gauche)
│   │   ├── Liste des produits
│   │   ├── Pagination/Scroll infini
│   │   └── Sorting options
│   ├── Category Pages
│   │   ├── Mega Menu
│   │   ├── Sub-categories
│   │   ├── Featured Suppliers
│   │   └── Category-specific filters
│   ├── Manufacturers Page
│   │   ├── Top Ranked Manufacturers
│   │   ├── Verified Suppliers
│   │   ├── Factory Express
│   │   └── Industry-based filtering
│   └── AI Mode (IA Sourcing Agent)
│       ├── Business Research
│       ├── Product Recommendations
│       ├── Trend Analysis
│       └── Supplier Matching
│
├── PAGE PRODUIT
│   ├── Product Details Section
│   │   ├── Product Images/Gallery (Zoom, 360°)
│   │   ├── Title & Basic Info
│   │   ├── Pricing (min order)
│   │   ├── MOQ Configuration
│   │   └── Stock Indicator
│   ├── Specifications & Variants
│   │   ├── Dynamic Attributes
│   │   ├── Size/Color/Model Selection
│   │   ├── Price Tiers (by quantity)
│   │   └── Shipping Options
│   ├── Supplier Information
│   │   ├── Supplier Profile Link
│   │   ├── Rating & Reviews Score
│   │   ├── Response Time
│   │   └── Trade Assurance Badge
│   ├── Reviews & Ratings
│   │   ├── Star Rating
│   │   ├── Review Count
│   │   ├── Customer Photos
│   │   └── Detailed Reviews
│   ├── Related Products
│   │   ├── Similar Items
│   │   ├── Complementary Products
│   │   └── "Customers Also Viewed"
│   ├── Certifications & Badges
│   │   ├── Quality Certifications
│   │   ├── Trade Assurance
│   │   ├── Fast Dispatch
│   │   └── Sample Available
│   ├── Shipping Information
│   │   ├── Lead Time
│   │   ├── Shipping Methods
│   │   ├── Port Information
│   │   └── Logistics Cost
│   └── Action Buttons
│       ├── Add to Cart
│       ├── Buy Now
│       ├── Add to Wishlist
│       └── Contact Supplier (RFQ)
│
├── PANIER & CHECKOUT
│   ├── Shopping Cart
│   │   ├── Cart Items List
│   │   ├── Quantity Adjustment
│   │   ├── Remove Items
│   │   ├── Save for Later
│   │   └── Cart Summary (Total, MOQ Warnings)
│   ├── Shipping Address
│   │   ├── Address Book
│   │   ├── Add/Edit Address
│   │   ├── Shipping Method Selection
│   │   └── Tax Calculation
│   ├── Payment Options
│   │   ├── Secure Payment
│   │   ├── Trade Assurance
│   │   ├── Payment Methods (Cards, Bank Transfer, etc.)
│   │   ├── Payment Terms (Full/Partial)
│   │   └── Coupon/Promo Code
│   └── Order Review
│       ├── Order Summary
│       ├── Shipping Cost
│       ├── Estimated Delivery
│       └── Confirm Order
│
├── GESTION DES COMMANDES
│   ├── Order List
│   │   ├── Order Status Tracking
│   │   ├── Order History
│   │   ├── Filter by Status
│   │   └── Export Options
│   ├── Order Details
│   │   ├── Order Timeline
│   │   ├── Shipping Tracking
│   │   ├── Invoice Download
│   │   ├── Dispute Management
│   │   └── Return/Refund Request
│   └── RFQ Management (for Buyers)
│       ├── Posted RFQs
│       ├── Supplier Quotes
│       ├── Quote Comparison
│       └── Quote Acceptance
│
├── PROFIL UTILISATEUR (BUYER)
│   ├── My Alibaba (Dashboard Personnel)
│   │   ├── Orders
│   │   ├── Messages
│   │   ├── Favorites
│   │   ├── RFQs
│   │   ├── Inquiry History
│   │   └── Connections
│   ├── Account Settings
│   │   ├── Basic Information
│   │   ├── Address Book
│   │   ├── Password & Security
│   │   ├── Notification Preferences
│   │   ├── Language & Currency
│   │   └── Privacy Settings
│   ├── Buyer Central
│   │   ├── How to Source
│   │   ├── Ecommerce Academy
│   │   ├── Success Stories
│   │   ├── Industry Reports
│   │   └── Webinars
│   └── Membership Programs
│       ├── Subscription Levels
│       ├── Member Benefits
│       ├── Loyalty Points
│       └── Premium Features
│
├── PROFIL FOURNISSEUR (SELLER)
│   ├── Seller Central / Dashboard
│   │   ├── Store Management
│   │   │   ├── Store Settings
│   │   │   ├── Store Design
│   │   │   └── Store Analytics
│   │   ├── Product Management
│   │   │   ├── Product List
│   │   │   ├── Add/Edit Products
│   │   │   ├── Bulk Upload
│   │   │   ├── Inventory Management
│   │   │   └── Product Analytics
│   │   ├── Order Management
│   │   │   ├── Pending Orders
│   │   │   ├── Shipping Management
│   │   │   ├── Fulfillment Status
│   │   │   └── Order Disputes
│   │   ├── Finance
│   │   │   ├── Revenue Dashboard
│   │   │   ├── Payment History
│   │   │   ├── Invoice Management
│   │   │   └── Commission Reports
│   │   ├── Messages & Communication
│   │   │   ├── Buyer Messages
│   │   │   ├── RFQ Responses
│   │   │   └── Automated Responses
│   │   ├── Performance Metrics
│   │   │   ├── Shop Rating
│   │   │   ├── Seller Score
│   │   │   ├── Response Rate
│   │   │   ├── Dispute Rate
│   │   │   └── On-time Delivery Rate
│   │   └── Marketing Tools
│   │       ├── Promotions
│   │       ├── Coupon Management
│   │       ├── Product Advertising
│   │       └── Email Campaigns
│   ├── Product Upload Wizard
│   │   ├── Step 1: Category Selection
│   │   ├── Step 2: Product Information
│   │   │   ├── Title, Description
│   │   │   ├── Images Upload (multiple)
│   │   │   ├── Video Upload
│   │   │   └── Tech Specs Sheet
│   │   ├── Step 3: Variant Configuration
│   │   │   ├── Variant Groups
│   │   │   ├── Attribute Selection
│   │   │   └── Variant-specific pricing
│   │   ├── Step 4: Pricing & MOQ
│   │   ├── Step 5: Shipping Options
│   │   ├── Step 6: Certifications
│   │   └── Step 7: Review & Publish
│   ├── Factory Certification
│   └── Compliance & Tax Settings
│
├── COMMUNICATION
│   ├── Messaging System
│   │   ├── Inbox
│   │   ├── Outbox
│   │   ├── Search Messages
│   │   ├── Archive
│   │   └── Spam Filter
│   ├── RFQ (Request For Quote)
│   │   ├── Post RFQ (for Buyers)
│   │   ├── Browse RFQs (for Suppliers)
│   │   ├── Send Quote
│   │   └── Quote History
│   ├── Notifications
│   │   ├── In-app Notifications
│   │   ├── Email Notifications
│   │   ├── SMS Alerts
│   │   └── WhatsApp Integration
│   └── Support & Dispute Resolution
│       ├── Open Dispute
│       ├── Dispute Messages
│       ├── Dispute Evidence
│       ├── Refund Requests
│       └── Appeal Process
│
├── OUTILS DE SOURCING AVANCÉS
│   ├── Trade Shows & Events
│   │   ├── Online Trade Shows
│   │   ├── Event Calendar
│   │   ├── Live Streaming Events
│   │   └── Exhibitor Listings
│   ├── Sample Center
│   │   ├── Sample Requests
│   │   ├── Sample Gallery
│   │   └── Supplier Samples
│   ├── Dropshipping Center
│   │   ├── Pre-packaged Products
│   │   ├── Dropshipping Suppliers
│   │   ├── Margin Calculator
│   │   └── Bulk Order Options
│   ├── Accio Work (AI Assistant)
│   │   ├── AI-powered Research
│   │   ├── Market Analysis
│   │   ├── Trend Prediction
│   │   └── Supplier Recommendations
│   └── Marketplace Integration
│       ├── Wix Integration
│       ├── Mercado Libre Integration
│       ├── Store Sync
│       └── Order Automation
│
├── RESSOURCES & APPRENDRE
│   ├── Buyer Central
│   ├── Seller Central  
│   ├── Success Stories & Case Studies
│   ├── Industry Reports
│   ├── Webinars & Training
│   ├── Blog & Articles
│   ├── Video Tutorials
│   └── Help Center
│       ├── FAQ
│       ├── Contact Support
│       ├── Live Chat
│       └── Community Forum
│
├── PROGRAMMES SPÉCIALISÉS
│   ├── Alibaba.com Business Edge Credit Card
│   ├── Pay Later for Business
│   ├── Trade Assurance
│   ├── Tax Exemption Program
│   ├── Tax Compliance Program
│   ├── Logistics Services
│   ├── Inspection Services
│   ├── Production Monitoring
│   ├── Quality Certifications
│   └── Letter of Credit
│
├── RÉGIONS SPÉCIALISÉES
│   ├── Source in Europe (EU Pavilion)
│   ├── Source in Türkiye (Turkey Pavilion)
│   ├── China Local Suppliers (China Pavilion)
│   ├── Country-specific Stores
│   └── Regional Customs & Trade Info
│
└── OUTILS & EXTENSIONS
    ├── Mobile App (iOS & Android)
    ├── Browser Extension (Alibaba Lens)
    ├── Desktop Application
    └── API Access (for Integrations)
```

---

# ARCHITECTURE GÉNÉRALE {#architecture-générale}

## Vision à 30,000 pieds

Alibaba.com est une **plateforme B2B omnicanale** avec:

```
┌─────────────────────────────────────────────────────────┐
│                    ALIBABA.COM PLATFORM                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  BUYERS  │  │SUPPLIERS │  │ PLATFORM │              │
│  │(Importers│  │(Exporters│  │(Alibaba) │              │
│  │&Resellers│  │ & OEMs)  │  │ & Alipay │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│         │             │              │                   │
│         └─────────────┼──────────────┘                   │
│                       │                                  │
│         ┌─────────────▼──────────────┐                   │
│         │   CORE MARKETPLACE ENGINE   │                  │
│         │  ─────────────────────────  │                  │
│         │                              │                  │
│         │ • Product Catalog (Multi-   │                  │
│         │   category, Dynamic attrs)  │                  │
│         │ • Search & Discovery (AI)   │                  │
│         │ • Transaction Engine        │                  │
│         │ • Messaging System          │                  │
│         │ • Review & Rating System    │                  │
│         │ • Logistics Integration     │                  │
│         │ • Payment Processing        │                  │
│         │ • Dispute Resolution        │                  │
│         │ • Vendor Management         │                  │
│         └─────────────┬──────────────┘                   │
│                       │                                  │
│         ┌─────────────▼──────────────┐                   │
│         │   SUPPORTING SYSTEMS        │                  │
│         │  ─────────────────────────  │                  │
│         │                              │                  │
│         │ • Trade Services (Assurance)│                  │
│         │ • Financial Services (Loans)│                  │
│         │ • Advertising & Marketing   │                  │
│         │ • Analytics & Intelligence  │                  │
│         │ • Compliance & Verification │                  │
│         │ • International Trade Tools │                  │
│         └────────────────────────────┘                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Stack Technologique Déterminé

### Frontend
- **Framework Principal**: React.js / Vue.js (probablement les deux)
- **Architecture**: Next.js avec SSR/ISR pour SEO
- **State Management**: Redux, Zustand, ou Jotai
- **UI Components**: Design système propriétaire
- **TypeScript**: Utilisé pour la type-safety
- **CSS**: Tailwind CSS + CSS Modules + SCSS/LESS
- **Build Tool**: Webpack, Vite, ou Turbopack
- **Testing**: Jest, React Testing Library, Cypress, Selenium

### Backend
- **API Gateway**: Kong, AWS API Gateway, ou propriétaire
- **Services Principaux**: Node.js/Java/Go microservices
- **Architecture**: Event-driven (Kafka, RabbitMQ)
- **Cache**: Redis (cache distribué, sessions, real-time)
- **Search**: Elasticsearch (pour la recherche de produits)
- **Message Queue**: Kafka/RabbitMQ (pour async tasks)
- **Monitoring**: DataDog, New Relic, ELK Stack

### Base de Données
- **SGBD Principal**: MySQL 8.0+ / PostgreSQL (sharded)
- **NoSQL**: MongoDB, DynamoDB (pour données flexibles)
- **Graph DB**: Neo4j (pour relations utilisateurs/produits)
- **Time-series**: InfluxDB (pour métriques)
- **Caching Layer**: Redis, Memcached

### Infrastructure
- **Hosting**: Alibaba Cloud (interne), AWS, Google Cloud
- **Containerization**: Docker + Kubernetes
- **CDN**: CloudFlare, Akamai (images, assets statiques)
- **Object Storage**: S3/OSS pour images produits
- **Message Brokers**: Apache Kafka (order processing)

### DevOps & Deployment
- **CI/CD**: Jenkins, GitLab CI, GitHub Actions
- **Container Registry**: Docker Hub ou registre privé
- **Monitoring**: Prometheus, Grafana, DataDog
- **Logging**: ELK Stack, Splunk, DataDog
- **APM**: DataDog APM, New Relic, Jaeger

---

# STRUCTURE DE NAVIGATION {#structure-navigation}

## Header Navigation (Fixed)

```
┌──────────────────────────────────────────────────────────────────┐
│                        ALIBABA.COM HEADER                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [Logo]  [Sign in]  [Language] [Currency] [Cart] [Messages] [RFQ]│
│                                                                    │
│  ┌────────────────┬────────────────────────────────────────────┐ │
│  │ [Categories]   │ AI Mode | Products | Manufacturers | Global│ │
│  │ (Mega Menu)    │                                            │ │
│  └────────────────┴────────────────────────────────────────────┘ │
│                                                                    │
│  [Search Input Box] [Advanced Search]                             │
│                                                                    │
│  Secondary Nav:                                                    │
│  Buyers Club | Featured Selections | Trade Services | Seller       │
│  Central | Help Center | App & Extension                           │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Mega Menu (Categories)

Le mega menu est complètement dynamique et peut afficher :

```
CATEGORIES (30+ catégories principales)
│
├── Apparel & Accessories
│   ├── Clothing
│   ├── Shoes
│   ├── Watches & Jewelry
│   └── Eyewear
├── Consumer Electronics
│   ├── Smartphones & Accessories
│   ├── Computers & Peripherals
│   ├── Cameras & Photography
│   └── Home Entertainment
├── Industrial & Manufacturing
│   ├── Machinery
│   ├── Tools & Hardware
│   ├── Components & Parts
│   └── Raw Materials
├── Beauty & Personal Care
├── Home & Garden
├── Automotive & Parts
├── Health & Medical
└── ... (30+ au total)
```

## Sticky Elements During Scroll

- Header reste visible
- Filtres latéraux restent accessibles (sur mobile: drawer)
- "Top" button apparaît en bas à droite
- Chat support widget (bottom right)

---

# MISSION 2: ANALYSE VISUELLE COMPLÈTE {#mission-2-analyse-visuelle}

## 1. PAGE D'ACCUEIL (Homepage)

### Sections et Composants

```
HOME PAGE LAYOUT
┌─────────────────────────────────────────────────────────┐
│                     HERO BANNER                          │
│  (Caroussel animé avec 3-5 images principales)          │
│  CTA: "AI Mode" | "Fast Customization" | "Get Quote"    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           AI MODE CTA SECTION (Prominent)                │
│  "Meet Your AI Sourcing Agent"                           │
│  [Icon] [Description] [Learn More Button]                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│      FEATURED CATEGORIES (Grid 4x3 ou responsive)        │
│                                                           │
│  [Cat 1] [Cat 2] [Cat 3] [Cat 4]                        │
│  [Cat 5] [Cat 6] [Cat 7] [Cat 8]                        │
│  [Cat 9] [Cat 10] [Cat 11] [Cat 12]                     │
│                                                           │
│  Chaque catégorie:                                        │
│  - Image d'arrière-plan                                  │
│  - Titre catégorie (texte blanc sur fond dark)           │
│  - Link onClick → Category Page                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│    "FREQUENTLY SEARCHED" HOT PRODUCTS (Carousel)         │
│                                                           │
│  [Product 1]  [Product 2]  [Product 3]  [Product 4]     │
│     📷          📷            📷            📷           │
│   Product    Product        Product      Product        │
│    Name      Name           Name         Name           │
│  Hot icon                                                │
│                                                           │
│  Swipeable horizontalement, 4 produits visibles          │
│  Navigation: ◀ Carousel ▶                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│    "WHAT ARE YOU LOOKING FOR?" (Search Suggestions)     │
│                                                           │
│    Camera | Wedding Dresses | Handbags | Sunglasses   │
│    Drones | Used Cars | Smart TVs | Electric Cars     │
│    Toys | Electric Motorcycles | ...                   │
│                                                           │
│    Chaque tag est cliquable → SRP pour ce terme         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  "CONNECT WITH 34K+ VERIFIED MANUFACTURERS"             │
│                                                           │
│  [Manufacturer Card 1] [Manufacturer Card 2] [Mfr 3]    │
│                                                           │
│  Par Manufacturer:                                       │
│  - Company Logo                                          │
│  - Company Name                                          │
│  - Verification Badge                                    │
│  - "Industries covered" badge                           │
│  - Link to Profile                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│    "RECOMMENDED FOR YOUR BUSINESS" (Banners)             │
│                                                           │
│  [Premium Banner 1] [Premium Banner 2]                   │
│  - "US Local Stock"                                      │
│  - "5 days Delivery"                                     │
│  - [Explore Button]                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           FOOTER SECTION                                 │
│  (About, Help, Policies, Social, Contact)               │
└─────────────────────────────────────────────────────────┘
```

### Données Dynamiques Affichées

| Composant | Données Sources | Cache TTL | Update Trigger |
|-----------|-----------------|-----------|-----------------|
| Hero Banner | CMS (homepageContent) | 1 hour | Admin update |
| Categories | Category table | 24 hours | Category added |
| Hot Products | Product table + trending metrics | 15 minutes | Views/Sales |
| Suggested Searches | Analytics + trending_searches | 1 hour | Hourly batch |
| Featured Manufacturers | Featured_partnerships + mfr_profiles | 6 hours | Admin feature |

### Responsive Behavior

- **Desktop (1200px+)**: 4 colonnes pour catégories, carousel full-width
- **Tablet (768px-1199px)**: 3 colonnes, carousel 3 items visibles
- **Mobile (< 768px)**: 2 colonnes, carousel 1-2 items visibles, verticale scrolling

---

## 2. PAGE DE RECHERCHE (Search Results Page - SRP)

### Layout Principal

```
SEARCH RESULTS PAGE
┌────────────────────────────────────────────────────────────┐
│ Breadcrumb: Home > Search Results > "smartphone"           │
│ "Showing 1-48 of 50,324 results"                           │
└────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────────────────────┐
│              │                                              │
│   SIDEBAR    │      PRODUCT GRID (48 items per page)       │
│   FILTERS    │                                              │
│              │   [Product] [Product] [Product] [Product]    │
│   ┌────────┐ │   [Product] [Product] [Product] [Product]    │
│   │Category │ │   [Product] [Product] [Product] [Product]    │
│   │ Filter │ │   [Product] [Product] [Product] [Product]    │
│   └────────┘ │   [Product] [Product] [Product] [Product]    │
│              │   [Product] [Product] [Product] [Product]    │
│   ┌────────┐ │                                              │
│   │  Price  │ │   ┌────────────────────────────────────────┐│
│   │ Slider  │ │   │ Pagination: 1 [2] [3] ... [100] Next > ││
│   │ Min-Max │ │   └────────────────────────────────────────┘│
│   └────────┘ │                                              │
│              │                                              │
│   ┌────────┐ │                                              │
│   │ MOQ    │ │                                              │
│   └────────┘ │                                              │
│              │                                              │
│   ┌────────┐ │                                              │
│   │Shipping│ │                                              │
│   │Options │ │                                              │
│   └────────┘ │                                              │
│              │                                              │
│   ┌────────┐ │                                              │
│   │ Rating │ │                                              │
│   └────────┘ │                                              │
│              │                                              │
│   ┌────────┐ │                                              │
│   │Supplier│ │                                              │
│   │Verified│ │                                              │
│   └────────┘ │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Composant Product Card (SRP)

```
┌────────────────────────────┐
│  [Product Image - 250x250] │  ← Lazy loaded with Intersection Observer
│  📷 [More images] 📷        │  ← Hover: show gallery
└────────────────────────────┘
│ PRODUCT TITLE (truncated)   │
│ [Verified Supplier Badge]   │
│                             │
│ ⭐⭐⭐⭐⭐ (327 reviews)      │
│                             │
│ Price: US $1.20 - $2.50     │  ← Dynamic based on MOQ tiers
│ MOQ: 100 pieces             │
│                             │
│ Supply Ability: 50,000/month │
│ Lead Time: 3-5 days         │
│                             │
│ Shipping: Ready to ship     │
│ Tag: "Fast Dispatch"        │
│                             │
│ [Contact Supplier] [Add Cart]│
└────────────────────────────┘
```

### Advanced Filters (Sidebar Left)

```
FILTERS PANEL
├── Category (Tree expandable)
│   ├── Phones & Phone Accessories (1,234)
│   │   ├── Smartphones (890)
│   │   ├── Phone Cases (344)
│   │   └── Screen Protectors (234)
│   ├── Laptop & Desktop (456)
│   └── Other Electronics (890)
│
├── Price Range
│   ├── Custom: [Min] ---- [Max] USD
│   ├── < $5 (1,200)
│   ├── $5-$10 (2,300)
│   ├── $10-$20 (3,400)
│   └── > $20 (1,224)
│
├── Supplier Type
│   ├── ☑ Verified Supplier (40,234)
│   ├── ☑ Gold Supplier (2,340)
│   └── ☑ Certified Supplier (890)
│
├── MOQ Range
│   ├── < 50 pieces (15,600)
│   ├── 50-100 pieces (8,900)
│   ├── 100-500 pieces (12,340)
│   └── > 500 pieces (13,484)
│
├── Shipping
│   ├── ☑ Ready to Ship (35,000)
│   ├── ☑ Made to Order (12,000)
│   └── ☑ Drop Shipping Available (3,000)
│
├── Certifications
│   ├── ☑ CE (2,300)
│   ├── ☑ FCC (1,900)
│   ├── ☑ RoHS (1,200)
│   └── ☑ ISO 9001 (2,100)
│
├── Lead Time
│   ├── ☑ 1-3 days (5,000)
│   ├── ☑ 4-7 days (15,000)
│   ├── ☑ 8-15 days (20,000)
│   └── ☑ 16+ days (10,324)
│
├── Rating
│   ├── ⭐⭐⭐⭐⭐ 4.5+ (25,000)
│   ├── ⭐⭐⭐⭐ 3.5-4.5 (18,000)
│   └── ⭐⭐⭐ 2.5-3.5 (7,324)
│
└── More Filters (expandable)
    ├── Colors
    ├── Materials
    ├── Sizes
    ├── Standards
    ├── Production Capacity
    └── Trade Assurance

SORT OPTIONS (Top Right)
├── Most Relevant
├── Newest Listings
├── Lowest Price
├── Highest Price
├── Most Reviewed
├── Best Rated
└── Best Sales Volume
```

---

## 3. PAGE PRODUIT DÉTAILLÉE {#page-produit-details}

### Layout Principal

```
PRODUCT DETAIL PAGE (PDP)
┌────────────────────────────────────────────────────────────┐
│ Breadcrumb: Home > Category > Subcategory > Product Name    │
└────────────────────────────────────────────────────────────┘

┌────────────────────┬────────────────────────────────────────┐
│                    │                                        │
│   LEFT SECTION     │      RIGHT SECTION (Sticky on scroll)  │
│   (Image Gallery)  │      (Product Info & Buying)           │
│                    │                                        │
│  ┌──────────────┐  │  ┌──────────────────────────────────┐  │
│  │              │  │  │ Product Title (max 100 chars)     │  │
│  │   MAIN       │  │  │ ⭐⭐⭐⭐⭐ 327 reviews  |  2.1K+ sold  │
│  │   IMAGE      │  │  │ [Verified Supplier Badge]         │  │
│  │  (400x400)   │  │  │                                   │  │
│  │   Zoomable   │  │  │ Price Display:                    │  │
│  │    +         │  │  │ ┌─────────────────────────────┐  │  │
│  │   360 View   │  │  │ │ US$ 1.50 - 2.50 per piece   │  │  │
│  │              │  │  │ │ (Price tiers by quantity)   │  │  │
│  │              │  │  │ └─────────────────────────────┘  │  │
│  └──────────────┘  │  │                                   │  │
│                    │  │ MOQ: 100 pieces                   │  │
│  [Thumb] [Thumb]   │  │ Stock: 50,000 available           │  │
│  [Thumb] [Thumb]   │  │                                   │  │
│  [Thumb] [Thumb]   │  │ ▼ VARIANTS SELECTOR               │  │
│  [Video icon]      │  │ ┌─────────────────────────────┐  │  │
│  [360 icon]        │  │ │ Color: [Red] [Blue] [Green] │  │  │
│  [More]            │  │ │ Size: [S] [M] [L] [XL]      │  │  │
│                    │  │ │ Material: [Cotton] [Polyester]│ │  │
│                    │  │ │ Quantity: [1___] (min: 100)  │  │  │
│                    │  │ └─────────────────────────────┘  │  │
│                    │  │                                   │  │
│                    │  │ ┌─────────────────────────────┐  │  │
│                    │  │ │ [Add to Cart] [Buy Now]     │  │  │
│                    │  │ │ [Add to Favorites] [Share]  │  │  │
│                    │  │ └─────────────────────────────┘  │  │
│                    │  │                                   │  │
│                    │  │ ▼ SUPPLIER INFO (Compact)         │  │
│                    │  │ Logo | Company Name | Verified   │  │
│                    │  │ Response Time: 2-4 hours         │  │
│                    │  │ Positive Feedback: 98.3%         │  │
│                    │  │ [View Store Profile]             │  │
│                    │  │                                   │  │
│                    │  │ ▼ SHIPPING & LOGISTICS            │  │
│                    │  │ Lead Time: 3-5 days              │  │
│                    │  │ Shipping Methods: [Air] [Sea]    │  │
│                    │  │ Ready to ship                     │  │
│                    │  │                                   │  │
│                    │  │ ▼ CERTIFICATIONS                  │  │
│                    │  │ [CE] [FCC] [ISO 9001] [RoHS]     │  │
│                    │  │                                   │  │
│                    │  │ Trade Assurance Guarantee         │  │
│                    │  │ Money Back Guarantee              │  │
│                    │  │ On-time Delivery                  │  │
│                    │  └──────────────────────────────┘  │  │
│                    │                                        │
└────────────────────┴────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              PRODUCT DETAILS TABS                           │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ [SPECIFICATION] [SHIPPING INFO] [REVIEWS] [FAQ]  [MORE]    │
│                                                              │
│ SPECIFICATION TAB CONTENT:                                  │
│                                                              │
│ ┌─ Technical Specifications                                 │
│ │ Material: 100% Cotton                                     │
│ │ Color: Red, Blue, Green                                   │
│ │ Size: S, M, L, XL, XXL                                   │
│ │ Weight: 200g                                              │
│ │ Dimensions: 30x40x10 cm                                   │
│ │ Package: Gift Box                                         │
│ │ MOQ: 100 pieces                                          │
│ │ Port of Loading: Shanghai                                │
│ │                                                            │
│ ├─ OEM/ODM Services                                         │
│ │ ☑ OEM available                                          │
│ │ ☑ Customization available                                │
│ │ ☑ Logo printing available                                │
│ │                                                            │
│ └─ Sample Information                                       │
│   Sample cost: $5 per piece                                │
│   Sample lead time: 3 days                                 │
│   [Request Sample]                                          │
│                                                              │
│ SHIPPING INFO TAB:                                          │
│ Lead Time Table:                                            │
│ ┌─────────────────┬──────────────┬──────────────┐          │
│ │ Order Quantity  │ Lead Time    │ Shipping     │          │
│ ├─────────────────┼──────────────┼──────────────┤          │
│ │ 100-500         │ 3-5 days     │ Air/Sea      │          │
│ │ 500-1000        │ 5-7 days     │ Air/Sea      │          │
│ │ 1000+           │ 7-10 days    │ Sea Only     │          │
│ └─────────────────┴──────────────┴──────────────┘          │
│                                                              │
│ Shipping Cost Calculator:                                   │
│ Port: [Shanghai Port] | Method: [Sea Freight]               │
│ To: [Select Country] | Volume: [Cubic Meters]               │
│ → Estimated Cost: $0.50/kg or $500 per shipment             │
│                                                              │
│ REVIEWS TAB:                                                │
│ Overall Rating: ⭐⭐⭐⭐⭐ 4.8 out of 5                       │
│ (Based on 327 verified buyer reviews)                       │
│                                                              │
│ Filter Reviews:                                             │
│ [All] [⭐⭐⭐⭐⭐] [⭐⭐⭐⭐] [⭐⭐⭐] [⭐⭐] [⭐]               │
│ [With Photo] [Verified Buyers Only]                         │
│                                                              │
│ ┌─ Review 1                                                 │
│ │ ⭐⭐⭐⭐⭐ "Great product! Fast shipping!"                  │
│ │ John D. | USA | 2 months ago | Verified Buyer             │
│ │ Order: 500 pieces | Blue Color | Size M                   │
│ │ [👍 Helpful] [💬 Reply]                                   │
│ │ Seller Response: "Thank you for the great review!"        │
│ │                                                            │
│ ├─ Review 2                                                 │
│ │ ⭐⭐⭐⭐ "Good quality, would recommend"                    │
│ │ ...                                                        │
│ │                                                            │
│ └─ More Reviews [Load More]                                │
│                                                              │
│ FAQ TAB:                                                    │
│ Q: What's the MOQ?                                          │
│ A: Minimum 100 pieces for this product                      │
│                                                              │
│ Q: Do you offer customization?                              │
│ A: Yes, we support OEM/ODM services...                      │
│                                                              │
│ MORE TAB:                                                   │
│ • Recommended Products                                      │
│ • You May Also Like                                         │
│ • Company Information                                       │
│                                                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│         RELATED & RECOMMENDED PRODUCTS SECTION               │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ ▶ Similar Products (8 products caroussel)                   │
│   [Product] [Product] [Product] [Product] ◀ ▶              │
│                                                              │
│ ▶ Customers Also Viewed (8 products caroussel)             │
│   [Product] [Product] [Product] [Product] ◀ ▶              │
│                                                              │
│ ▶ Customers Also Bought (8 products caroussel)             │
│   [Product] [Product] [Product] [Product] ◀ ▶              │
│                                                              │
│ ▶ Products from This Supplier (8 products grid)            │
│   [Product] [Product] [Product] [Product]                   │
│   [Product] [Product] [Product] [Product]                   │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Product Detail Comportements Dynamiques

1. **Images Gallery**:
   - Main image (400x400px) avec zoom on hover (2x magnification)
   - Thumbnails scroll-able (max 6 visibles)
   - 360° view si disponible (player interactif)
   - Video preview si fourni
   - Lazy loading des thumbnails

2. **Price Calculation**:
   ```javascript
   // Pseudo-code pour calcul dynamique du prix
   const getTierPrice = (productId, selectedVariant, quantity) => {
     const priceTiers = db.priceTiers.find({
       productId,
       variantId: selectedVariant.id
     });
     
     const applicableTier = priceTiers.filter(tier =>
       quantity >= tier.minQty && quantity <= tier.maxQty
     )[0];
     
     return {
       unitPrice: applicableTier.price,
       totalPrice: applicableTier.price * quantity,
       savings: calculateSavings(quantity)
     };
   };
   ```

3. **Variant Selection Impact**:
   - Mise à jour TEMPS RÉEL du prix
   - Images change selon variant sélectionné
   - Stock update in real-time
   - Shipping options update

4. **Sticky Sidebar on Scroll**:
   - Reste visible après 200px scroll
   - Sticky jusqu'à section "Related Products"
   - Mobile: revient à normal layout

---

## 4. PAGE PANIER (Shopping Cart)

```
SHOPPING CART PAGE
┌────────────────────────────────────────────────────────────┐
│ Cart: 3 items (Total: USD $456.78)                         │
│ [Continue Shopping] [Checkout]                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────┬────────────────────────────────────────┐
│                    │                                        │
│   CART ITEMS       │      ORDER SUMMARY (Sticky)            │
│                    │                                        │
│  ┌────────────────┐│  ┌──────────────────────────────────┐ │
│  │ PRODUCT 1      ││  │ ORDER SUMMARY                     │ │
│  ├────────────────┤│  ├──────────────────────────────────┤ │
│  │ Image | Details││  │ Subtotal: USD $400.00              │ │
│  │        │       ││  │                                   │ │
│  │ Color: Red     ││  │ Shipping Estimate:                │ │
│  │ Qty: 100       ││  │ [Select Country] → USD $50.00     │ │
│  │ Unit: $2.00    ││  │                                   │ │
│  │ Total: $200.00 ││  │ Tax (estimated): USD $6.78        │ │
│  │                ││  │                                   │ │
│  │ [Edit] [×Remove]││  │ ─────────────────────────────    │ │
│  └────────────────┘│  │ Total: USD $456.78                │ │
│                    │  │                                   │ │
│  ┌────────────────┐│  │ ⚠ MOQ Warning:                    │ │
│  │ PRODUCT 2      ││  │ Product 1: Min 100 ✓ (100)        │ │
│  ├────────────────┤│  │ Product 2: Min 50 ✓ (200)         │ │
│  │ Image | Details││  │                                   │ │
│  │ ...            ││  │ ✓ Ready to Checkout               │ │
│  │                ││  │                                   │ │
│  │ [Edit] [×Remove]││  │ [Proceed to Checkout]             │ │
│  └────────────────┘│  │ [Continue Shopping]               │ │
│                    │  │                                   │ │
│  ┌────────────────┐│  │ Apply Promo Code:                 │ │
│  │ PRODUCT 3      ││  │ [______] [Apply]                  │ │
│  ├────────────────┤│  │                                   │ │
│  │ ...            ││  │ Save for Later (0 items)           │ │
│  │                ││  │ Saved Items: [Item]               │ │
│  │ [Edit] [×Remove]││  │                                   │ │
│  └────────────────┘│  └──────────────────────────────────┘ │
│                    │                                        │
│ [Save for Later]   │                                        │
│ [Continue Shopping]│                                        │
│                    │                                        │
└────────────────────┴────────────────────────────────────────┘
```

---

## 5. PAGE CHECKOUT (Payment & Shipping)

```
CHECKOUT PAGE (3 STEPS)

STEP 1: SHIPPING ADDRESS
┌────────────────────────────────────────────────────────────┐
│ ▶ 1. Shipping Address | 2. Shipping Method | 3. Payment    │
│                                                              │
│ Deliver to:                                                 │
│ [Address Book Dropdown] [+ Add New Address]                │
│                                                              │
│ OR Manual Entry:                                            │
│ Country: [Select Country ▼]                                 │
│ State/Province: [______________]                            │
│ City: [______________]                                      │
│ Postal Code: [______________]                               │
│ Street Address: [______________]                            │
│ Building/Apt: [______________] (Optional)                   │
│                                                              │
│ [Save Address] [Back] [Next →]                              │
└────────────────────────────────────────────────────────────┘

STEP 2: SHIPPING METHOD & COST
┌────────────────────────────────────────────────────────────┐
│ ▶ 1. Shipping Address | 2. Shipping Method | 3. Payment    │
│                                                              │
│ Shipping Methods Available:                                 │
│                                                              │
│ ◉ [Air Freight]                                             │
│   Estimated Delivery: 5-7 days                              │
│   Cost: USD $50.00 per shipment                             │
│   [Details]                                                 │
│                                                              │
│ ○ [Sea Freight]                                             │
│   Estimated Delivery: 15-20 days                            │
│   Cost: USD $25.00 per shipment                             │
│   [Details]                                                 │
│                                                              │
│ ○ [Express]                                                 │
│   Estimated Delivery: 2-3 days                              │
│   Cost: USD $150.00 per shipment                            │
│   [Details]                                                 │
│                                                              │
│ Insurance: ☐ Add Cargo Insurance (USD $5.00)               │
│                                                              │
│ [Back] [Next →]                                             │
└────────────────────────────────────────────────────────────┘

STEP 3: PAYMENT & ORDER REVIEW
┌────────────────────────────────────────────────────────────┐
│ ▶ 1. Shipping Address | 2. Shipping Method | 3. Payment    │
│                                                              │
│ ORDER SUMMARY:                                              │
│ Subtotal: USD $456.78                                       │
│ Shipping: USD $50.00                                        │
│ Tax: USD $6.78                                              │
│ ─────────────────                                           │
│ Total: USD $513.56                                          │
│                                                              │
│ PAYMENT METHOD:                                             │
│                                                              │
│ ◉ [Secure Payment] (Recommended)                            │
│   Credit Card / PayPal / Alibaba Pay                        │
│   With Trade Assurance Protection                           │
│   [Payment Details]                                         │
│                                                              │
│ ○ [Bank Transfer]                                           │
│   T/T Payment (Terms: 30% deposit, 70% before shipment)    │
│                                                              │
│ ○ [Letter of Credit (L/C)]                                  │
│                                                              │
│ Trade Assurance: [Learn More]                               │
│ ✓ Refund if not shipped                                     │
│ ✓ Money back guarantee                                      │
│                                                              │
│ Accept Terms: ☑ I agree to the Terms of Service             │
│                                                              │
│ [Back] [Place Order]                                        │
└────────────────────────────────────────────────────────────┘

ORDER CONFIRMATION
┌────────────────────────────────────────────────────────────┐
│ ✓ Your order has been placed successfully!                 │
│                                                              │
│ Order Number: #ALB-2024-1234567                             │
│ Expected Delivery: July 15, 2024                            │
│                                                              │
│ Tracking Number: [Track Online]                             │
│ Supplier: [Acme Factory Ltd]                                │
│                                                              │
│ Total: USD $513.56                                          │
│                                                              │
│ [Download Invoice] [View Order Details] [Contact Supplier] │
│                                                              │
│ [Back to Home] [Continue Shopping]                          │
└────────────────────────────────────────────────────────────┘
```

---

## 6. PROFIL UTILISATEUR & MY ALIBABA

```
MY ALIBABA DASHBOARD
┌────────────────────────────────────────────────────────────┐
│ Hello, John D. | [Account] [Notifications] [Messages] [Help]│
└────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────────┐
│                  │                                          │
│   SIDEBAR NAV    │    MAIN CONTENT AREA                     │
│                  │                                          │
│ ▶ My Orders      │  My Orders                               │
│   - All Orders   │  Filter: [All] [Pending] [Shipped] [Rcvd]│
│   - Pending      │                                          │
│   - Shipped      │  ┌──────────────────────────────────┐   │
│   - Received     │  │ Order #ALB-001                   │   │
│   - Cancelled    │  │ Status: Shipped                  │   │
│                  │  │ Supplier: Acme Factory Ltd       │   │
│ ▶ Favorites      │  │ Total: USD $250.00               │   │
│   - Saved Items  │  │ Tracking: [.../track]            │   │
│   - Saved Sellers│  │ Est. Delivery: July 15, 2024     │   │
│   - Saved Designs│  │ [Track] [Message Supplier]       │   │
│                  │  └──────────────────────────────────┘   │
│ ▶ Messages       │                                          │
│   - Inbox (5)    │  [Load More Orders]                      │
│   - Sent         │                                          │
│   - Archived     │  ─────────────────────────────────────   │
│                  │                                          │
│ ▶ RFQs          │  Quick Actions:                           │
│   - Posted RFQs │  [Place New Order] [Upload Bulk File]     │
│   - Responses    │  [Request Sample] [Get Quote]            │
│   - History      │                                          │
│                  │                                          │
│ ▶ Connections    │  Analytics (Last 30 Days):               │
│                  │  Total Spend: USD $5,234                │
│ ▶ Settings       │  Orders Placed: 12                       │
│   - Profile      │  Suppliers Connected: 8                  │
│   - Addresses    │  Messages Sent: 34                       │
│   - Preferences  │                                          │
│   - Security     │                                          │
│   - Privacy      │                                          │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

---

**[DOCUMENT CONTINUE À LA PARTIE SUIVANTE...]**

Pour éviter de dépasser les limites, créons la deuxième partie du document qui couvre les données, attributs dynamiques, et la base de données.
