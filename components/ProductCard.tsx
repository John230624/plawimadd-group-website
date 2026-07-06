// components/ProductCard.tsx
'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import { assets } from '@/assets/assets';
import { FiShoppingCart, FiStar, FiChevronRight, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Interface pour la catégorie reçue de l'API (déjà définie et correcte)
interface CategoryApi {
    id: string;
    name: string;
}

// Interface pour le produit tel qu'il est reçu de votre API
// C'est la version côté client de ApiResponseProduct de la route API
interface ClientProduct {
    id: string;
    name: string;
    description: string | null; // Peut être null
    price: number;
    offerPrice: number | null; // Peut être null
    stock: number;
    imgUrl: string[]; // C'est un tableau de chaînes pour le client
    createdAt: Date | string; // Type Date ou string selon comment vous le parsez
    updatedAt: Date | string; // Type Date ou string selon comment vous le parsez
    category: CategoryApi; // Assurez-vous que c'est bien CategoryApi, pas seulement string
    rating?: number | null; // Ajout de la propriété 'rating', peut être null ou undefined
    brand?: string | null; // <-- CORRIGÉ : Peut être null
    color?: string | null; // <-- CORRIGÉ : Peut être null
}

// Interface pour les props du composant ProductCard
interface ProductCardProps {
    product: ClientProduct;
}

/**
 * Composant ProductCard.
 * Affiche les détails d'un produit et permet de l'ajouter au panier ou de voir ses détails.
 *
 * @param {ProductCardProps} { product } Les props du composant.
 * @returns {JSX.Element | null} Le JSX de la carte produit ou null si le produit est invalide.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    // Récupération des fonctions et états nécessaires depuis le contexte
    const { addToCart, formatPrice, cartItems, router, isLoggedIn, colors } = useAppContext();
    const toastShownRef = useRef<boolean>(false); // Pour éviter les toasts multiples rapides

    if (!product) return null;

    const displayPrice =
        product.offerPrice !== null && product.offerPrice !== undefined && product.offerPrice < product.price
            ? product.offerPrice
            : product.price;

    // S'assurer que imageUrl est une chaîne unique.
    const imageUrl = (product.imgUrl && product.imgUrl.length > 0)
        ? product.imgUrl[0]
        : assets.default_product_image.src; // Utilisez .src pour les StaticImageData

    const productColorIds: string[] = (() => {
      if (!product.color) return [];
      try { const p = JSON.parse(product.color); return Array.isArray(p) ? p : []; } catch { return []; }
    })();

    const isInCart = Boolean(cartItems[product.id]);

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => { // Rendre la fonction async
        e.stopPropagation(); // Empêche le clic de la carte de se propager

        if (!isLoggedIn) {
            toast.info('Connectez-vous pour ajouter au panier.');
            router.push('/login');
            return;
        }

        if (isInCart) {
            if (!toastShownRef.current) {
                toast.info('Ce produit est déjà dans votre panier.');
                toastShownRef.current = true;
                setTimeout(() => (toastShownRef.current = false), 1000); // Réinitialiser après 1 seconde
            }
            return;
        }

        // Appeler addToCart et attendre son résultat
        const success = await addToCart(product.id);
        if (success) {
            toast.success('Ajouté au panier !');
        }
        // Le toast d'erreur est déjà géré par AppContext si l'opération échoue
    };

    const handleCardClick = () => {
        router.push(`/product/${product.id}`);
    };

    const handleViewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Empêche le clic de la carte de se propager
        router.push(`/product/${product.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="group flex flex-col bg-zinc-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden h-full border border-zinc-200"
        >
            {/* Image Container */}
            <div className="relative w-full aspect-square bg-zinc-50 overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={product.name || 'Produit'}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    width={400}
                    height={400}
                    priority
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = assets.default_product_image.src;
                    }}
                />

                {/* Bouton Ajouter au panier */}
                <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                        onClick={handleAddToCart}
                        className={`p-3 rounded-full shadow-lg transition
                            ${
                                isInCart
                                    ? 'bg-green-100 text-green-600 cursor-default'
                                    : 'bg-white hover:bg-blue-600 hover:text-white text-blue-600'
                            }
                            flex items-center justify-center`}
                        aria-label={isInCart ? 'Déjà au panier' : 'Ajouter au panier'}
                        disabled={isInCart}
                        title={isInCart ? 'Déjà au panier' : 'Ajouter au panier'}
                        style={{ boxShadow: '0 4px 10px rgba(0, 123, 255, 0.3)' }}
                    >
                        {isInCart ? <FiCheck size={20} /> : <FiShoppingCart size={20} />}
                    </button>
                </div>
            </div>

            {/* Infos Produit */}
            <div className="p-2 flex flex-col flex-grow">
                {/* Nom produit */}
                <h3 className="text-zinc-900 font-bold text-lg leading-tight line-clamp-2 mb-2">
                    {product.name}
                </h3>

                {/* Description */}
                <p className="text-zinc-500 text-xs line-clamp-3 mb-2">{product.description}</p>

                {productColorIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1 mt-1">
                    {productColorIds.map((id) => {
                      const c = colors.find((col) => col.id === id);
                      if (!c) return null;
                      return (
                        <div key={id} className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-500">
                          <span className="h-2.5 w-2.5 rounded-full border border-zinc-200" style={{ backgroundColor: c.hex }} />
                          {c.name}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Note */}
                <div className="flex items-center gap-1 mb-0">
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <FiStar
                                key={i}
                                className={`w-3 h-3 ${
                                    i < Math.floor(product.rating ?? 0)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-zinc-300'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-zinc-500 ml-1">
                        {product.rating !== null && product.rating !== undefined
                            ? product.rating.toFixed(1)
                            : 'N/A'}
                    </span>
                </div>

                {/* Prix et bouton Voir */}
                <div className="mt-auto flex items-end justify-between">
                    <div>
                        <p className="text-lg font-bold text-blue-900 mt-auto">{formatPrice(displayPrice)}</p>
                        {product.offerPrice !== null && product.offerPrice !== undefined && product.offerPrice < product.price && (
                            <p className="text-xs text-zinc-400 line-through">{formatPrice(product.price)}</p>
                        )}
                    </div>

                    {/* Bouton Voir desktop */}
                    <div className="hidden lg:flex">
                        <button
                            onClick={handleViewClick}
                            className="flex items-center gap-1 px-2 py-2 text-xs font-medium rounded-lg transition"
                            style={{ backgroundColor: '#2563EB', color: 'white', userSelect: 'none' }}
                            onMouseDown={(e) => e.preventDefault()}
                            aria-label={`Voir détails de ${product.name}`}
                        >
                            Voir <FiChevronRight size={12} color="white" />
                        </button>
                    </div>

                    {/* Bouton Voir mobile */}
                    <button
                        onClick={handleViewClick}
                        className="lg:hidden flex items-center text-blue-600 text-sm font-medium select-none"
                        style={{ userSelect: 'none' }}
                        aria-label={`Voir détails de ${product.name}`}
                    >
                        Voir <FiChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
