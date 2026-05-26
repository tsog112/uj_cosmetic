import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Strict Brand Palette (per spec) ─────────────────────────────
        primary:       '#E91E8C',   // hot pink / magenta — primary accent
        'soft-pink':   '#FDE8F3',   // background blush
        'light-pink':  '#FFB6D9',   // cards, badges
        'deep-rose':   '#C2185B',   // buttons, CTAs, accents
        'text-dark':   '#1A0A12',   // headings
        'text-medium': '#6B3A52',   // body copy
        'text-light':  '#9E6B82',   // muted/subtle
        'soft-gray':   '#F8F4F6',   // secondary backgrounds

        // ── Semantic Aliases ─────────────────────────────────────────────
        brand: {
          bg:         '#FDE8F3',
          accent:     '#E91E8C',
          'accent-light': '#FFB6D9',
          'accent-deep':  '#C2185B',
          secondary:  '#F8F4F6',
          text:       '#1A0A12',
          muted:      '#6B3A52',
          subtle:     '#9E6B82',
          success:    '#2EA04B',
          danger:     '#D93F55',
          card:       '#FFFFFF',
          surface:    '#FFF0F7',
        },

        // ── Legacy Aliases (for backwards compat) ───────────────────────
        sand:         '#FDE8F3',
        blush:        '#FFB6D9',
        'sand-dark':  '#F8D4E8',
        'dusty-rose': '#E91E8C',
        charcoal:     '#1A0A12',
        ink:          '#1A0A12',

        // ── Status badge colours (admin) ─────────────────────────────────
        'status-pending-bg':        '#FFF7E6',
        'status-pending-text':      '#9A6A14',
        'status-pending-border':    '#F1D28A',
        'status-confirmed-bg':      '#EEF6FF',
        'status-confirmed-text':    '#315F8C',
        'status-confirmed-border':  '#B9D7F2',
        'status-shipped-bg':        '#F4EEFF',
        'status-shipped-text':      '#6A4C93',
        'status-shipped-border':    '#D9C8F2',
        'status-delivered-bg':      '#EFF8F1',
        'status-delivered-text':    '#3F774D',
        'status-delivered-border':  '#B8DEC1',
        'status-cancelled-bg':      '#FFF0F0',
        'status-cancelled-text':    '#A14E4E',
        'status-cancelled-border':  '#F1B8B8',
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['"Plus Jakarta Sans"', '"DM Sans"', 'system-ui', 'sans-serif'],
        label:   ['"Montserrat"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      fontSize: {
        display:      ['4.5rem',  { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-sm': ['3rem',    { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        heading:      ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'heading-sm': ['1.75rem', { lineHeight: '1.2'  }],
        label:        ['0.625rem',{ lineHeight: '1.4',  letterSpacing: '0.22em'  }],
      },
      spacing: {
        '2':  '0.5rem',
        '4':  '1rem',
        '6':  '1.5rem',
        '8':  '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '18': '4.5rem',
        '20': '5rem',
        '24': '6rem',
        '32': '8rem',
        '40': '10rem',
        '48': '12rem',
        '64': '16rem',
      },
      transitionTimingFunction: {
        'bounce':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':  'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-expo':'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      borderRadius: {
        'pill':   '100px',
        'card':   '20px',
        'card-lg':'28px',
        'card-xl':'32px',
        'btn':    '100px',
        'tag':    '999px',
      },
      boxShadow: {
        'brand-xs': '0 1px 3px rgba(233,30,140,0.06)',
        'brand-sm': '0 2px 8px rgba(233,30,140,0.08)',
        'brand-md': '0 8px 24px rgba(233,30,140,0.10)',
        'brand-lg': '0 16px 48px rgba(233,30,140,0.13)',
        'brand-xl': '0 28px 64px rgba(233,30,140,0.16)',
        'glow':     '0 0 40px rgba(233,30,140,0.30)',
        'glow-soft':'0 0 60px rgba(233,30,140,0.15)',
        'card':     '0 4px 20px rgba(233,30,140,0.09)',
        'card-hover':'0 20px 60px rgba(233,30,140,0.18)',
        'header':   '0 4px 24px rgba(233,30,140,0.09)',
        'nav':      '0 -4px 32px rgba(233,30,140,0.10)',
        'btn':      '0 8px 24px rgba(233,30,140,0.28)',
        'btn-hover':'0 12px 32px rgba(233,30,140,0.36)',
      },
      animation: {
        'shimmer':      'shimmer 1.8s infinite',
        'ken-burns':    'kenBurns 14s ease-in-out infinite',
        'blob-morph':   'blobMorph 8s ease-in-out infinite',
        'petal-float':  'petalFloat 8s ease-in-out infinite',
        'marquee':      'marquee 28s linear infinite',
        'marquee-fast': 'marquee 16s linear infinite',
        'fade-up':      'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':     'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'slide-up':     'slideUp 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':   'slideDown 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-soft':   'pulseSoft 2s ease-in-out infinite',
        'pop-in':       'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'badge-bounce': 'badgeBounce 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'cart-shake':   'cartShake 0.5s ease-in-out',
        'draw-stroke':  'drawStroke 1.5s ease-in-out forwards',
        'ripple':       'ripple 0.6s ease-out forwards',
        'heart-pulse':  'heartPulse 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'underline-draw': 'underlineDraw 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-300% 0' },
          '100%': { backgroundPosition:  '300% 0' },
        },
        kenBurns: {
          '0%,100%': { transform: 'scale(1) translate(0,0)' },
          '50%':     { transform: 'scale(1.05) translate(-1%,-0.5%)' },
        },
        blobMorph: {
          '0%':   { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%':  { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
        },
        petalFloat: {
          '0%':   { transform: 'translateY(-60px) rotate(0deg)', opacity: '0' },
          '10%':  { opacity: '0.5' },
          '90%':  { opacity: '0.3' },
          '100%': { transform: 'translateY(110vh) rotate(360deg)', opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.88)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        slideDown: {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.5' },
        },
        popIn: {
          from: { opacity: '0', transform: 'translateY(24px) scale(0.8)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        badgeBounce: {
          '0%':   { transform: 'scale(1)' },
          '25%':  { transform: 'scale(1.5)' },
          '50%':  { transform: 'scale(0.85)' },
          '75%':  { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        cartShake: {
          '0%,100%': { transform: 'rotate(0deg)' },
          '20%':     { transform: 'rotate(-15deg)' },
          '40%':     { transform: 'rotate(15deg)' },
          '60%':     { transform: 'rotate(-10deg)' },
          '80%':     { transform: 'rotate(8deg)' },
        },
        heartPulse: {
          '0%':   { transform: 'scale(1)' },
          '30%':  { transform: 'scale(1.4)' },
          '60%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        drawStroke: {
          from: { strokeDashoffset: '1000' },
          to:   { strokeDashoffset: '0' },
        },
        ripple: {
          from: { transform: 'scale(0)', opacity: '0.6' },
          to:   { transform: 'scale(3)', opacity: '0' },
        },
        underlineDraw: {
          from: { transform: 'scaleX(0)' },
          to:   { transform: 'scaleX(1)' },
        },
      },
    },
  },
};

export default config;
