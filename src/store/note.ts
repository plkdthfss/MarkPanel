export interface Note {
  id: string
  title: string
  //category: string
  content: string
  timestamp: number
  //isFavorite: boolean
  //tags?: string[]
}

export type TabType = 'all' | 'favorites' | 'pinned'
