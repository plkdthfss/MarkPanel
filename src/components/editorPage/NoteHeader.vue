<template>
  <nav class="note-header">
    <div class="header-left">
      <button class="icon-btn back-btn" @click="$emit('back')" :title="'Back to home'">
        <n-icon :size="20">
          <ArrowBackOutline />
        </n-icon>
      </button>
    </div>

    <div class="header-right">
      <!--
      <button class="icon-btn" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
        <n-icon :size="18">
          <SunnyOutline v-if="isDark" />
          <MoonOutline v-else />
        </n-icon>
      </button>
      -->
      <button class="icon-btn" :title="'Settings'">
        <n-icon :size="18">
          <SettingsOutline />
        </n-icon>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowBackOutline, SettingsOutline, MoonOutline, SunnyOutline } from '@vicons/ionicons5'
import { useThemeStore } from '../../store/theme'

interface Props {
  themeMode: 'light' | 'dark'
  noteTitle?: string
}

interface Emits {
  (e: 'back'): void
  (e: 'update:theme-mode', mode: 'light' | 'dark'): void
  (e: 'update:title', title: string): void
}

const props = withDefaults(defineProps<Props>(), {
  noteTitle: 'New Note'
})

const emit = defineEmits<Emits>()
const themeStore = useThemeStore()

const isDark = computed(() => themeStore.theme === 'dark')

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const handleTitleBlur = (event: Event) => {
  const target = event.target as HTMLElement
  const newTitle = target.textContent?.trim() || 'New Note'
  emit('update:title', newTitle)
}

const handleTitleEnter = (event: KeyboardEvent) => {
  event.preventDefault()
  const target = event.target as HTMLElement
  target.blur()
}
</script>

<style scoped>
.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 12px;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
  user-select: none;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.back-btn {
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn:hover {
  background-color: var(--button-hover-bg);
  transform: translateX(-2px);
}

.note-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  cursor: text;
  transition: color 0.2s;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-title:focus {
  color: var(--accent-color);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: var(--button-hover-bg);
  color: var(--text-primary);
}

.icon-btn:active {
  background-color: var(--button-active-bg);
}
</style>
