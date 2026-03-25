import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: "MarkPanel",
  version: "1.0.0",
  description: "Vue + Vite 写的侧边栏扩展",
  permissions: ["sidePanel", "activeTab", "storage"],
  action: {
    default_title: "打开侧边栏",
  },
  side_panel: {
    default_path: "index.html",        
  },
  background: {
    service_worker: "src/background/background.ts", 
    type: "module",
  },
})