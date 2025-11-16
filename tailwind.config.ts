import type { Config } from 'tailwindcss';

const breakpoints = new Map([
  ['xxs', 320],
  ['xs', 375],
  ['sm', 576],
  ['md', 768],
  ['lg', 992],
  ['xl', 1200],
  ['xxl', 1400],
]);

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}'],
  plugins: [],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        navy: {
          900: '#060912',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        active: '0 0 0 0.15rem #33a382',
      },
      gridTemplateColumns: {
        '12-ext': 'repeat(12, minmax(0, 1fr))',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'spinner-border': {
          to: {
            transform: 'rotate(360deg)',
          },
        },
        'spinner-grow': {
          '0%': {
            transform: 'scale(0)',
          },
          '50%': {
            opacity: '1',
            transform: 'none',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'spinner-border': 'spinner-border 0.75s linear infinite',
        'spinner-grow': 'spinner-grow 0.75s linear infinite',
      },
    },
    /* eslint-disable sort-keys-fix/sort-keys-fix */
    screens: {
      'max-sm': getScreenDim('sm', -1),
      'max-md': getScreenDim('md', -1),
      xxs: getScreenDim('xxs'),
      xs: getScreenDim('xs'),
      sm: getScreenDim('sm'),
      md: getScreenDim('md'),
      lg: getScreenDim('lg'),
      xl: getScreenDim('xl'),
      xxl: getScreenDim('xxl'),
      mobile: getScreenDim('sm'),
      tablet: getScreenDim('md'),
      laptop: getScreenDim('lg'),
      desktop: getScreenDim('xl'),
    },
    /* eslint-enable sort-keys-fix/sort-keys-fix */
  },
};

export default config;

// adjust breakpoint 1px up see previous layout on the "edge"
function getScreenDim(label: string, shift = 1) {
  const a = breakpoints.get(label);
  if (!a) throw new Error(`Unknown breakpoint: ${label}`);
  return `${a + shift}px`;
}
