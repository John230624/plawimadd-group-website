// C:\xampp\htdocs\plawimadd_group\lib\types.ts

import type { useRouter } from 'next/navigation';

// --- Définition des Enums ALIGNÉES AVEC schema.prisma et l'API ---

// Ces enums doivent correspondre exactement à celles définies dans votre prisma/schema.prisma
// et aux valeurs utilisées dans votre logique API et frontend.
export enum OrderStatus {
    PENDING = 'PENDING',
    PAID_SUCCESS = 'PAID_SUCCESS',
    PAYMENT_FAILED = 'PAYMENT_FAILED', // Cette valeur est dans OrderStatus de Prisma
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    ON_HOLD = 'ON_HOLD',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED', // Seule 'FAILED' est dans PaymentStatus de schema.prisma
    REFUNDED = 'REFUNDED',
    // PAYMENT_FAILED = "PAYMENT_FAILED", // <-- SUPPRIMÉ car n'existe PAS dans PaymentStatus de schema.prisma
}

// Enum pour les rôles utilisateur, utilisée dans l'interface User.
// Assurez-vous que les valeurs ('USER', 'ADMIN', 'SELLER') correspondent à celles de votre base de données.
export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    // SELLER = 'SELLER', // Décommentez si vous utilisez un rôle 'SELLER'
}

export enum StudentInstallmentRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

// --- INTERFACES DE BASE ---

/**
 * @interface Product Représente un produit dans la base de données.
 * Les prix sont des nombres pour le frontend, convertis de Decimal par le backend.
 * imgUrl est un tableau de chaînes.
 */
export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    offerPrice: number | null;
    stock: number;
    imgUrl: string[]; // DOIT être un tableau de chaînes, comme renvoyé par parsePrismaImgUrl
    createdAt: Date | string; // Peut être une Date ou un string ISO
    updatedAt: Date | string; // Peut être une Date ou un string ISO
    category: {
        id: string;
        name: string;
    };
    rating?: number | null;
    brand?: string | null;
    color?: string | null;
}

/**
 * @type ProductsApiResponse Structure de la réponse de l'API /api/products
 */
export type ProductsApiResponse = { success: boolean; data: Product[] };

/**
 * @type OrdersApiResponse Structure de la réponse de l'API des commandes.
 * Flexible pour s'adapter à différents formats de réponse (ex: direct array ou wrapped object).
 */
export type OrdersApiResponse = { success: boolean; data: Order[] } | { orders: Order[] } | Order[];


/**
 * @interface User Représente les données d'un utilisateur, aligné avec NextAuth et la DB.
 */
export interface User {
    id: string;
    name?: string | null; // Généralement fullName ou alias
    email?: string | null;
    image?: string | null; // URL de l'image de profil
    firstName?: string;
    lastName?: string;
    role?: UserRole; // Utilise l'enum UserRole
    token?: string; // Token d'authentification si géré manuellement ou via session
    phoneNumber?: string | null; // Peut être optionnel et nullable
}

/**
 * @interface OrderItemForCreatePayload Représente la structure d'un article de commande
 * lors de la création d'une commande (payload envoyé au backend).
 */
export interface OrderItemForCreatePayload {
    productId: string;
    quantity: number;
    price: number; // Le prix unitaire au moment de l'ajout au panier/checkout
}

/**
 * @interface OrderItemForDisplay Représente un article de commande tel qu'il est reçu
 * du backend pour l'affichage (inclut les détails complets du produit).
 * ALIGNÉ AVEC LA SORTIE DE /api/admin/orders.
 */
export interface OrderItemForDisplay {
    productId: string;
    quantity: number;
    priceAtOrder: number; // Le prix unitaire au moment où la commande a été passée
    product: { // Détails du produit inclus depuis la relation Prisma dans l'API admin
        id: string; // Ajouté: L'ID du produit
        name: string;
        imgUrl: string[]; // CORRIGÉ: DOIT être un tableau de chaînes
        price: number; // Ajouté: Prix normal du produit
        offerPrice: number | null; // Ajouté: Prix promotionnel du produit
    };
}

/**
 * @interface Address Représente une adresse de livraison/facturation.
 */
export interface Address {
    id?: number; // L'ID d'adresse est un INT dans schema.prisma
    userId: string;
    fullName: string;
    phoneNumber: string;
    pincode: string | null;
    area: string;
    city: string;
    state: string;
    isDefault: boolean;
    street?: string; // Optionnel selon votre schema
    country: string; // Obligatoire selon votre schema
}

/**
 * @interface CreateOrderPayload Représente le payload envoyé pour créer une nouvelle commande.
 * MISE À JOUR : Ajout des champs Kkiapay pour la création de commande après paiement.
 */
export interface CreateOrderPayload {
    id: string; // L'ID de transaction Kkiapay généré par le frontend, qui sera aussi l'ID de la commande
    items: OrderItemForCreatePayload[]; // Utilise le type spécifique pour la création
    totalAmount: number;
    shippingAddress: Address; // Utilisation de Address pour la clarté
    paymentMethod: string;
    userEmail: string; // Assurez-vous que ce champ est 'string' et non 'string | null'
    userPhoneNumber: string | null; // Rendu nullable
    currency: string;
    // NOUVELLES PROPRIÉTÉS POUR LES DÉTAILS DE TRANSACTION KKIAPAY
    kkiapayTransactionId?: string;
    kkiapayPaymentMethod?: string;
    kkiapayAmount?: number;
    kkiapayStatus?: string;
}

/**
 * @interface Order Représente une commande complète, ALIGNÉE AVEC LA SORTIE DE /api/admin/orders.
 */
export interface Order {
    id: string; // L'ID de la commande est le kkiapayTransactionId dans votre DB
    userId: string;
    userName: string; // AJOUTÉ: Renommé de user.firstName + user.lastName
    userEmail: string;
    userPhoneNumber: string | null; // Rendu nullable
    totalAmount: number; // Converti en nombre par l'API
    status: OrderStatus; // Utilise l'enum OrderStatus
    paymentStatus: PaymentStatus; // Utilise l'enum PaymentStatus (du modèle Payment ou de Order)
    orderDate: string; // String ISO pour la date de commande
    shippingAddressLine1: string;
    shippingAddressLine2: string | null;
    shippingCity: string;
    shippingState: string;
    shippingZipCode: string | null;
    shippingCountry: string;
    currency: string;
    orderItems: OrderItemForDisplay[]; // Utilise le type corrigé pour l'affichage
    paymentMethod: string | null; // Méthode de paiement (ex: "Kkiapay")
    transactionId: string | null; // L'ID de transaction Kkiapay réel
    paymentDate: string | null; // AJOUTÉ: Date du paiement (string ISO ou null)
    createdAt: Date | string; // Dates d'horodatage de Prisma
    updatedAt: Date | string; // Dates d'horodatage de Prisma
    shippingAddressId?: number | null; // L'ID d'adresse est un INT dans schema.prisma, peut être optionnel
    shippingAddress?: Address | null; // La relation complète si incluse
}

export interface StudentInstallmentRequest {
    id: string;
    userId: string;
    fullName: string;
    phoneNumber: string;
    schoolName: string;
    studentEmail: string;
    studentIdNumber: string;
    requestedMonths: number;
    documentUrl: string;
    notes?: string | null;
    status: StudentInstallmentRequestStatus;
    adminNote?: string | null;
    reviewedAt?: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    user?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    } | null;
}

export type NextRouter = ReturnType<typeof useRouter>;

/**
 * @interface AppContextType Contexte global de l'application.
 */
export interface AppContextType {
    products: Product[];
    loadingProducts: boolean;
    errorProducts: string | null;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    filteredProducts: Product[];
    cartItems: Record<string, number>;
    addToCart: (productId: string) => Promise<boolean>;
    removeFromCart: (productId: string) => Promise<boolean>;
    deleteFromCart: (productId: string) => Promise<boolean>;
    updateCartQuantity: (productId: string, quantity: number) => Promise<boolean>;
    getCartCount: () => number;
    getCartAmount: () => number;
    currency: string;
    formatPrice: (price: number) => string;
    url: string;
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    isLoggedIn: boolean;
    userOrders: Order[];
    loadingOrders: boolean;
    errorFetchingOrders: string | null;
    userAddresses: Address[];
    loadingAddresses: boolean;
    errorFetchingAddresses: string | null;
    fetchUserOrders: () => Promise<void>;
    fetchUserAddresses: () => Promise<void>;
    router: NextRouter;
    clearCart: () => void;
    deliveryFee: number;
    setDeliveryFee: (fee: number) => void;
    loadCartData: () => Promise<void>;
    loadingCart: boolean;
    fetchProducts: () => Promise<void>;
    wishlistItems: string[];
    toggleWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    getWishlistCount: () => number;
}
