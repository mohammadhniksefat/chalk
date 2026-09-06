import chalk from '../source/index.js';

chalk.level = 3;

chalk.registerTheme('error', theme => theme.bold.red.bgHex('#300'));
chalk.registerTheme('warning', theme => theme.bold.hex('#FFA500'));
chalk.registerTheme('info', theme => theme.blue.dim);
chalk.registerTheme('success', theme => theme.bold.green);

console.log(chalk.theme('info')('Chalk themes:'));
console.log(chalk.theme('success')('✔ success'), chalk.theme('error')('✖ error'), chalk.theme('warning')('⚠ warning'));

// Themes are regular styles: chain them, nest them, combine them in any order.
console.log(chalk.theme('info').underline('underlined info'));
console.log(chalk.underline.theme('info')('info, underlined'));
console.log(chalk.theme('info')('nested', chalk.theme('error')('error inside'), 'info'));
