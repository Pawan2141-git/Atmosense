import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "var(--page-bg)",
        card: "var(--card-surface)",
        sidebar: "var(--sidebar-bg)",
        
        brand: "var(--brand-blue)",
        navy: "var(--navy-text)",
        muted: "var(--muted-text)",
        border: "var(--border-color)",
        success: "var(--success-green)",

        sev: {
          low: {
            bg: "var(--sev-low-bg)",
            text: "var(--sev-low-text)",
          },
          mod: {
            bg: "var(--sev-mod-bg)",
            text: "var(--sev-mod-text)",
          },
          high: {
            bg: "var(--sev-high-bg)",
            text: "var(--sev-high-text)",
          },
          crit: {
            bg: "var(--sev-crit-bg)",
            text: "var(--sev-crit-text)",
          }
        },

        chart: {
          a: "var(--chart-a)",
          b: "var(--chart-b)",
          c: "var(--chart-c)",
        },

        map: {
          base: "var(--map-basemap)",
          heat: "rgba(59, 130, 246, 0.15)",
          riskLow: "#10b981",
          riskMod: "#f59e0b",
          riskHigh: "#f97316",
          riskCrit: "#ef4444",
        }
      },
      boxShadow: {
        card: "0 2px 12px rgba(20, 40, 90, 0.06)",
      }
    },
  },
  plugins: [],
};
export default config;
