export const layoutTheme = {
    colors: {
        primary: {
            100: "#E6E9EE", // very light tint of #192438
            300: "#9FA8B8",
            500: "#192438", // MAIN PRIMARY
            700: "#11192A",
            900: "#0A0F1A",
        },

        secondary: {
            100: "#F3E6D9", // very light tint of #854C1F
            300: "#C9986D",
            500: "#854C1F", // MAIN SECONDARY
            700: "#5E3415",
            900: "#3D220E",
        },

        neutral: {
            light: "#d9d9d9", // light gray
            medium: "#988080",
            dark: "#838383",
            darker: "#4F4F4F",
            darkest: "#1A1A1A",
            white: "#FFFFFF",
            black: "#000000",
        },

        accent: {
            100: "#F8E6F0",
            300: "#F0A6D6",
            500: "#E91E63", // PINK ACCENT
            700: "#C2185B",
            900: "#880E4F",
        },

        background: {
            primary: "#FFFFFF",
            secondary: "#F5F5F5",
            black: "#000000",
            white: "#FFFFFF",
            soft: "#F0ECEC", // using pastel tone (#988080 → soft tint)
            dark: "#1A1A1A",
            light: "#FFFFFF",
            gray: "#a6a5a2",
            darkBlue: "#1B2332",
        },

        gradients: {
            darkPrimary: ["rgba(20,6,30,1)", "rgba(10,4,18,0.98)", "rgba(6,2,12,1)"],
            lightPrimary: ['rgba(200, 60, 179, 1)', 'rgba(139, 92, 246, 1)', 'rgba(174, 153, 214, 1)'],
            secondary: ["#854C1F", "#5E3415"],
            accent: ["#E91E63", "#C2185B"],
            background: ["#FFFFFF", "#F5F5F5"],
            text: ["#000000", "#4F4F4F"],
            button: ["#854C1F", "#5E3415"],
        },

        text: {
            primary: "#000000",
            secondary: "#4F4F4F",
            muted: "#838383",
            tertiary: "#F6F6F6",
            inverse: "#FFFFFF",
            highlight: "#C64949",
            link: "#FCC21B",
            error: "#C64949",
        },

        button: {
            primary: {
                bg: "#854C1F", // using secondary.500
                bgHover: "#5E3415", // using secondary.700
                text: "#FFFFFF",
            },
            secondary: {
                bg: "#192438", // using primary.500
                bgHover: "#11192A", // using primary.700
                text: "#FFFFFF",
            },
            accent: {
                bg: "#E91E63", // using accent.500
                bgHover: "#C2185B", // using accent.700
                text: "#FFFFFF",
            },
        },
    },

    modes: {
        light: {
            background: {
                primary: "#FFFFFF",
                secondary: "#F5F5F5",
                soft: "#F0ECEC",
            },
            text: {
                primary: "#FFFFFF",
                secondary: "#9FA8B8",
                muted: "#838383",
            },
            button: {
                primary: { bg: "#6200ee", text: "#FFFFFF" },
                secondary: { bg: "#192438", text: "#FFFFFF" },
                accent: { bg: "#E91E63", text: "#11192A" },
            },
            card: {
                bg: "#FFFFFF",
                border: "#E6E9EE",
            },
            nav: {
                bg: "#FFFFFF",
                text: "#192438",
                icon: "#192438",
            }
        },
        dark: {
            background: {
                primary: "#11192A", // using primary.700 / dark blue
                secondary: "#0A0F1A",
                soft: "#1A1A1A",
            },
            text: {
                primary: "#FFFFFF",
                secondary: "#9FA8B8",
                muted: "#838383",
            },
            button: {
                primary: { bg: "#6200ee", text: "#11192A" },
                secondary: { bg: "#192438", text: "#FFFFFF" },
                accent: { bg: "#E91E63", text: "#11192A" },
            },
            card: {
                bg: "#11192A",
                border: "#313130",
            },
            nav: {
                bg: "#11192A",
                text: "#FFFFFF",
                icon: "#95BCCC",
            }
        }
    },

    fonts: {
        sora: {
            bold: "Sora-Bold",
            extraBold: "Sora-ExtraBold",
            extraLight: "Sora-ExtraLight",
            light: "Sora-Light",
            medium: "Sora-Medium",
            regular: "Sora-Regular",
            semiBold: "Sora-SemiBold",
            thin: "Sora-Thin",
            variableFont_wght: "Sora-VariableFont_wght",
        }
    },
};
