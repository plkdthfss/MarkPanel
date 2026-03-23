<template>
  <div class="note-card" :class="{ 'is-active': isActive }">
    <div class="card-header">
      <h3 class="card-title">{{ note.title }}</h3>
      <span class="card-time">{{ formatTime(note.timestamp) }}</span>
    </div>
    
    <p class="card-content">{{ truncateContent(note.content) }}</p>
    
    <div class="card-footer">
      <button
        class="delete-btn"
        :title="'Delete note'"
        @click.stop="showConfirm = true"
      >
        <n-icon :size="15">
          <TrashOutline />
        </n-icon>
      </button>
    </div>

    <!-- 确认删除对话框 -->
    <Teleport to="body">
      <div v-if="showConfirm" class="confirm-overlay" @click.self="showConfirm = false">
        <div class="confirm-dialog">
          <div class="confirm-icon">
            <n-icon :size="28" color="#ef4444">
              <TrashOutline />
            </n-icon>
          </div>
          <p class="confirm-text">你确定删除 <strong>「{{ note.title }}」</strong> 笔记吗？</p>
          <p class="confirm-subtext">此操作不可撤销</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="showConfirm = false">否</button>
            <button class="btn-confirm" @click="handleDelete">是</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TrashOutline } from '@vicons/ionicons5'
import type { Note } from '../../store/note'
import { useNoteStore } from '../../store/note'

interface Props {
  note: Note
  isActive?: boolean
}

interface Emits {
  (e: 'click'): void
  (e: 'deleted'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const noteStore = useNoteStore()

const showConfirm = ref(false)

const handleDelete = () => {
  noteStore.deleteNote(props.note.id)
  showConfirm.value = false
  emit('deleted')
}

const formatTime = (timestamp: number): string => {
  const now = new Date()
  const noteDate = new Date(timestamp)
  const diffMs = now.getTime() - noteDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'JUST NOW'
  if (diffMins < 60) return `${diffMins}M AGO`
  if (diffHours < 24) return `${diffHours}H AGO`
  if (diffDays === 1) return 'YESTERDAY'
  if (diffDays < 7) return `${diffDays}D AGO`
  
  return noteDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

const truncateContent = (content: string): string => {
  const maxLength = 120
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
}
</script>

<style scoped>
.note-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--card-bg);
  color: var(--text-primary);
}

.note-card:hover {
  background-color: var(--card-hover-bg);
  border-left-color: var(--accent-color);
}

.note-card.is-active {
  background-color: var(--card-active-bg);
  border-left-color: var(--accent-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
  word-break: break-word;
  line-height: 1.4;
}

.card-time {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.card-content {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}

.card-footer {
  display: flex;
  align-items: center;
}

.delete-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 4px;
  color: var(--text-tertiary);
  font-size: 11px;
  transition: all 0.18s ease;
  opacity: 0;
}

.note-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.delete-label {
  font-size: 11px;
  font-weight: 500;
}

/* 确认对话框遮罩 */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.confirm-dialog {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 28px 32px 24px;
  width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.18s ease;
}

@keyframes slideUp {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.confirm-icon {
  margin-bottom: 4px;
}

.confirm-text {
  margin: 0;
  font-size: 14px;
  color: #f1f5f9;
  text-align: center;
  line-height: 1.6;
}

.confirm-subtext {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  text-align: center;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  width: 100%;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 8px 0;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.18s ease;
}

.btn-cancel {
  background: #334155;
  color: #cbd5e1;
}

.btn-cancel:hover {
  background: #475569;
  color: #f1f5f9;
}

.btn-confirm {
  background: #ef4444;
  color: #ffffff;
}

.btn-confirm:hover {
  background: #dc2626;
}
</style>
