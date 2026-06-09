import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#152033",
        mist: "#eef4f8",
        ocean: "#1d7a8c",
        coral: "#e46f55"
      }
    }
  },
  plugins: []
};

export default config;
