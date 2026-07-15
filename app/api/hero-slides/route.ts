import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
  try {
    let slides = await prisma.heroSlide.findMany({
      orderBy: { order: 'asc' },
    });

    // Si aucun slide en base, on crée les slides par défaut
    if (slides.length === 0) {
      const defaultSlides = [
        {
          title: 'Téléviseurs intelligents',
          tagline: 'IMMERSION TOTALE',
          description: 'Expérimentez des détails ultra-précis, des couleurs éclatantes et une luminosité extraordinaire pour votre salon.',
          image: '/images/header_tv_image.png',
          category: 'Televiseurs',
          bgColor: '#e2e7f3',
          accentColor: '#3b82f6',
          layout: 'left',
          order: 0,
        },
        {
          title: 'Ordinateurs de pointe',
          tagline: 'PRODUCTIVITÉ MAXIMALE',
          description: 'Des performances exceptionnelles pour vos études, votre travail et vos projets créatifs avec une autonomie record.',
          image: '/images/header_ordi_hp_probook_image.png',
          category: 'Ordinateurs',
          bgColor: '#e8edf5',
          accentColor: '#10b981',
          layout: 'right',
          order: 1,
        },
        {
          title: 'Galaxy S23 Series',
          tagline: 'GALAXY AI ✦',
          description: "Entrez dans une nouvelle ère technologique. L'intelligence artificielle repensée pour simplifier chacun de vos gestes.",
          image: '/images/samsung_s23phone_image.png',
          category: 'Smartphones',
          bgColor: '#ebdffd',
          accentColor: '#8b5cf6',
          layout: 'center',
          order: 2,
        },
        {
          title: 'Écouteurs Premium',
          tagline: 'STYLE & PERFORMANCE',
          description: "Profitez d'un son immersif haute fidélité et d'une réduction de bruit active tout au long de la journée.",
          image: '/images/apple_earphone_image.png',
          category: 'Audio',
          bgColor: '#f7ebd9',
          accentColor: '#f97316',
          layout: 'right',
          order: 3,
        },
      ];

      await prisma.heroSlide.createMany({
        data: defaultSlides,
      });

      slides = await prisma.heroSlide.findMany({
        orderBy: { order: 'asc' },
      });
    }

    return NextResponse.json({ success: true, slides });
  } catch (error) {
    console.error('Erreur GET hero-slides:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
