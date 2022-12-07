import parseMilliseconds from 'parse-ms';

const pluralize = count => count !== 1;

export const timeUnitStrings = {
	ky: {short: 'ky', singular: 'millennium', plural: 'millennia'},
	c: {short: 'c', singular: 'century', plural: 'centuries'},
	Y: {short: 'y', singular: 'year', plural: 'years'},
	M: {short: 'M', singular: 'month', plural: 'months'},
	W: {short: 'w', singular: 'week', plural: 'weeks'},
	D: {short: 'd', singular: 'day', plural: 'days'},
	h: {short: 'h', singular: 'hour', plural: 'hours'},
	m: {short: 'm', singular: 'minute', plural: 'minutes'},
	s: {short: 's', singular: 'second', plural: 'seconds'},
	ms: {short: 'ms', singular: 'millisecond', plural: 'milliseconds'},
	µs: {short: 'µs', singular: 'microsecond', plural: 'microseconds'},
	ns: {short: 'ns', singular: 'nanosecond', plural: 'nanoseconds'},
	ps: {short: 'ps', singular: 'picosecond', plural: 'picoseconds'},
};
function normalizeParameters(milliseconds, options) {
	if (!Number.isFinite(milliseconds)) {
		throw new TypeError('Expected a finite number');
	}

	if (options.colonNotation) {
		options.compact = false;
		options.formatSubMilliseconds = false;
		options.separateMilliseconds = false;
		options.verbose = false;
	}

	if (options.compact) {
		options.unitCount = 1;
		options.secondsDecimalDigits = 0;
		options.millisecondsDecimalDigits = 0;
	}
}

export default function prettyMilliseconds(milliseconds, options = {}) {
	normalizeParameters(milliseconds, options);

	const result = [];
	const ctx = {result, options};
	const parsed = parseMilliseconds(milliseconds, {
		upToUnit: options.upToUnit || 'days',
		downToUnit: options.downToUnit || 'picoseconds',
	});

	if (options.upToUnit) {
		add(parsed.millennia, 'ky', ctx);
		add(parsed.centuries, 'c', ctx);
		add(parsed.years, 'Y', ctx);
		add(parsed.months, 'M', ctx);
		add(parsed.weeks, 'W', ctx);
		add(parsed.days, 'D', ctx);
		add(parsed.hours, 'h', ctx);
		add(parsed.minutes, 'm', ctx);
	} else {
		add(Math.trunc((parsed.days || 0) / 365), 'Y', ctx);
		add((parsed.days || 0) % 365, 'D', ctx);
		add(parsed.hours, 'h', ctx);
		add(parsed.minutes, 'm', ctx);
	}

	if (
		options.separateMilliseconds
		|| options.formatSubMilliseconds
		|| (!options.colonNotation && milliseconds < 1000)
	) {
		add(parsed.seconds, 's', ctx);
		if (options.formatSubMilliseconds) {
			add(parsed.milliseconds, 'ms', ctx);
			add(parsed.microseconds, 'µs', ctx);
			add(parsed.nanoseconds, 'ns', ctx);
			add(parsed.picoseconds, 'ps', ctx);
		} else {
			mixMillisecondsAndBelow(ctx, parsed);
		}
	} else {
		mixSecondsAndBelow(ctx, milliseconds);
	}

	if (result.length === 0) {
		return '0' + chooseSuffix('ms', 0, options);
	}

	if (options.verbose && result.length > 1) {
		return buildVerboseString(result, options);
	}

	if (typeof options.unitCount === 'number') {
		const separator = options.colonNotation ? '' : ' ';
		return result.slice(0, Math.max(options.unitCount, 1)).join(separator);
	}

	return options.colonNotation ? result.join('') : result.join(' ');
}

function buildVerboseString(result, options) {
	const VERBOSE_SEPARATOR = typeof options.verboseSeparator === 'undefined' ? ' ' : options.verboseSeparator;
	const VERBOSE_LAST_SEPARATOR = typeof options.verboseLastSeparator === 'undefined' ? ' ' : options.verboseLastSeparator;
	const xoIsTooRigid = result.length;
	const lastShownUnitIndex = options.unitCount || xoIsTooRigid;
	return (String(result.slice(0, lastShownUnitIndex - 1).join(VERBOSE_SEPARATOR))
			+ VERBOSE_LAST_SEPARATOR
			+ result[Math.min(result.length - 1, (options.unitCount || 99) - 1)]).trim();
}

function chooseSuffix(unitKey, value, options) {
	const pluralizeFunc = typeof options.pluralizeFunc === 'undefined' ? pluralize : options.pluralizeFunc;
	if (options.verbose) {
		let suffix = ' ';
		suffix += pluralizeFunc(value) ? timeUnitStrings[unitKey].plural : timeUnitStrings[unitKey].singular;
		return suffix;
	}

	return timeUnitStrings[unitKey].short;
}

function floorDecimals(value, decimalDigits) {
	const SECOND_ROUNDING_EPSILON = 0.000_000_000_1;
	const flooredInterimValue = Math.floor((value * (10 ** decimalDigits)) + SECOND_ROUNDING_EPSILON);
	const flooredValue = Math.round(flooredInterimValue) / (10 ** decimalDigits);
	return flooredValue.toFixed(decimalDigits);
}

function mixMillisecondsAndBelow(ctx, parsed) {
	const {options} = ctx;
	const millisecondsAndBelow
			= (parsed.milliseconds || 0)
			+ ((parsed.microseconds || 0) / 1000)
			+ ((parsed.nanoseconds || 0) / 1e6)
			+ ((parsed.picoseconds || 0) / 1e9);

	const millisecondsDecimalDigits
			= typeof options.millisecondsDecimalDigits === 'number'
				? options.millisecondsDecimalDigits
				: 0;

	const roundedMilliseconds = Math.round(millisecondsAndBelow);

	const millisecondsString = millisecondsDecimalDigits
		? millisecondsAndBelow.toFixed(millisecondsDecimalDigits)
		: roundedMilliseconds;

	add(
		Number.parseFloat(millisecondsString),
		'ms', ctx,
		millisecondsString,
	);
}

function mixSecondsAndBelow(ctx, milliseconds) {
	const {options} = ctx;
	const seconds = (milliseconds % (60 * 1000)) / 1000;
	const secondsDecimalDigits
			= typeof options.secondsDecimalDigits === 'number'
				? options.secondsDecimalDigits
				: 1;
	const secondsFixed = floorDecimals(seconds, secondsDecimalDigits);
	const secondsString = options.keepDecimalsOnWholeSeconds
		? secondsFixed
		: secondsFixed.replace(/\.0+$/, '');
	add(Number.parseFloat(secondsString), 's', ctx, secondsString);
}

function add(value, unitKey, ctx, valueString) {
	const {result, options} = ctx;
	if (!value && (result.length === 0 || !options.colonNotation) && !(options.colonNotation && unitKey === 'm')) {
		return;
	}

	valueString = (valueString || value || '0').toString();
	let prefix;
	let suffix;
	if (options.colonNotation) {
		prefix = result.length > 0 ? ':' : '';
		suffix = '';
		const wholeDigits = valueString.includes('.') ? valueString.split('.')[0].length : valueString.length;
		const minLength = result.length > 0 ? 2 : 1;
		valueString = '0'.repeat(Math.max(0, minLength - wholeDigits)) + valueString;
	} else {
		prefix = '';
		suffix = chooseSuffix(unitKey, value || 0, options);
	}

	result.push(prefix + valueString + suffix);
}
