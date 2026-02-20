import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '0',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Geist Mono', 'monospace'],
				display: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
				mono: ['JetBrains Mono', 'Geist Mono', 'monospace'],
			},
			fontSize: {
				'xxs': ['0.7rem', { lineHeight: '1rem' }], // 10px
			},
			colors: {
				habitbg: 'hsl(var(--habitbg))',
				habitbghover: 'hsl(var(--habitbghover))',
				'daycell-bg': 'hsl(var(--daycell-bg))',
				'daycell-bg-hover': 'hsl(var(--daycell-bg-hover))',
				'today-bg': 'hsl(var(--today-bg))',
				'past-bg': 'hsl(var(--past-bg))',
				'future-bg': 'hsl(var(--future-bg))',
				'today-text': 'hsl(var(--today-text))',
				'past-text': 'hsl(var(--past-text))',
				'future-text': 'hsl(var(--future-text))',
				'button-hover': 'hsl(var(--button-hover))',

				'border-today': 'hsl(var(--border-today))',
				'border-default': 'hsl(var(--border-default))',
				'text-primary': 'hsl(var(--text-primary))',
				'text-secondary': 'hsl(var(--text-secondary))',
				'text-hover': 'hsl(var(--text-hover))',
				'plus-button-bg': 'hsl(var(--plus-button-bg))',
				'plus-button-hover': 'hsl(var(--plus-button-hover))',
				'plus-button-text': 'hsl(var(--plus-button-text))',
				'plus-button-text-dark': 'hsl(var(--plus-button-text-dark))',

				'category-1-primary': 'hsl(var(--category-1-primary))',
				'category-1-intermediary': 'hsl(var(--category-1-intermediary))',
				'category-1-bg': 'hsl(var(--category-1-bg))',
				'category-2-primary': 'hsl(var(--category-2-primary))',
				'category-2-intermediary': 'hsl(var(--category-2-intermediary))',
				'category-2-bg': 'hsl(var(--category-2-bg))',
				'category-3-primary': 'hsl(var(--category-3-primary))',
				'category-3-intermediary': 'hsl(var(--category-3-intermediary))',
				'category-3-bg': 'hsl(var(--category-3-bg))',
				'category-4-primary': 'hsl(var(--category-4-primary))',
				'category-4-intermediary': 'hsl(var(--category-4-intermediary))',
				'category-4-bg': 'hsl(var(--category-4-bg))',
				'category-5-primary': 'hsl(var(--category-5-primary))',
				'category-5-intermediary': 'hsl(var(--category-5-intermediary))',
				'category-5-bg': 'hsl(var(--category-5-bg))',
				'category-6-primary': 'hsl(var(--category-6-primary))',
				'category-6-intermediary': 'hsl(var(--category-6-intermediary))',
				'category-6-bg': 'hsl(var(--category-6-bg))',

				'button-outline-border': 'hsl(var(--button-outline-border))',
				'button-outline-hover': 'hsl(var(--button-outline-hover))',
				'button-outline-filled': 'hsl(var(--button-outline-filled))',
				'button-outline-filled-border': 'hsl(var(--button-outline-filled-border))',
				'button-outline-inactive-border': 'hsl(var(--button-outline-inactive-border))',
				'button-outline-inactive-hover': 'hsl(var(--button-outline-inactive-hover))',
				'button-outline-inactive-text': 'hsl(var(--button-outline-inactive-text))',
				'button-secondary-bg': 'hsl(var(--button-secondary-bg))',
				'button-secondary-text': 'hsl(var(--button-secondary-text))',
				'button-secondary-hover': 'hsl(var(--button-secondary-hover))',
				'button-tertiary-bg': 'hsl(var(--button-tertiary-bg))',
				'button-tertiary-text': 'hsl(var(--button-tertiary-text))',
				'button-tertiary-hover': 'hsl(var(--button-tertiary-hover))',
				'button-ghost-hover': 'hsl(var(--button-ghost-hover))',
				'checkbox-bg': 'hsl(var(--checkbox-bg))',
				'checkbox-bghover': 'hsl(var(--checkbox-bghover))',
				'side-panel-bg': 'hsl(var(--side-panel-bg))',
				'diary-card-bg': 'hsl(var(--diary-card-bg))',
				border: 'hsl(var(--border))',
				bordermuted: 'hsl(var(--border-muted))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				tertiary: {
					DEFAULT: 'hsl(var(--tertiary))',
					hover: 'hsl(var(--tertiary-hover))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				mutedhover: {
					DEFAULT: 'hsl(var(--muted-hover))',
					foreground: 'hsl(var(--muted-hover-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Custom colors for your habit tracking app
				habit: {
					future: '#8B5CF6',    // Purple for future habits
					current: '#10B981',   // Green for current habits
					adopted: '#F59E0B',   // Amber for adopted habits
					completed: '#059669', // Dark green for completed
					missed: '#EF4444'     // Red for missed days
				},
				general: {
					lightgray: '#F5F5F5',
				},
				brand: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e'
				},
				// Category color overrides (bg-*-100 and text-*-800)
				red: { 100: 'hsla(0, 34%, 91%, 1)', 800: 'hsla(2, 8%, 24%, 1)' },
				orange: { 100: 'hsla(40, 30%, 90%, 1)', 800: 'hsla(39, 10%, 28%, 1)' },
				amber: { 100: 'hsla(40, 30%, 90%, 1)', 800: 'hsla(39, 10%, 28%, 1)' },
				yellow: { 100: 'hsla(57, 67%, 86%, 1)', 800: 'hsla(58, 15%, 31%, 1)' },
				green: { 100: 'hsla(94, 24%, 87%, 1)', 800: 'hsla(94, 5%, 32%, 1)' },
				blue: { 100: 'hsla(180, 11%, 89%, 1)', 800: 'hsla(94, 5%, 32%, 1)' },
				purple: { 100: 'hsla(300, 12%, 89%, 1)', 800: 'hsla(298, 5%, 36%, 1)' }
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/line-clamp")],
} satisfies Config;
