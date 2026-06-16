import Dexie, { type Table } from 'dexie'
import type { EditMeta } from '../types'

class LatarDB extends Dexie {
  edits!: Table<EditMeta, number>

  constructor() {
    super('latar')
    this.version(1).stores({
      edits: '++id, createdAt',
    })
  }
}

export const db = new LatarDB()

export async function saveEdit(meta: Omit<EditMeta, 'id'>): Promise<number> {
  return await db.edits.add(meta as EditMeta)
}

export async function listEdits(limit = 12): Promise<EditMeta[]> {
  return await db.edits.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function deleteEdit(id: number): Promise<void> {
  await db.edits.delete(id)
}

export async function clearEdits(): Promise<void> {
  await db.edits.clear()
}
