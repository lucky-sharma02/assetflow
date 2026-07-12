export interface Department {
  id: string
  name: string
  headId: string | null
  head: { id: string; name: string; email: string } | null
  createdAt: string
  updatedAt: string
  _count: { members: number; assets: number }
}
