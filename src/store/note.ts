import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Note {
  id: string
  title: string
  content: string
  timestamp: number
}

export type TabType = 'all' | 'favorites' | 'pinned'

export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>([])

  const currentNoteId = ref<string | null>(null)

  const getCurrentNote = () => {
    if (!currentNoteId.value) return null
    return notes.value.find(note => note.id === currentNoteId.value)
  }

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'NewNote',
      content: '',
      timestamp: Date.now(),
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
    if (index > -1) {
      notes.value.splice(index, 1)
    }
  }

  const setCurrentNote = (id: string) => {
    currentNoteId.value = id
  }

  return {
    notes,
    currentNoteId,
    getCurrentNote,
    createNewNote,
    updateNote,
    deleteNote,
    setCurrentNote,
  }
})
