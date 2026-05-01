/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // sálvia (default)
        paper:   '#FAF8F4',
        soft:    '#EDE9DD',
        ink:     '#2D3A2E',
        'ink-soft': '#5C6B5E',
        sage:    '#B8D4B5',
        'sage-deep': '#6E8E6B',
        // alt moods
        terracotta: '#E5BFA5',
        'terracotta-deep': '#B5704D',
        sky:      '#A8C5D6',
        'sky-deep': '#3F6B86',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
      },
      borderRadius: {
        'xl2': '1.25rem',
      },
    },
  },
  plugins: [],
};
