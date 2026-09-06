import test from 'ava';
import chalk, {Chalk, chalkStderr} from '../source/index.js';

chalk.level = 3;
chalkStderr.level = 3;

test('register and use a theme', t => {
	chalk.registerTheme('basicError', theme => theme.bold.red);

	t.is(chalk.theme('basicError')('foo'), '\u{1B}[1m\u{1B}[31mfoo\u{1B}[39m\u{1B}[22m');
	t.is(chalk.theme('basicError')('foo'), chalk.bold.red('foo'));
});

test('theme styles compose with styles applied after the theme', t => {
	chalk.registerTheme('composableError', theme => theme.bold.red);

	t.is(chalk.theme('composableError').underline('foo'), chalk.bold.red.underline('foo'));
	t.is(chalk.theme('composableError').underline('foo'), '\u{1B}[1m\u{1B}[31m\u{1B}[4mfoo\u{1B}[24m\u{1B}[39m\u{1B}[22m');
	t.is(chalk.theme('composableError').hex('#00FF00')('foo'), chalk.bold.red.hex('#00FF00')('foo'));
});

test('theme styles compose with styles applied before the theme', t => {
	chalk.registerTheme('orderBold', theme => theme.bold);

	t.is(chalk.red.theme('orderBold')('foo'), chalk.red.bold('foo'));
	t.is(chalk.red.theme('orderBold')('foo'), '\u{1B}[31m\u{1B}[1mfoo\u{1B}[22m\u{1B}[39m');
});

test('themes can be nested', t => {
	chalk.registerTheme('outer', theme => theme.red);
	chalk.registerTheme('inner', theme => theme.bgBlue.underline);

	t.is(chalk.theme('outer')('a' + chalk.theme('inner')('b') + 'c'), chalk.red('a' + chalk.bgBlue.underline('b') + 'c'));
});

test('theme styles resolve the color level at use time', t => {
	const instance = new Chalk({level: 3});
	instance.registerTheme('truecolor', theme => theme.hex('#FF0000'));

	t.is(instance.theme('truecolor')('hello'), '\u{1B}[38;2;255;0;0mhello\u{1B}[39m');

	instance.level = 2;
	t.is(instance.theme('truecolor')('hello'), '\u{1B}[38;5;196mhello\u{1B}[39m');

	instance.level = 1;
	t.is(instance.theme('truecolor')('hello'), '\u{1B}[91mhello\u{1B}[39m');

	instance.level = 0;
	t.is(instance.theme('truecolor')('hello'), 'hello');
});

test('use an unregistered theme throws', t => {
	t.throws(() => chalk.theme('nonexistent')('foo'), {message: 'Unknown Chalk theme: "nonexistent"'});
});

test('the theme name must be a non-empty string', t => {
	for (const name of ['', 42, undefined]) {
		t.throws(() => chalk.theme(name), {message: 'The theme name must be a non-empty string', instanceOf: TypeError}, `name: ${String(name)}`);
		t.throws(() => chalk.registerTheme(name, theme => theme.red), {message: 'The theme name must be a non-empty string', instanceOf: TypeError}, `registerTheme name: ${String(name)}`);
	}
});

test('the theme builder must be a function returning a style chain', t => {
	t.throws(() => chalk.registerTheme('badBuilder', 'not a function'), {message: 'The theme builder must be a function, e.g. `theme => theme.bold.red`', instanceOf: TypeError});
	t.throws(() => chalk.registerTheme('badBuilder', theme => theme.red('foo')), {message: 'The theme builder must return a style chain, not styled text', instanceOf: TypeError});

	// No theme is registered when validation fails
	t.throws(() => chalk.theme('badBuilder'), {message: 'Unknown Chalk theme: "badBuilder"'});
});

test('re-registering a theme replaces it', t => {
	chalk.registerTheme('replaceable', theme => theme.red);
	chalk.registerTheme('replaceable', theme => theme.blue);

	t.is(chalk.theme('replaceable')('foo'), '\u{1B}[34mfoo\u{1B}[39m');
});

test('theme registries are per instance', t => {
	const instance = new Chalk({level: 3});
	instance.registerTheme('isolated', theme => theme.green);
	chalkStderr.registerTheme('stderrOnly', theme => theme.yellow);

	t.is(instance.theme('isolated')('foo'), '\u{1B}[32mfoo\u{1B}[39m');
	t.is(chalkStderr.theme('stderrOnly')('foo'), '\u{1B}[33mfoo\u{1B}[39m');

	t.throws(() => chalkStderr.theme('isolated'), {message: 'Unknown Chalk theme: "isolated"'});
	t.throws(() => instance.theme('stderrOnly'), {message: 'Unknown Chalk theme: "stderrOnly"'});
});

test('themes support multiple arguments and empty input', t => {
	chalk.registerTheme('multi', theme => theme.green);

	t.is(chalk.theme('multi')('foo', 'bar'), '\u{1B}[32mfoo bar\u{1B}[39m');
	t.is(chalk.theme('multi')(), '');
	t.is(chalk.theme('multi')(''), '');
});

test('`visible` inside a theme stays level aware', t => {
	const instance = new Chalk({level: 3});
	instance.registerTheme('cosmetic', theme => theme.visible.green);

	t.is(instance.theme('cosmetic')('foo'), '\u{1B}[32mfoo\u{1B}[39m');

	instance.level = 0;
	t.is(instance.theme('cosmetic')('foo'), '');
});

test('theme builders keep Function.prototype methods', t => {
	chalk.registerTheme('functional', theme => theme.grey);

	const themed = chalk.theme('functional');
	t.is(Reflect.apply(themed, null, ['foo']), '\u{1B}[90mfoo\u{1B}[39m');
	t.is(themed.bind(null)('foo'), '\u{1B}[90mfoo\u{1B}[39m');
	t.is(Reflect.apply(themed, null, []), '');
});
