import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: '#FAF6F3',
        blush: '#FFF0F0',
        'dusty-rose': '#D8A7B1',
        'rose-gold': '#ECC5C0',
        charcoal: '#1A1A1A',
        border: '#EEE0E0',
        'warm-cream': '#FFF8FB',
        'rose-quartz': '#FFF0F6',
        'rose-100': '#FFF0F6',
      },
      fontSize: {
        display: ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-sm': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        heading: ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'heading-sm': ['1.75rem', { lineHeight: '1.2' }],
        label: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.18em' }],
      },
      spacing: {
        '2': '0.5rem',    // 8px
        '4': '1rem',      // 16px
        '6': '1.5rem',    // 24px
        '8': '2rem',      // 32px
        '10': '2.5rem',   // 40px
        '12': '3rem',     // 48px
        '16': '4rem',     // 64px
        '20': '5rem',     // 80px
        '24': '6rem',     // 96px
        '32': '8rem',     // 128px
        '40': '10rem',    // 160px
        '48': '12rem',    // 192px
        '64': '16rem',    // 256px
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
};

export default config;
