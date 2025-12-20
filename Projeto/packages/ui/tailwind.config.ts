import type { Config } from "tailwindcss";
import nativewind from "nativewind/preset";

const config: Config = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    presets: [nativewind],
    theme: {
        extend: {},
    },
    plugins: [],
};

export default config;
