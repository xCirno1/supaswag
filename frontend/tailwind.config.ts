import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          50: '#FDF6F4',
          100: '#FAEAE5',
          200: '#F1CFC4',
          300: '#E7B0A0',
          400: '#DE8E79',
          500: '#D97757',
          600: '#C25D3D',
          700: '#9B452A',
          800: '#7A3824',
          900: '#5E2818',
        },
        surface: '#F8FAFC',
      },
    },
  },
  plugins: [],
};
export default config;