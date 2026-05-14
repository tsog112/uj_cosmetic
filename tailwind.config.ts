import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Core Brand Palette ──────────────────────────────────────────────
        sand:          '#FFF8FB',   // warm-cream / site background
        blush:         '#FFF0F6',   // light rose tint (rose-quartz)
        'sand-dark':   '#FFE6F0',   // announcement bar bg
        'dusty-rose':  '#D994B5',   // primary accent (buttons, labels)
        'rose-gold':   '#D8A15D',   // secondary accent (gold / numbered labels)
        charcoal:      '#241820',   // primary dark text / bg
        ink:           '#3A2731',   // deep ink for headings
        sage:          '#98A58F',   // nature accent (unused but available)

        // ── Text ────────────────────────────────────────────────────────────
        'text-primary': '#241820',
        'text-muted':   '#7E6472',
        'text-subtle':  '#8B6B78',
        'text-faint':   '#9A7D88',

        // ── Border ──────────────────────────────────────────────────────────
        border:         'rgba(217,148,181,0.30)',   // #D994B54D
        'border-light': '#F2C7D8',
        'border-faint': 'rgba(242,168,200,0.40)',   // F2A8C8/40

        // ── Surface ─────────────────────────────────────────────────────────
        'warm-cream':   '#FFF8FB',
        'rose-quartz':  '#FFF0F6',
        'rose-100':     '#FFF0F6',

        // ── Status badge colours (admin) ─────────────────────────────────────
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
      fontSize: {
        display:     ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-sm':['3rem',   { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        heading:     ['2.25rem',{ lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'heading-sm':['1.75rem',{ lineHeight: '1.2'  }],
        label:       ['0.6875rem',{ lineHeight: '1.4', letterSpacing: '0.18em' }],
      },
      spacing: {
        '2':  '0.5rem',   //  8px
        '4':  '1rem',     // 16px
        '6':  '1.5rem',   // 24px
        '8':  '2rem',     // 32px
        '10': '2.5rem',   // 40px
        '12': '3rem',     // 48px
        '16': '4rem',     // 64px
        '18': '4.5rem',   // 72px
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
      borderRadius: {
        'card':   '14px',
        'card-lg':'16px',
        'btn':    '10px',
        'tag':    '999px',
      },
      boxShadow: {
        'brand-sm':  '0 1px 2px rgba(91,46,67,0.06)',
        'brand-md':  '0 8px 24px rgba(91,46,67,0.10)',
        'brand-lg':  '0 18px 48px rgba(91,46,67,0.14)',
        'brand-xl':  '0 24px 70px rgba(91,46,67,0.16)',
        'card':      '0 10px 30px rgba(26,26,26,0.03)',
        'card-hover':'0 22px 48px -18px rgba(91,46,67,0.28)',
        'header':    '0 8px 28px rgba(89,48,67,0.07)',
        'nav':       '0 -8px 24px rgba(89,48,67,0.06)',
        'dropdown':  '0 18px 45px rgba(89,48,67,0.10)',
      },
    },
  },
};

export default config;
