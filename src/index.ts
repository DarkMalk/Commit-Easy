import { intro, outro, text, select, isCancel, cancel, confirm, multiselect } from '@clack/prompts'
import { getChangedFiles, getStagedFiles, gitCommit, gitAdd } from './git.js'
import { COMMIT_TYPES } from './commit-types.js'
import { type commitTypes } from './types.js'
import { trytm } from '@bdsqqq/try'
import colors from 'picocolors'

intro(colors.inverse(` Asistente para la creación de commits ${colors.blue(' @commit-easy ')}`))

const [changedFiles, errorChangedFiles] = await trytm(getChangedFiles())
const [stagedFiles, errorStagedFiles] = await trytm(getStagedFiles())

if (errorChangedFiles ?? errorStagedFiles) {
  outro(colors.bgRed('Error: Comprueba que estas en un repositorio de git'))
  process.exit(1)
}

if (stagedFiles.length === 0) {
  const files = await multiselect({
    message: `${colors.blue('Selecciona un archivo para realizar commit')}`,
    options: changedFiles.map(file => ({
      label: file,
      value: file
    }))
  })
  if (isCancel(files)) {
    cancel('No se ha seleccionado ningún archivo')
    process.exit(0)
  }
  await gitAdd({ files: files as string[] })
}

const commitType: string | symbol = await select({
  message: colors.blue('Selecciona el tipo de commit'),
  options: Object.entries(COMMIT_TYPES).map(([key, value]): { value: string; label: string } => ({
    value: key,
    label: `${value.emoji} ${key.padEnd(8, ' ')} - ${value.description}`
  }))
})

if (isCancel(commitType)) {
  cancel('No se ha seleccionado ningún tipo de commit')
  process.exit(0)
}

const commitMsg: string | symbol = await text({
  message: colors.blue('Introduce el mensaje del commit:'),
  placeholder: 'Add new feature',
  validate: value => {
    if (value.length === 0 || !value.trim()) return 'El mensaje no puede estar vacío'
    if (value.length > 50) return 'El mensaje no puede tener más de 50 caracteres'
  }
})

if (isCancel(commitMsg)) {
  cancel('No se ha creado ningún commit')
  process.exit(0)
}

const { emoji, release } = COMMIT_TYPES[commitType as commitTypes]
let breakingChange: boolean | symbol = false
if (release) {
  breakingChange = await confirm({
    initialValue: false,
    message: `${colors.blue('¿Tiene este commit cambios que rompan la compatibilidad anterior?')}
    
    ${colors.yellow('Si la respuesta es sí, deberías crear un commit con el tipo "BREAKING CHANGE"')}`
  })
}

if (isCancel(breakingChange)) {
  cancel('No se ha creado ningún commit')
  process.exit(0)
}

let commit: string = `${emoji} ${commitType}: ${commitMsg}`
commit = breakingChange ? `${commit} [Breaking change]` : commit

const shouldContinue = await confirm({
  initialValue: true,
  message: `${colors.blue('¿Quieres crear el commit con el siguiente mensaje?')}
  
  ${colors.green(colors.bold(commit))}
  
  ${colors.blue('¿Confirmas?')}`
})

if (isCancel(shouldContinue) || !shouldContinue) {
  cancel('No se ha creado el commit')
  process.exit(1)
}

await gitCommit({ commit })

outro(colors.green('✅ Commit creado, gracias por utilizar commit-easy'))
