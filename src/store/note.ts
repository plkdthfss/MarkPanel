import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface Note {
  id: string
  title: string
  content: string
  timestamp: number
  folderId: string
}

export interface Folder {
  id: string
  name: string
}

export type TabType = 'all' | 'favorites' | 'pinned'

const NOTES_KEY = 'easynote_notes'
const FOLDERS_KEY = 'easynote_folders'

const loadNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (raw) return JSON.parse(raw) as Note[]
  } catch {
    console.warn('Failed to load notes from localStorage')
  }
  return []
}

const loadFolders = (): Folder[] => {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY)
    if (raw) return JSON.parse(raw) as Folder[]
  } catch {
    console.warn('Failed to load folders from localStorage')
  }
  // 默认文件夹
  return [{ id: 'default', name: 'My Workspace' }]
}

export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>(
    // 迁移旧数据：给没有 folderId 的笔记加上默认值
    loadNotes().map(n => ({ ...n, folderId: n.folderId ?? 'default' }))
  )

  const folders = ref<Folder[]>(loadFolders())
  const currentNoteId = ref<string | null>(null)
  const currentFolderId = ref<string>('default')

  watch(notes, (val) => {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(val)) }
    catch { console.warn('Failed to save notes') }
  }, { deep: true })

  watch(folders, (val) => {
    try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(val)) }
    catch { console.warn('Failed to save folders') }
  }, { deep: true })

  // --- Note actions ---
  const getCurrentNote = () => {
    if (!currentNoteId.value) return null
    return notes.value.find(n => n.id === currentNoteId.value)
  }

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'NewNote',
      content: '',
      timestamp: Date.now(),
      folderId: currentFolderId.value,
    }
    notes.value.unshift(newNote)
    currentNoteId.value = newNote.id
    return newNote
  }

  const updateNote = (id: string, updates: Partial<Note>) => {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      Object.assign(note, updates, { timestamp: Date.now() })
    }
  }

  const deleteNote = (id: string) => {
    const index = notes.value.findIndex(n => n.id === id)
    if (index > -1) notes.value.splice(index, 1)
  }

  const setCurrentNote = (id: string) => {
    currentNoteId.value = id
  }

  // --- Folder actions ---
  const createFolder = (name: string) => {
    const folder: Folder = { id: Date.now().toString(), name }
    folders.value.push(folder)
    return folder
  }

  const updateFolder = (id: string, name: string) => {
    const folder = folders.value.find(f => f.id === id)
    if (folder) folder.name = name
  }

  const deleteFolder = (id: string) => {
    if (id === 'default') return
    const index = folders.value.findIndex(f => f.id === id)
    if (index > -1) folders.value.splice(index, 1)
    // 将该文件夹的笔记移回默认
    notes.value.forEach(n => {
      if (n.folderId === id) n.folderId = 'default'
    })
    if (currentFolderId.value === id) currentFolderId.value = 'default'
  }

  const setCurrentFolder = (id: string) => {
    currentFolderId.value = id
  }

  return {
    notes,
    folders,
    currentNoteId,
    currentFolderId,
    getCurrentNote,
    createNewNote,
    updateNote,
    deleteNote,
    setCurrentNote,
    createFolder,
    updateFolder,
    deleteFolder,
    setCurrentFolder,
  }
})
