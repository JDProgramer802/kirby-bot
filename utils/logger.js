// Logger kawaii con colores (placeholders, sin implementación)
import chalk from 'chalk'

const prefix = chalk.magenta('Kirby Dream')

export const banner = () => {
  const heart = chalk.magenta('❤')
  console.log(chalk.bold.magenta(`\n${'='.repeat(36)}\n   (＾• ω •＾) ${heart} Kirby Dream ${heart}\n${'='.repeat(36)}\n`))
}

export const info = (...args) => console.log(chalk.cyan('ℹ'), prefix, ...args)
export const success = (...args) => console.log(chalk.green('✔'), prefix, ...args)
export const warn = (...args) => console.log(chalk.yellow('⚠'), prefix, ...args)
export const error = (...args) => console.log(chalk.red('✖'), prefix, ...args)
export const event = (...args) => console.log(chalk.magenta('✿'), prefix, ...args)

export default { banner, info, success, warn, error, event }
