// components/HomeProducts.tsx
'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { useAppContext } from '@/context/AppContext'; // Importé pour utiliser router
import { Product } from '@/lib/types'; // Assurez-vous que l'importation est correcte

const HomeProducts = () => {
    const { 
        products, 
        loadingProducts, 
        errorProducts,
        router // Gardez router ici car il est utilisé directement dans HomeProducts
    } = useAppContext();

    if (loadingProducts) {
        return (
            <div className="flex justify-center items-center py-14">
                <p className="text-xl text-gray-600">Chargement des produits...</p>
            </div>
        );
    }

    if (errorProducts) {
        return (
            <div className="flex justify-center items-center py-14">
                <p className="text-xl text-red-600">Erreur lors du chargement des produits : {errorProducts}</p>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="flex justify-center items-center py-14">
                <p className="text-xl text-gray-600">Aucun produit trouvé pour le moment.</p>
            </div>
        );
    }

    return (
        <section className="flex flex-col items-center">
            <p className="w-full text-left text-[1.45rem] font-semibold text-[#222]">Produits populaires</p>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 pb-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {products.slice(0, 12).map((product: Product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        // PLUS besoin de passer addToCart, formatPrice, router ici !
                    />
                ))}
            </div>
            <button
                onClick={() => router.push('/all-products')}
                className="rounded-full border border-[#d8d8d8] bg-white px-10 py-2.5 text-sm font-semibold text-[#333] transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
            >
                Voir plus
            </button>
        </section>
    );
};

export default HomeProducts;
