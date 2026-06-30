import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050608',
          900: '#0b0d12',
          800: '#10131a'
        },
        morphix: {
          purple: '#8b68ff',
          blue: '#42a6ff',
          magenta: '#ef5aa8',
          green: '#57e6a4'
        }
      },
      boxShadow: {
        glow: '0 24px 80px rgba(139, 104, 255, 0.18)'
      },
      borderRadius: {
        xl2: '1.75rem'
      },
      opacity: {
        1: '0.01',
        2: '0.02',
        8: '0.08',
        12: '0.12'
      }
    }
  },
  plugins: []
};

export default config;
