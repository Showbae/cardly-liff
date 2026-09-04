import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'IBM Plex Sans Thai', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#ecf6ee',
          100: '#d8efe2',
          500: '#16a974',
          600: '#0f8e5a',
          700: '#0e6e4b',
          900: '#062a1f',
        },
        gold: {
          100: '#fbe9b6',
          500: '#e8b339',
          600: '#c98e1f',
        },
        bg: '#fbfaf6',
        surface: {
          DEFAULT: '#ffffff',
          2: '#f4f1e9',
          3: '#e9e5d8',
        },
        ink: {
          DEFAULT: '#0f1f18',
          2: '#2a3b32',
          3: '#5e6e64',
          4: '#98a39b',
        },
        line: {
          DEFAULT: '#e5e1d4',
          soft: '#efece1',
        },
        good: {
          DEFAULT: '#16a974',
          bg: '#e6f6ec',
        },
        warn: {
          DEFAULT: '#e36b3f',
          bg: '#fdece1',
        },
        info: {
          DEFAULT: '#2f6bd9',
          bg: '#e3edfb',
        },

        // ── shadcn/ui (admin portal) ────────────────────────────────
        // ชื่อที่คอมโพเนนต์ของ shadcn อ้างถึงตายตัว · ค่าจริงมาจาก CSS
        // variable ใน globals.css ซึ่งชี้กลับไปที่ token ของ Cardly ข้างบน
        // LIFF ไม่ได้ใช้กลุ่มนี้ — ใช้ brand/ink/surface ตามเดิม
        //
        // ⚠️ ต้องอยู่ในบล็อก colors เดียวกันนี้ ห้ามแยกเป็น colors: ตัวที่สอง
        //    key ซ้ำใน object literal จะทับกันเงียบ ๆ สี Cardly หายทั้งชุด
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },

      borderRadius: {
        card: '16px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
      },
      animation: {
        'accordion-down': 'accordion-down .2s ease-out',
        'accordion-up': 'accordion-up .2s ease-out',
      },
      boxShadow: {
        'depth-sm': '0 1px 2px rgba(15,31,24,.06), 0 1px 1px rgba(15,31,24,.04)',
        'depth-md': '0 4px 14px rgba(15,31,24,.07), 0 2px 5px rgba(15,31,24,.04)',
        'depth-lg': '0 16px 40px rgba(15,31,24,.13), 0 4px 10px rgba(15,31,24,.06)',
        card: '0 14px 30px rgba(6,28,18,.20), 0 4px 10px rgba(6,28,18,.10)',
      },
    },
  },
  // ใช้โดยคอมโพเนนต์ shadcn (dialog, dropdown, accordion) — LIFF ไม่ได้ใช้
  plugins: [require('tailwindcss-animate')],
}

export default config
