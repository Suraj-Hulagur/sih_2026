/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oil: {
          sidebar: "#0d1a2d",
          sidebarHover: "#15243b",
          sidebarActive: "#1b2d49",
          canvas: "#f4f6fa",
          border: "#e5e9f2",
          red: "#ea384c",
          redLight: "#fee2e2",
          blue: "#38bdf8",
          blueDark: "#1e3a8a",
          blueMedium: "#2563eb",
          textMain: "#1e293b",
          textMuted: "#64748b",
          textLight: "#94a3b8"
        },
        iogp: {
          energy: "#ea384c",
          lineoffire: "#f97316",
          confined: "#f59e0b",
          hotwork: "#0284c7",
          height: "#0d9488",
          driving: "#0891b2",
          other: "#94a3b8"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
