    import typography from '@tailwindcss/typography';

    /** @type {import('tailwindcss').Config} */
    const config = {
      content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
      ],
      theme: {
        extend: {
          keyframes: {
            fadeInDown: {
              '0%': { opacity: '0', transform: 'translateY(-10px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            bounceOnce: {
              '0%, 100%': {
                transform: 'translateY(0)',
              },
              '20%': {
                transform: 'translateY(-5px)',
              },
              '40%': {
                transform: 'translateY(0)',
              },
              '60%': {
                transform: 'translateY(-2px)',
              },
              '80%': {
                transform: 'translateY(0)',
              },
            },
          },
          animation: {
            'fade-in-down': 'fadeInDown 0.3s ease-out forwards',
            'bounce-once': 'bounceOnce 1s ease-in-out',
          },
        },
      },
      plugins: [typography],
    };

    export default config;
    