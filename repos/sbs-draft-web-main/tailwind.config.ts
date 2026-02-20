import type { Config } from "tailwindcss"
import flowbiteReact from "flowbite-react/plugin/tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./app/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        ".flowbite-react/class-list.json"
    ],
    variants: {
        extend: {
            rotate: ["group-hover"],
        },
    },
    theme: {
        container: {
            padding: {
                DEFAULT: "1rem",
                sm: "2rem",
                lg: "0rem",
            },
        },
        extend: {
            colors: {
                "primary-dark": "#c5b92a",
                "primary-light": "#fcf16b",
                primary: "#F3E216",
                secondary: "#444262",
                tertiary: "#FF7754",
                black: "#000000",
                offBlack: "#222",
                grey: "#83829A",
                darkGrey: "#222222",
                white: "#F3F4F8",
                lightWhite: "#FAFAFC",
                qb: "#c4bc2b",
                rb: "#3c9120",
                wr: "#a200f8",
                te: "#326cf8",
                dst: "#f06b22",
            },
            fontSize: {
                xs: "12px",
                s: "1.3rem",
                md: "1.6rem",
                lg: "2.4rem",
                xl: "4rem",
                "2xl": "6rem",
                "3xl": "7rem",
            },
            fontFamily: {
                primary: "Montserrat, Arial, sans-serif",
            },
            width: {
                xs: "480px",
                sm: "600px",
                md: "782px",
                lg: "900px",
                xl: "1200px",
                "2xl": "1440px",
            },
            maxWidth: {
                xs: "480px",
                sm: "600px",
                md: "782px",
                lg: "900px",
                xl: "1200px",
                "2xl": "1440px",
            },
        },
    },
    plugins: [flowbiteReact],
}
export default config