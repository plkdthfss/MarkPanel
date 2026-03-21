import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'light')

  const applyTheme = (value: Theme) => {
    theme.value = value
    document.documentElement.setAttribute('data-theme', value)
  }

  const toggleTheme = () => {
    const next = theme.value === 'light' ? 'dark' : 'light'
    console.log('[theme toggle]', theme.value, '->', next)
    applyTheme(next)
  }

  // 初始化时应用一次
  applyTheme(theme.value)

  watch(theme, (v) => {
    localStorage.setItem('theme', v)
  })

  return { theme, toggleTheme, applyTheme }
})