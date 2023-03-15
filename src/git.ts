import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const cleanStdout = (out: string): string[] => {
  return out.trim().split('\n').filter(Boolean)
}

export async function getChangedFiles(): Promise<string[]> {
  const { stdout } = await execAsync('git status --porcelain')
  return cleanStdout(stdout).map(line => line.split(' ')[line.split(' ').length - 1])
}

export async function getStagedFiles(): Promise<string[]> {
  const { stdout } = await execAsync('git diff --cached --name-only')
  return cleanStdout(stdout)
}

export async function gitCommit({ commit }: { commit: string }): Promise<void> {
  await execAsync(`git commit -m "${commit}"`)
}

export async function gitAdd({ files }: { files: string[] }): Promise<void> {
  await execAsync(`git add ${files.join(' ')}`)
}
