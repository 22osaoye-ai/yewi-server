
import {create} from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
    theme: Theme
    toggleTheme: () => void
}



export const useThemeStore = create<ThemeState>((set) => ({
    theme: "light",
    toggleTheme: () => {
        set((state) => ({
            theme: state.theme === 'dark' ? 'light' : 'dark'
        }))
    }
}))