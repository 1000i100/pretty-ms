import {expectType} from 'tsd';
import prettyMilliseconds, {timeUnitStrings, type TimeUnitStrings} from './index.mjs';

expectType<TimeUnitStrings>(timeUnitStrings);

expectType<string>(timeUnitStrings.ky.short);
expectType<string>(timeUnitStrings.D.singular);
expectType<string>(timeUnitStrings.ps.plural);

expectType<string>(prettyMilliseconds(1_335_669_000));
expectType<string>(prettyMilliseconds(1_335_669_000, {secondsDecimalDigits: 1}));
expectType<string>(
	prettyMilliseconds(1_335_669_000, {millisecondsDecimalDigits: 2}),
);
expectType<string>(
	prettyMilliseconds(1_335_669_000, {keepDecimalsOnWholeSeconds: true}),
);
expectType<string>(prettyMilliseconds(1337, {compact: true}));
expectType<string>(prettyMilliseconds(1_335_669_000, {unitCount: 2}));
expectType<string>(prettyMilliseconds(1_335_669_000, {verbose: true}));
expectType<string>(
	prettyMilliseconds(1_335_669_000, {separateMilliseconds: true}),
);
expectType<string>(
	prettyMilliseconds(1_335_669_000, {formatSubMilliseconds: true}),
);
expectType<string>(
	prettyMilliseconds(1_335_669_000, {colonNotation: true}),
);
