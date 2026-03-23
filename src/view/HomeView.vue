<template>
  <div class="home-view" :class="`theme-${themeStore.theme}`">
    <HomeHeader :theme-mode="themeStore.theme" @update:theme-mode="themeStore.theme = $event" />
    <SearchBar v-model="searchQuery" />
    <AddButton />
    <NoteList 
      :notes="filteredNotes"
      :selected-note-id="selectedNoteId"
      @select-note="selectNote"
    />
    <div class="footer-info">
      <FolderPicker />
      <span class="notes-count">{{ filteredNotes.length }} NOTES</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import HomeHeader from '../components/homePage/HomeHeader.vue'
import SearchBar from '../components/homePage/SearchBar.vue'
import AddButton from '../components/homePage/AddButton.vue'
import NoteList from '../components/homePage/NoteList.vue'
import FolderPicker from '../components/homePage/FolderPicker.vue'
import { useThemeStore } from '../store/theme'
import { useNoteStore } from '../store/note'
import { useRouter } from 'vue-router'

const themeStore = useThemeStore()
const noteStore = useNoteStore()
const router = useRouter()
const selectedNoteId = ref<string>()
const searchQuery = ref('')

const filteredNotes = computed(() => {
  // 先按当前文件夹过滤
  let result = noteStore.notes.filter(
    note => note.folderId === noteStore.currentFolderId
  )

  // 再按搜索词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    )
  }

  return result
})

const selectNote = (id: string) => {
  selectedNoteId.value = id
  router.push(`/editor/${id}`)
}
</script>

<style scoped>
.home-view {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.home-view.theme-dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --header-bg: #1e293b;
  --card-bg: #1e293b;
  --card-hover-bg: #334155;
  --card-active-bg: #0ea5e9;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --accent-color: #0ea5e9;
  --border-color: #334155;
  --button-hover-bg: #334155;
  --button-active-bg: #475569;
  --scrollbar-thumb: #475569;
  --scrollbar-thumb-hover: #64748b;
  --popup-bg: #1e293b;
}

.home-view.theme-light {
  --bg-primary: #f8fafc;
  --bg-secondary: #f1f5f9;
  --header-bg: #ffffff;
  --card-bg: #ffffff;
  --card-hover-bg: #f1f5f9;
  --card-active-bg: #e0f2fe;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --accent-color: #0284c7;
  --border-color: #e2e8f0;
  --button-hover-bg: #f1f5f9;
  --button-active-bg: #e2e8f0;
  --scrollbar-thumb: #cbd5e1;
  --scrollbar-thumb-hover: #94a3b8;
  --popup-bg: #ffffff;
}

.footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.notes-count {
  font-weight: 500;
  font-size: 11px;
  color: var(--text-tertiary);
}
</style>
