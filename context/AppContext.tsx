// context/AppContext.tsx
'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode
} from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

import {
    Product,
    Address,
    Order,
    User,
    AppContextType,
    ProductsApiResponse,
    OrdersApiResponse,
} from '@/lib/types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const { data: session, status } = useSession();

    // CORRECTION MAJEURE ICI: Définir l'URL de base de manière dynamique et robuste.
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        // Détermination de l'URL de base pour les appels API
        if (typeof window !== 'undefined') {
            // Côté client (dans le navigateur), utilisez l'origine de la fenêtre actuelle.
            // C'est la méthode la plus fiable pour gérer les URL de prévisualisation Vercel et les domaines personnalisés.
            setBaseUrl(window.location.origin);
        } else if (process.env.VERCEL_URL) {
            // Côté serveur (pour le build ou SSR si ce contexte était utilisé en SSR),
            // utilisez la variable d'environnement VERCEL_URL.
            setBaseUrl(`https://${process.env.VERCEL_URL}`);
        } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
            // Alternative si VERCEL_URL n'est pas disponible ou si vous préférez une clé publique
            setBaseUrl(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`);
        } else {
            // Fallback pour le développement local
            setBaseUrl('http://localhost:3000');
        }
    }, []); // Ce useEffect ne dépend de rien, il s'exécute une seule fois au montage

    const currency = 'XOF' as const;

    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [cartItems, setCartItems] = useState<Record<string, number>>({});
    const [wishlistItems, setWishlistItems] = useState<string[]>([]);
    const [loadingCart, setLoadingCart] = useState(true);
    const [initialCartLoaded, setInitialCartLoaded] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [errorFetchingOrders, setErrorFetchingOrders] = useState<string | null>(null);
    const [initialOrdersLoaded, setInitialOrdersLoaded] = useState(false);

    const [userAddresses, setUserAddresses] = useState<Address[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [errorFetchingAddresses, setErrorFetchingAddresses] = useState<string | null>(null);
    const [initialAddressesLoaded, setInitialAddressesLoaded] = useState(false);

    const [deliveryFee, setDeliveryFee] = useState(0);

    const formatPriceInFCFA = useCallback((price: number): string => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(price);
    }, [currency]);

    useEffect(() => {
        console.log("[AppContext] Session status changed:", status);
        if (status === 'authenticated' && session?.user) {
            // CORRECTION: Suppression des casts 'as any'
            // Ces propriétés doivent être correctement typées via la déclaration de module NextAuth.
            const userFromSession: User = {
                id: String(session.user.id),
                name: session.user.name || null,
                email: session.user.email || null,
                image: session.user.image || null,
                role: session.user.role || 'USER',
                firstName: session.user.firstName || '', // Nécessite l'extension du type Session
                lastName: session.user.lastName || '' // Nécessite l'extension du type Session
            };
            setCurrentUser(userFromSession);
            setIsLoggedIn(true);
            // Réinitialiser les drapeaux de chargement initial lors d'une nouvelle authentification
            setInitialOrdersLoaded(false);
            setInitialAddressesLoaded(false);
            setInitialCartLoaded(false);
            console.log("[AppContext] User authenticated:", userFromSession.id);
        } else if (status === 'unauthenticated') {
            console.log("[AppContext] User unauthenticated, clearing data.");
            setCurrentUser(null);
            setIsLoggedIn(false);
            setCartItems({});
            setUserOrders([]);
            setUserAddresses([]);
            localStorage.removeItem('cartItems');
            // Réinitialiser les drapeaux de chargement initial lors de la déconnexion
            setInitialOrdersLoaded(false);
            setInitialAddressesLoaded(false);
            setInitialCartLoaded(false);
        }
    }, [session, status]);

    const fetchProducts = useCallback(async () => {
        // Attendre que baseUrl soit défini avant de faire l'appel API
        if (!baseUrl) {
            console.log("[AppContext] fetchProducts: baseUrl not yet defined, skipping fetch.");
            return;
        }
        setLoadingProducts(true);
        setErrorProducts(null);
        try {
            // Utilisation de baseUrl ici pour tous les appels API
            const response = await axios.get<ProductsApiResponse>(`${baseUrl}/api/products`);
            console.log("[AppContext] Products API raw response:", response.data);

            let productsData: Product[] = [];

            if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
                productsData = response.data.data;
                console.log("[AppContext] Products API: Detected object with 'data' array.");
            }
            else if (Array.isArray(response.data)) {
                productsData = response.data;
                console.log("[AppContext] Products API: Detected direct array response (fallback).");
            }
            else if (response.data && typeof response.data === 'object' && 'products' in response.data && Array.isArray(response.data.products)) {
                productsData = (response.data as { products: Product[] }).products;
                console.log("[AppContext] Products API: Detected object with 'products' array (fallback).");
            }
            else {
                console.warn("[AppContext] Products API: Unexpected response format. Expected { success: true, data: Product[] } or Product[].", response.data);
                setErrorProducts("Format de données de produits inattendu de l'API.");
                setProducts([]);
                setFilteredProducts([]);
                setLoadingProducts(false);
                return;
            }

            const validProducts = productsData.map(product => ({
                ...product,
                id: String(product.id),
                imgUrl: Array.isArray(product.imgUrl)
                    ? product.imgUrl
                    : (product.imgUrl ? [product.imgUrl] : ['/placeholder.jpg'])
            }));
            setProducts(validProducts);
            setFilteredProducts(validProducts);
            console.log(`[AppContext] Successfully loaded ${validProducts.length} products.`);

        } catch (error: unknown) {
            console.error('Error fetching products:', error);
            setErrorProducts(
                axios.isAxiosError(error)
                    ? error.response?.data?.message || error.message
                    : (error instanceof Error ? error.message : 'Failed to load products')
            );
        } finally {
            setLoadingProducts(false);
        }
    }, [baseUrl]); // Dépendance à baseUrl

    const loadCartData = useCallback(async () => {
        // Attendre que baseUrl soit défini avant de faire l'appel API
        if (!baseUrl) {
            console.log("[AppContext] loadCartData: baseUrl not yet defined, skipping API fetch.");
            setLoadingCart(false);
            setInitialCartLoaded(true);
            return;
        }

        setLoadingCart(true);
        if (!isLoggedIn || !currentUser?.id) {
            try {
                const savedCart = localStorage.getItem('cartItems');
                setCartItems(savedCart ? JSON.parse(savedCart) : {});
                console.log("Loaded cart from localStorage for unauthenticated user.");
            } catch (error: unknown) {
                console.error("Error loading cart from localStorage for unauthenticated user", error);
                setCartItems({});
            } finally {
                setLoadingCart(false);
                setInitialCartLoaded(true);
            }
            return;
        }

        try {
            const response = await axios.get<{ cartItems: { productId: string; quantity: number }[] }>(
                `${baseUrl}/api/cart/${currentUser.id}`
            );

            if (response.data?.cartItems) {
                const normalizedCartItems: Record<string, number> = {};
                response.data.cartItems.forEach(item => {
                    normalizedCartItems[String(item.productId)] = item.quantity;
                });
                setCartItems(normalizedCartItems);
                localStorage.setItem('cartItems', JSON.stringify(normalizedCartItems));
            } else {
                setCartItems({});
                localStorage.removeItem('cartItems');
            }
        } catch (error: unknown) {
            console.error("Error loading cart from API:", error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    toast.error("Session expirée, veuillez vous reconnecter");
                    router.push('/login');
                }
            }
            try {
                const savedCart = localStorage.getItem('cartItems');
                setCartItems(savedCart ? JSON.parse(savedCart) : {});
                console.log("Loaded cart from localStorage after API error.");
            } catch (localError: unknown) {
                console.error("Error loading cart from localStorage after API error", localError);
                setCartItems({});
            }
        } finally {
            setLoadingCart(false);
            setInitialCartLoaded(true);
        }
    }, [isLoggedIn, currentUser?.id, baseUrl, router]); // Dépendance à baseUrl

    const updateCartOnServer = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
        // Attendre que baseUrl soit défini avant de faire l'appel API
        if (!baseUrl) {
            console.log("[AppContext] updateCartOnServer: baseUrl not yet defined, skipping API update.");
            return false;
        }

        if (!isLoggedIn || !currentUser?.id) {
            return false;
        }

        try {
            await axios.put(
                `${baseUrl}/api/cart/${currentUser.id}`,
                { productId, quantity }
            );
            return true;
        } catch (error: unknown) {
            console.error("Error updating cart on server:", error);
            const previousCart = JSON.parse(localStorage.getItem('cartItems') || '{}');
            setCartItems(previousCart);
            toast.error("Erreur de synchronisation du panier avec le serveur. Réessayez.");
            return false;
        }
    }, [baseUrl, isLoggedIn, currentUser?.id]); // Dépendance à baseUrl

    const addToCart = useCallback(async (productId: string): Promise<boolean> => {
        const idAsString = String(productId);
        const currentQuantity = cartItems[idAsString] || 0;
        const newQuantity = currentQuantity + 1;

        const newCart = { ...cartItems, [idAsString]: newQuantity };
        setCartItems(newCart);
        localStorage.setItem('cartItems', JSON.stringify(newCart));

        if (!isLoggedIn || !currentUser?.id) {
            toast.info("Connectez-vous pour synchroniser votre panier.");
            return false;
        }

        try {
            const success = await updateCartOnServer(idAsString, newQuantity);
            if (success) {
                await loadCartData();
                return true;
            } else {
                await loadCartData();
                return false;
            }
        } catch (error: unknown) {
            toast.error("Erreur lors de l'ajout au panier. Veuillez réessayer.");
            await loadCartData();
            return false;
        }
    }, [cartItems, isLoggedIn, currentUser?.id, updateCartOnServer, loadCartData]);

    const removeFromCart = useCallback(async (productId: string): Promise<boolean> => {
        const idAsString = String(productId);
        const currentQuantity = cartItems[idAsString] || 0;

        if (currentQuantity <= 0) return false;

        const newQuantity = currentQuantity - 1;
        const newCart = { ...cartItems };

        if (newQuantity <= 0) {
            delete newCart[idAsString];
        } else {
            newCart[idAsString] = newQuantity;
        }

        setCartItems(newCart);
        localStorage.setItem('cartItems', JSON.stringify(newCart));

        if (!isLoggedIn || !currentUser?.id) {
            toast.info("Connectez-vous pour synchroniser votre panier.");
            return false;
        }

        try {
            const success = await updateCartOnServer(idAsString, newQuantity);
            if (success) {
                await loadCartData();
                return true;
            } else {
                await loadCartData();
                return false;
            }
        } catch (error: unknown) {
            toast.error("Erreur lors de la mise à jour de la quantité. Veuillez réessayer.");
            await loadCartData();
            return false;
        }
    }, [cartItems, isLoggedIn, currentUser?.id, updateCartOnServer, loadCartData]);

    const deleteFromCart = useCallback(async (productId: string): Promise<boolean> => {
        const idAsString = String(productId);
        const newCart = { ...cartItems };
        delete newCart[idAsString];

        setCartItems(newCart);
        localStorage.setItem('cartItems', JSON.stringify(newCart));

        if (!isLoggedIn || !currentUser?.id) {
            toast.info("Connectez-vous pour synchroniser votre panier.");
            return false;
        }

        try {
            const response = await axios.delete(`${baseUrl}/api/cart/${currentUser.id}`, {
                data: { productId: idAsString }
            });
            if (response.status === 200) {
                await loadCartData();
                toast.success("Produit retiré du panier.");
                return true;
            } else {
                toast.error("Erreur lors de la suppression du produit du panier. Veuillez réessayer.");
                await loadCartData();
                return false;
            }
        } catch (error: unknown) {
            toast.error("Erreur lors de la suppression du produit du panier. Veuillez réessayer.");
            await loadCartData();
            return false;
        }
    }, [cartItems, isLoggedIn, currentUser?.id, baseUrl, loadCartData]); // Dépendance à baseUrl

    const updateCartQuantity = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
        const idAsString = String(productId);
        if (quantity < 0) return false;

        const newCart = { ...cartItems };
        if (quantity === 0) {
            delete newCart[idAsString];
        } else {
            newCart[idAsString] = quantity;
        }
        setCartItems(newCart);
        localStorage.setItem('cartItems', JSON.stringify(newCart));

        if (!isLoggedIn || !currentUser?.id) {
            toast.info("Connectez-vous pour synchroniser votre panier.");
            return false;
        }

        try {
            const success = await updateCartOnServer(idAsString, quantity);
            if (success) {
                await loadCartData();
                return true;
            } else {
                await loadCartData();
                return false;
            }
        } catch (error: unknown) {
            toast.error("Erreur lors de la mise à jour de la quantité du panier. Veuillez réessayer.");
            await loadCartData();
            return false;
        }
    }, [cartItems, isLoggedIn, currentUser?.id, updateCartOnServer, loadCartData]);

    const getCartCount = useCallback(() =>
        Object.values(cartItems).reduce((sum, qty) => sum + qty, 0),
        [cartItems]
    );

    const getCartAmount = useCallback(() =>
        Object.entries(cartItems).reduce((total, [id, qty]) => {
            const product = products.find(p => p.id === id);
            return total + (product ? (product.offerPrice ?? product.price) * qty : 0);
        }, 0),
        [cartItems, products]
    );

    const clearCart = useCallback(() => {
        setCartItems({});
        localStorage.removeItem('cartItems');
        if (isLoggedIn && currentUser?.id) {
            axios.delete(`${baseUrl}/api/cart/${currentUser.id}`).catch(error => {
                console.error("Error clearing cart on server:", error);
                toast.error("Erreur lors de la suppression du panier côté serveur.");
            });
        }
        toast.success("Panier vidé !");
    }, [isLoggedIn, currentUser?.id, baseUrl]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const savedWishlist = localStorage.getItem('wishlistItems');
            setWishlistItems(savedWishlist ? JSON.parse(savedWishlist) : []);
        } catch (error: unknown) {
            console.error("Error loading wishlist from localStorage", error);
            setWishlistItems([]);
        }
    }, []);

    const toggleWishlist = useCallback((productId: string) => {
        setWishlistItems((current) => {
            const exists = current.includes(productId);
            const next = exists ? current.filter((item) => item !== productId) : [...current, productId];
            localStorage.setItem('wishlistItems', JSON.stringify(next));
            return next;
        });
    }, []);

    const isInWishlist = useCallback((productId: string) => wishlistItems.includes(productId), [wishlistItems]);

    const getWishlistCount = useCallback(() => wishlistItems.length, [wishlistItems]);


    const fetchUserOrders = useCallback(async () => {
        // Attendre que baseUrl soit défini avant de faire l'appel API
        if (!baseUrl) {
            console.log("[AppContext] fetchUserOrders: baseUrl not yet defined, skipping fetch.");
            setLoadingOrders(false);
            setErrorFetchingOrders("Veuillez vous connecter pour voir vos commandes.");
            setInitialOrdersLoaded(true);
            return;
        }

        if (!isLoggedIn || !currentUser?.id) {
            console.log("[AppContext] fetchUserOrders: User not logged in or missing ID/token, skipping fetch.");
            setUserOrders([]);
            setLoadingOrders(false);
            setErrorFetchingOrders("Veuillez vous connecter pour voir vos commandes.");
            setInitialOrdersLoaded(true);
            return;
        }

        setLoadingOrders(true);
        setErrorFetchingOrders(null);

        console.log(`[AppContext] fetchUserOrders: Fetching orders for user ${currentUser.id}...`);
        try {
            const response = await axios.get<OrdersApiResponse>(`${baseUrl}/api/user/orders`);
            console.log("[AppContext] fetchUserOrders: API raw response received:", response.data);

            let ordersData: Order[] = [];

            // MISE À JOUR : Vérifier la propriété 'data' ou 'orders' ou si c'est un tableau direct
            if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
                ordersData = response.data.data;
                console.log("[AppContext] fetchUserOrders: Detected object with 'data' array.");
            } else if (response.data && typeof response.data === 'object' && 'orders' in response.data && Array.isArray(response.data.orders)) {
                ordersData = (response.data as { orders: Order[] }).orders;
                console.log("[AppContext] fetchUserOrders: Detected object with 'orders' array.");
            } else if (Array.isArray(response.data)) {
                ordersData = response.data;
                console.log("[AppContext] fetchUserOrders: Detected direct array response.");
            } else {
                console.warn("AppContext: API did not return expected array or object with 'data'/'orders' array for user orders:", response.data);
                setErrorFetchingOrders("Format de données de commande inattendu de l'API.");
                setUserOrders([]);
                setLoadingOrders(false);
                setInitialOrdersLoaded(true);
                return;
            }

            setUserOrders(ordersData);
            console.log(`[AppContext] fetchUserOrders: Successfully set ${ordersData.length} orders.`);

        } catch (error: unknown) {
            console.error("Error fetching orders:", error);
            setUserOrders([]);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    toast.error("Session expirée, veuillez vous reconnecter");
                    router.push('/login');
                }
                setErrorFetchingOrders(error.response?.data?.message || "Échec de la récupération des commandes.");
            } else {
                setErrorFetchingOrders("Une erreur inattendue est survenue lors de la récupération des commandes.");
            }
        } finally {
            setLoadingOrders(false);
            setInitialOrdersLoaded(true);
            console.log("[AppContext] fetchUserOrders: Loading finished.");
        }
    }, [baseUrl, isLoggedIn, currentUser?.id, router]); // Dépendance à baseUrl

    const fetchUserAddresses = useCallback(async () => {
        // Attendre que baseUrl soit défini avant de faire l'appel API
        if (!baseUrl) {
            console.log("[AppContext] fetchUserAddresses: baseUrl not yet defined, skipping fetch.");
            setUserAddresses([]);
            setLoadingAddresses(false);
            setErrorFetchingAddresses("Veuillez vous connecter pour voir vos adresses.");
            setInitialAddressesLoaded(true);
            return;
        }

        if (!isLoggedIn || !currentUser?.id) {
            console.log("[AppContext] fetchUserAddresses: User not logged in or missing ID/token, skipping fetch.");
            setUserAddresses([]);
            setLoadingAddresses(false);
            setErrorFetchingAddresses("Veuillez vous connecter pour voir vos adresses.");
            setInitialAddressesLoaded(true);
            return;
        }

        setLoadingAddresses(true);
        setErrorFetchingAddresses(null);

        console.log(`[AppContext] fetchUserAddresses: Attempting to fetch addresses for user ${currentUser.id}...`);
        try {
            const response = await axios.get<{ success: boolean; addresses: Address[] }>(
                `${baseUrl}/api/addresses/${currentUser.id}`
            );
            console.log("[AppContext] fetchUserAddresses: API response received:", response.data);

            if (response.data.success && Array.isArray(response.data.addresses)) {
                setUserAddresses(response.data.addresses);
                console.log(`[AppContext] fetchUserAddresses: Successfully set ${response.data.addresses.length} addresses.`);
            } else {
                console.warn("[AppContext] fetchUserAddresses: API response was not successful or addresses not an array.", response.data);
                setUserAddresses([]);
                setErrorFetchingAddresses("Format de données d'adresse inattendu de l'API.");
                setLoadingAddresses(false);
                setInitialAddressesLoaded(true);
                return;
            }
        } catch (error: unknown) {
            console.error("Error fetching addresses:", error);
            setUserAddresses([]);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    toast.error("Session expirée, veuillez vous reconnecter");
                    router.push('/login');
                }
                setErrorFetchingAddresses(error.response?.data?.message || "Échec de la récupération des adresses.");
            } else {
                setErrorFetchingAddresses("Une erreur inattendue est survenue lors de la récupération des adresses.");
            }
        } finally {
            setLoadingAddresses(false);
            setInitialAddressesLoaded(true);
            console.log("[AppContext] fetchUserAddresses: Loading finished.");
        }
    }, [baseUrl, isLoggedIn, currentUser?.id, router]); // Dépendance à baseUrl

    useEffect(() => {
        const filtered = products.filter(product => {
            const matchesCategory = selectedCategory === 'All' || product.category.name === selectedCategory;
            const matchesSearch = searchTerm === '' ||
                product.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
        setFilteredProducts(filtered);
    }, [products, searchTerm, selectedCategory]);

    useEffect(() => {
        // Déclencher le chargement des produits uniquement si baseUrl est défini
        if (baseUrl) {
            console.log("[AppContext] Main useEffect triggered. Calling fetchProducts.");
            fetchProducts();
        } else {
            console.log("[AppContext] Main useEffect: baseUrl not yet defined, waiting to call fetchProducts.");
        }
    }, [fetchProducts, baseUrl]); // Ajout de baseUrl comme dépendance

    useEffect(() => {
        console.log("[AppContext] User-specific data useEffect triggered. isLoggedIn:", isLoggedIn, "currentUser.id:", currentUser?.id, "baseUrl:", baseUrl);
        // Ne charger les données spécifiques à l'utilisateur que si baseUrl est défini
        if (baseUrl && isLoggedIn && currentUser?.id) {
            console.log("[AppContext] User logged in and baseUrl defined, checking data loading status...");

            // Charger le panier uniquement si pas déjà en cours de chargement ET n'a pas été initialement chargé
            if (!loadingCart && !initialCartLoaded) {
                console.log("[AppContext] Cart not loading and not initially loaded. Calling loadCartData.");
                loadCartData();
            } else if (initialCartLoaded) {
                console.log("[AppContext] Cart initially loaded, not re-fetching automatically.");
            }

            // Charger les commandes uniquement si pas déjà en cours de chargement ET n'ont pas été initialement chargées
            if (!loadingOrders && !initialOrdersLoaded) {
                console.log("[AppContext] Orders not loading and not initially loaded. Calling fetchUserOrders.");
                fetchUserOrders();
            } else if (initialOrdersLoaded) {
                console.log("[AppContext] Orders initially loaded, not re-fetching automatically.");
            }

            // Charger les adresses uniquement si pas déjà en cours de chargement ET n'ont pas été initialement chargées
            if (!loadingAddresses && !initialAddressesLoaded) {
                console.log("[AppContext] Addresses not loading and not initially loaded. Calling fetchUserAddresses.");
                fetchUserAddresses();
            } else if (initialAddressesLoaded) {
                console.log("[AppContext] Addresses initially loaded, not re-fetching automatically.");
            }

        } else {
            console.log("[AppContext] User not logged in or baseUrl not defined, skipping user-specific data fetch and clearing local state.");
            setUserOrders([]);
            setUserAddresses([]);
            setCartItems({});
            localStorage.removeItem('cartItems');
            setErrorFetchingOrders(null);
            setErrorFetchingAddresses(null);
            setInitialOrdersLoaded(false);
            setInitialAddressesLoaded(false);
            setInitialCartLoaded(false);
        }
    }, [
        isLoggedIn,
        currentUser?.id,
        baseUrl, // Ajout de baseUrl comme dépendance ici aussi
        loadCartData,
        fetchUserOrders,
        fetchUserAddresses,
        loadingCart,
        loadingOrders,
        loadingAddresses,
        initialCartLoaded,
        initialOrdersLoaded,
        initialAddressesLoaded,
    ]);

    const contextValue: AppContextType = {
        products,
        loadingProducts,
        errorProducts,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        filteredProducts,
        cartItems,
        loadingCart,
        currentUser,
        setCurrentUser,
        isLoggedIn,
        userOrders,
        loadingOrders,
        errorFetchingOrders,
        userAddresses,
        loadingAddresses,
        errorFetchingAddresses,
        deliveryFee,
        setDeliveryFee,
        fetchProducts,
        wishlistItems,
        toggleWishlist,
        isInWishlist,
        getWishlistCount,
        loadCartData,
        addToCart,
        removeFromCart,
        deleteFromCart,
        updateCartQuantity,
        getCartCount,
        getCartAmount,
        formatPrice: formatPriceInFCFA,
        fetchUserOrders,
        fetchUserAddresses,
        router,
        currency,
        url: baseUrl, // Utilise baseUrl ici
        clearCart,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};
