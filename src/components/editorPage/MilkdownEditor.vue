<template>
  <div class="editor-container" :class="`theme-${themeMode}`">
    <div ref="editorRef" class="crepe-editor"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, watch, nextTick } from 'vue'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import '../../../assets/crep-custom.css'
import { useNoteStore } from '../../store/note'

interface Props {
  themeMode: 'light' | 'dark'
  noteId?: string
  content?: string
  initialContent?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  initialContent: '# Hello Milkdown!\n这是一段测试内容。尝试输入 `/` 来唤起斜杠菜单。'
})

const editorRef = ref<HTMLDivElement | null>(null)
const noteStore = useNoteStore()
let crepe: Crepe | null = null
let saveTimeout: ReturnType<typeof setTimeout> | null = null
// 新增：保存当前内容，避免重复创建实例
let currentContent = ''

// 核心方法：初始化/重建编辑器并渲染内容
const initEditor = async (content: string) => {
  if (!editorRef.value) return
  
  // 1. 销毁旧实例（避免内存泄漏）
  if (crepe) {
    crepe.destroy()
    crepe = null
  }

  // 2. 记录当前内容，避免重复创建
  currentContent = content

  try {
    // 3. 创建新的 Crepe 实例
    crepe = new Crepe({
      root: editorRef.value,
      features: {
        [Crepe.Feature.Toolbar]: false,
      },
      featureConfigs: {
        [Crepe.Feature.BlockEdit]: {
          handleAddIcon: '',
        },
      },
      defaultValue: content, // 直接传入要渲染的内容
    })

    // 4. 初始化编辑器
    await crepe.create()
    console.log('Milkdown Editor 初始化完成，内容已渲染')
    
    // 5. 应用主题
    applyTheme()
    
    // 6. 重新绑定自动保存（销毁实例后 observer 会失效）
    setupAutoSave()
  } catch (error) {
    console.error('编辑器初始化失败:', error)
  }
}

onMounted(async () => {
  // 初始化时优先使用 content，兜底用 initialContent
  const initContent = props.content || props.initialContent
  await initEditor(initContent)
})

const applyTheme = () => {
  if (!editorRef.value) return

  const isDark = props.themeMode === 'dark'
  const root = editorRef.value

  if (isDark) {
    root.classList.add('dark-theme')
    root.classList.remove('light-theme')
  } else {
    root.classList.add('light-theme')
    root.classList.remove('dark-theme')
  }
}

const setupAutoSave = () => {
  if (!crepe || !editorRef.value) return

  // 移除旧的 observer（如果存在）
  const oldObserver = editorRef.value.__milkdown_observer__
  if (oldObserver) {
    oldObserver.disconnect()
  }

  // 创建新的 observer
  const observer = new MutationObserver(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(() => {
      saveContent()
    }, 1000)
  })

  // 保存 observer 到 DOM 属性，方便后续销毁
  editorRef.value.__milkdown_observer__ = observer

  observer.observe(editorRef.value, {
    subtree: true,
    childList: true,
    characterData: true,
  })
}

const saveContent = async () => {
  if (!crepe || !props.noteId) return

  try {
    const content = crepe.getMarkdown()
    // 避免空保存（内容未变化时不请求）
    if (content === currentContent) return
    
    noteStore.updateNote(props.noteId, { content })
    currentContent = content
    console.log('笔记已保存')
  } catch (error) {
    console.error('保存笔记失败:', error)
  }
}

// 监听主题变化
watch(() => props.themeMode, () => {
  applyTheme()
})

// 核心修复：监听 content 变化，重建编辑器
watch(() => props.content, async (newContent) => {
  if (!newContent || newContent === currentContent) return
  
  // 确保 DOM 已更新
  await nextTick()
  await initEditor(newContent)
}, { immediate: false })

// 监听 initialContent（仅当无 content 时生效）
watch(() => props.initialContent, async (newContent) => {
  if (newContent && !props.content && newContent !== currentContent) {
    await nextTick()
    await initEditor(newContent)
  }
})

onBeforeUnmount(() => {
  // 清理计时器和 observer
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  if (editorRef.value?.__milkdown_observer__) {
    editorRef.value.__milkdown_observer__.disconnect()
  }
  // 销毁编辑器实例
  crepe?.destroy()
  crepe = null
})

// 扩展 TS 类型，避免 __milkdown_observer__ 报错
declare global {
  interface HTMLDivElement {
    __milkdown_observer__?: MutationObserver
  }
}
</script>

<style scoped>
/* 样式部分完全不变 */
.editor-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.crepe-editor {
  width: 100%;
  height: 100%;
  min-height: auto;
  overflow-y: auto;
}

.crepe-editor .milkdown {
  max-width: 100%;
  padding: 16px;
}

/* 深色主题样式 */
.editor-container.theme-dark :deep(.crepe-editor),
.editor-container.theme-dark :deep(.milkdown) {
  background-color: #0f172a;
  color: #f1f5f9;
}

.editor-container.theme-dark :deep(.milkdown-menu),
.editor-container.theme-dark :deep(.milkdown-toolbar) {
  background-color: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.editor-container.theme-dark :deep(.milkdown-menu-item),
.editor-container.theme-dark :deep(.milkdown-toolbar-item) {
  color: #cbd5e1;
}

.editor-container.theme-dark :deep(.milkdown-menu-item:hover),
.editor-container.theme-dark :deep(.milkdown-toolbar-item:hover) {
  background-color: #334155;
  color: #f1f5f9;
}

.editor-container.theme-dark :deep(.milkdown-input),
.editor-container.theme-dark :deep(.milkdown-code) {
  background-color: #1e293b;
  color: #f1f5f9;
  border-color: #334155;
}

.editor-container.theme-dark :deep(.milkdown-blockquote) {
  border-left-color: #0ea5e9;
  color: #cbd5e1;
}

/* 亮色主题样式 */
.editor-container.theme-light :deep(.crepe-editor),
.editor-container.theme-light :deep(.milkdown) {
  background-color: #f8fafc;
  color: #0f172a;
}

.editor-container.theme-light :deep(.milkdown-menu),
.editor-container.theme-light :deep(.milkdown-toolbar) {
  background-color: #ffffff;
  border-color: #e2e8f0;
  color: #0f172a;
}

.editor-container.theme-light :deep(.milkdown-menu-item),
.editor-container.theme-light :deep(.milkdown-toolbar-item) {
  color: #475569;
}

.editor-container.theme-light :deep(.milkdown-menu-item:hover),
.editor-container.theme-light :deep(.milkdown-toolbar-item:hover) {
  background-color: #f1f5f9;
  color: #0f172a;
}

.editor-container.theme-light :deep(.milkdown-input),
.editor-container.theme-light :deep(.milkdown-code) {
  background-color: #ffffff;
  color: #0f172a;
  border-color: #e2e8f0;
}

.editor-container.theme-light :deep(.milkdown-blockquote) {
  border-left-color: #0284c7;
  color: #475569;
}
</style>