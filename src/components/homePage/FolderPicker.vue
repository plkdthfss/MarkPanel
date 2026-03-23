<template>
  <div class="folder-picker-wrapper">
    <!-- 触发按钮 -->
    <button class="folder-trigger" @click.stop="toggle">
      <n-icon :size="14"><FolderOpenOutline /></n-icon>
      <span class="folder-name">{{ currentFolder?.name || 'My Workspace' }}</span>
      <n-icon :size="12" class="chevron" :class="{ open: isOpen }"><ChevronUpOutline /></n-icon>
    </button>

    <!-- 弹出选项框 -->
    <Teleport to="body">
      <div v-if="isOpen" class="picker-overlay" @click.self="close"></div>
      <Transition name="popup">
        <div v-if="isOpen" class="folder-popup" :style="popupStyle">
          <!-- 顶部添加按钮 -->
          <button class="add-folder-btn" @click="addFolder">
            <n-icon :size="14"><AddOutline /></n-icon>
            <span>New Folder</span>
          </button>

          <div class="divider"></div>

          <!-- 文件夹列表 -->
          <ul class="folder-list">
            <li
              v-for="folder in noteStore.folders"
              :key="folder.id"
              class="folder-item"
              :class="{ active: noteStore.currentFolderId === folder.id, editing: editingId === folder.id }"
              @click="selectFolder(folder.id)"
            >
              <n-icon :size="14" class="folder-icon"><FolderOutline /></n-icon>

              <span
                class="folder-item-name"
                :contenteditable="editingId === folder.id"
                :ref="el => setItemRef(folder.id, el)"
                @blur="finishEdit(folder.id, $event)"
                @keydown.enter.prevent="finishEdit(folder.id, $event)"
                @keydown.esc.prevent="cancelEdit(folder.id)"
                @click.stop="editingId === folder.id ? null : selectFolder(folder.id)"
              >{{ folder.name }}</span>

              <!-- 操作按钮（非编辑态显示，default 文件夹隐藏删除） -->
              <div v-if="editingId !== folder.id" class="folder-actions" @click.stop>
                <button
                  class="action-btn rename-btn"
                  title="重命名"
                  @click.stop="startEdit(folder.id)"
                >
                  <n-icon :size="12"><PencilOutline /></n-icon>
                </button>
                <button
                  v-if="folder.id !== 'default'"
                  class="action-btn delete-btn"
                  :class="{ confirming: confirmDeleteId === folder.id }"
                  :title="confirmDeleteId === folder.id ? '再次点击确认删除' : '删除'"
                  @click.stop="handleDelete(folder.id)"
                >
                  <n-icon :size="12">
                    <TrashOutline v-if="confirmDeleteId !== folder.id" />
                    <AlertCircleOutline v-else />
                  </n-icon>
                </button>
              </div>

              <n-icon v-if="noteStore.currentFolderId === folder.id && editingId !== folder.id" :size="13" class="check-icon"><CheckmarkOutline /></n-icon>
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  FolderOutline, FolderOpenOutline, AddOutline, CheckmarkOutline,
  ChevronUpOutline, PencilOutline, TrashOutline, AlertCircleOutline
} from '@vicons/ionicons5'
import { useNoteStore } from '../../store/note'

const noteStore = useNoteStore()
const isOpen = ref(false)
const editingId = ref<string | null>(null)
const triggerEl = ref<HTMLElement | null>(null)
const itemRefs = ref<Record<string, HTMLElement>>({})
const confirmDeleteId = ref<string | null>(null)
let confirmTimer: ReturnType<typeof setTimeout> | null = null

const currentFolder = computed(() =>
  noteStore.folders.find(f => f.id === noteStore.currentFolderId)
)

const popupStyle = computed(() => {
  if (!triggerEl.value) return {}
  const rect = triggerEl.value.getBoundingClientRect()
  return {
    position: 'fixed' as const,
    left: `${rect.left}px`,
    bottom: `${window.innerHeight - rect.top + 6}px`,
    width: '220px',
  }
})

const setItemRef = (id: string, el: unknown) => {
  if (el) itemRefs.value[id] = el as HTMLElement
}

const toggle = (e: MouseEvent) => {
  triggerEl.value = e.currentTarget as HTMLElement
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    editingId.value = null
    clearConfirm()
  }
}

const close = () => {
  isOpen.value = false
  editingId.value = null
  clearConfirm()
}

const selectFolder = (id: string) => {
  if (editingId.value) return
  clearConfirm()
  noteStore.setCurrentFolder(id)
  close()
}

const addFolder = async () => {
  const folder = noteStore.createFolder('New Folder')
  await nextTick()
  startEdit(folder.id)
}

const startEdit = async (id: string) => {
  clearConfirm()
  editingId.value = id
  await nextTick()
  const el = itemRefs.value[id]
  if (el) {
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }
}

const finishEdit = (id: string, e: Event) => {
  const el = e.target as HTMLElement
  const name = el.textContent?.trim() || 'New Folder'
  noteStore.updateFolder(id, name)
  editingId.value = null
}

const cancelEdit = (id: string) => {
  // 恢复原始名称
  const folder = noteStore.folders.find(f => f.id === id)
  const el = itemRefs.value[id]
  if (el && folder) el.textContent = folder.name
  editingId.value = null
}

// 删除：两次点击确认
const handleDelete = (id: string) => {
  if (confirmDeleteId.value === id) {
    noteStore.deleteFolder(id)
    clearConfirm()
  } else {
    clearConfirm()
    confirmDeleteId.value = id
    // 3 秒后自动取消确认
    confirmTimer = setTimeout(() => {
      confirmDeleteId.value = null
    }, 3000)
  }
}

const clearConfirm = () => {
  if (confirmTimer) { clearTimeout(confirmTimer); confirmTimer = null }
  confirmDeleteId.value = null
}
</script>

<style scoped>
.folder-picker-wrapper {
  position: relative;
  display: inline-flex;
}

.folder-trigger {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 5px;
  transition: all 0.18s ease;
  max-width: 160px;
}

.folder-trigger:hover {
  background-color: var(--button-hover-bg);
  color: var(--text-primary);
}

.folder-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 110px;
}

.chevron {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}
.chevron.open {
  transform: rotate(180deg);
}

/* 遮罩 */
.picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}

/* 弹出框 */
.folder-popup {
  z-index: 1000;
  background: var(--popup-bg, #1e293b);
  border: 1px solid var(--border-color, #334155);
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.35);
  overflow: hidden;
}

.add-folder-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 7px 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color, #0ea5e9);
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  transition: background 0.15s;
}
.add-folder-btn:hover {
  background: rgba(14,165,233,0.1);
}

.divider {
  height: 1px;
  background: var(--border-color, #334155);
  margin: 4px 4px;
}

.folder-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 220px;
  overflow-y: auto;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  color: var(--text-secondary, #cbd5e1);
  font-size: 12px;
  position: relative;
}

.folder-item:hover {
  background: var(--button-hover-bg, #334155);
  color: var(--text-primary, #f1f5f9);
}

.folder-item:hover .folder-actions {
  opacity: 1;
  pointer-events: all;
}

.folder-item.active {
  color: var(--text-primary, #f1f5f9);
  font-weight: 600;
}

.folder-item.editing {
  background: var(--button-hover-bg, #334155);
}

.folder-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.folder-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  outline: none;
  border-radius: 3px;
  min-width: 0;
}

.folder-item-name[contenteditable="true"] {
  background: var(--button-active-bg, #475569);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--text-primary, #f1f5f9);
  white-space: nowrap;
  overflow: visible;
  box-shadow: 0 0 0 1.5px var(--accent-color, #0ea5e9);
}

/* 操作按钮组 */
.folder-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
  flex-shrink: 0;
  margin-left: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  transition: background 0.15s, color 0.15s;
  padding: 0;
}

.rename-btn {
  color: var(--text-secondary, #94a3b8);
}
.rename-btn:hover {
  background: rgba(148,163,184,0.15);
  color: var(--text-primary, #f1f5f9);
}

.delete-btn {
  color: var(--text-secondary, #94a3b8);
}
.delete-btn:hover {
  background: rgba(239,68,68,0.15);
  color: #f87171;
}
.delete-btn.confirming {
  background: rgba(239,68,68,0.2);
  color: #f87171;
  animation: pulse 0.6s ease infinite alternate;
}

@keyframes pulse {
  from { background: rgba(239,68,68,0.15); }
  to   { background: rgba(239,68,68,0.35); }
}

.check-icon {
  flex-shrink: 0;
  color: var(--accent-color, #0ea5e9);
  margin-left: auto;
}

/* popup 动画 */
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
