import type { Config } from "tailwindcss";
export default { content: ["./src/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#2d4358", muted: "#536b7e", accent: "#365f88" }, fontFamily: { serif: ["Georgia", "Songti SC", "SimSun", "serif"] } } }, plugins: [] } satisfies Config;
