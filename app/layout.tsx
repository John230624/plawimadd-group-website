// app/layout.tsx
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import SessionProvider from "./SessionProvider";
import { AppProvider } from "@/context/AppContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Script from "next/script"; // Pour charger Kkiapay correctement
import React, { ReactNode } from 'react';

export const metadata = {
    title: "Plawimadd Group",
    description: "Plawimadd Group - Votre boutique en ligne de produits électronique",
};

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.ReactNode {
    return (
        <html lang="fr" data-scroll-behavior="smooth">
            <body>
                <SessionProvider>
                    <AppProvider>
                        <AppChrome>{children}</AppChrome>
                        {/* ToastContainer est correctement configuré ici */}
                        <ToastContainer
                            position="bottom-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            toastClassName="relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer bg-zinc-50/100 shadow-lg"
                            className="text-sm font-white flex p-3"
                        />
                    </AppProvider>
                </SessionProvider>

                {/* Script Kkiapay chargé proprement avec la nouvelle URL */}
                <Script
                    src="https://cdn.kkiapay.me/k.js" // L'URL actuelle. Si des problèmes, essayez 'https://cdn.kkiapay.me/k.v1.js'
                    strategy="afterInteractive"
                />
            </body>
        </html>
    );
}
