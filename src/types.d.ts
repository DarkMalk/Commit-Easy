export type commitTypes = 'feat' | 'fix' | 'perf' | 'refactor' | 'docs' | 'test' | 'build'
export interface commitType {
  emoji: string
  description: string
  release: boolean
}
