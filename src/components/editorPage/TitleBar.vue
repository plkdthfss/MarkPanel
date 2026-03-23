<template>
  <div class="title-bar" ref="containerEl">
    <div
      ref="titleEl"
      class="title-input"
      contenteditable="true"
      spellcheck="false"
      :data-placeholder="'Untitled'"
      :style="{ fontSize: fontSize + 'px', whiteSpace: allowWrap ? 'pre-wrap' : 'nowrap' }"
      @input="handleInput"
      @blur="handleBlur"
      @keydown.enter.prevent="handleEnter"
      @keydown.esc.prevent="cancelEdit"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const FONT_SIZES = [500, 30, 24, 20, 17] // px, largest → smallest
const MIN_FONT  = FONT_SIZES[FONT_SIZES.length - 1]

const titleEl     = ref<HTMLElement | null>(null)
const containerEl = ref<HTMLElement | null>(null)
const fontSize    = ref(FONT_SIZES[0])
const allowWrap   = ref(false)
const originalValue = ref(props.modelValue)

// ── font-fit logic ───────────────────────────────────────────────────────────
// Try each font size in descending order; pick the first that fits in one line.
// If nothing fits even at MIN_FONT, enable wrapping.
const fitFont = async () => {
  if (!titleEl.value || !containerEl.value) return
  const el        = titleEl.value
  const maxWidth  = containerEl.value.clientWidth

  // Temporarily force nowrap so scrollWidth is meaningful
  el.style.whiteSpace = 'nowrap'
  allowWrap.value = false

  let chosen = MIN_FONT
  for (const size of FONT_SIZES) {
    el.style.fontSize = size + 'px'
    if (el.scrollWidth <= maxWidth) {
      chosen = size
      break
    }
  }

  fontSize.value = chosen

  if (chosen === MIN_FONT && el.scrollWidth > maxWidth) {
    // Still overflows at min size → allow wrapping
    allowWrap.value = true
    el.style.whiteSpace = 'pre-wrap'
  } else {
    el.style.whiteSpace = 'nowrap'
  }
  // Clear inline style; Vue binding takes over from here
  el.style.fontSize   = ''
  el.style.whiteSpace = ''
}

// ── content sync ─────────────────────────────────────────────────────────────
const syncContent = async (value: string) => {
  if (!titleEl.value) return
  if (titleEl.value.textContent !== value) {
    titleEl.value.textContent = value
  }
  await nextTick()
  fitFont()
}

onMounted(async () => {
  await nextTick()
  syncContent(props.modelValue)

  // Re-fit on container resize (e.g. window resize)
  ro = new ResizeObserver(() => fitFont())
  if (containerEl.value) ro.observe(containerEl.value)
})

let ro: ResizeObserver
onBeforeUnmount(() => ro?.disconnect())

watch(() => props.modelValue, (val) => {
  if (document.activeElement !== titleEl.value) {
    syncContent(val)
  }
})

// ── event handlers ───────────────────────────────────────────────────────────
const handleInput = () => {
  const text = titleEl.value?.textContent ?? ''
  fitFont()
  emit('update:modelValue', text.trim() || 'Untitled')
}

const handleBlur = () => {
  const text = titleEl.value?.textContent?.trim() || 'Untitled'
  if (!titleEl.value?.textContent?.trim()) {
    titleEl.value!.textContent = 'Untitled'
    fitFont()
  }
  originalValue.value = text
  emit('update:modelValue', text)
}

const handleEnter = () => {
  titleEl.value?.blur()
}

const cancelEdit = () => {
  if (titleEl.value) {
    titleEl.value.textContent = originalValue.value
    fitFont()
  }
  titleEl.value?.blur()
}
</script>

<style scoped>
.title-bar {
  padding: 28px 28px 16px 28px;
  background: var(--bg-primary);
  /* No border — it lives inside the scroll area, not fixed */
}

.title-input {
  display: block;
  width: 100%;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
  background: transparent;
  outline: none;
  border: none;
  cursor: text;
  text-align: left;
  word-break: break-word;
  overflow-wrap: break-word;
  /* font-size & white-space driven by :style binding */
  min-height: 1.2em;
  letter-spacing: -0.02em;
  transition: color 0.15s ease;
  /* hide overflow when nowrap so scrollWidth measurement isn't visible */
  overflow: hidden;
}

.title-input:empty::before {
  content: attr(data-placeholder);
  color: var(--text-tertiary, #94a3b8);
  pointer-events: none;
  font-weight: 700;
}

.title-input:focus {
  color: var(--text-primary);
  overflow: visible;
}

/* thin accent underline only while editing */
.title-bar:focus-within .title-input {
  border-bottom: 2px solid var(--accent-color, #0ea5e9);
  padding-bottom: 2px;
}
</style>
