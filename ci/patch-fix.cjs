const fs = require("fs");

const path = "node_modules/@cloudflare/vitest-pool-workers/dist/worker/lib/cloudflare/test-internal.mjs";
let c = fs.readFileSync(path, "utf8");

const needle = [
	'function getRPCPropertyCallableThenable(key, property) {',
	'\tconst fn = async function(...args) {',
	'\t\tconst maybeFn = await property;',
	'\t\tif (typeof maybeFn === "function") return maybeFn(...args);',
	'\t\telse throw new TypeError(`${JSON.stringify(key)} is not a function.`);',
	'\t};',
	'\tfn.then = (onFulfilled, onRejected) => property.then(onFulfilled, onRejected);',
	'\tfn.catch = (onRejected) => property.catch(onRejected);',
	'\tfn.finally = (onFinally) => property.finally(onFinally);',
	'\treturn fn;',
	'}',
].join('\n');

// DIAGNOSTIC v2 (not a real fix): defer settlement by one extra microtask via
// queueMicrotask, to test whether the leak is timing-sensitive (would change
// error count) or structural (count stays identical regardless of tick delay).
// Candidate fix #1 (return await) was tested in run #15/#18 and made ZERO
// difference -- see Notion mem0:issue-workers-sdk-14736 for why that's expected
// under modern V8. This is a different, deliberately-heavier probe.
const replacement = [
	'function getRPCPropertyCallableThenable(key, property) {',
	'\tconst fn = async function(...args) {',
	'\t\tconst maybeFn = await property;',
	'\t\tif (typeof maybeFn === "function") {',
	'\t\t\treturn new Promise((resolve, reject) => {',
	'\t\t\t\tconst p = maybeFn(...args);',
	'\t\t\t\tqueueMicrotask(() => { p.then(resolve, reject); });',
	'\t\t\t});',
	'\t\t} else throw new TypeError(`${JSON.stringify(key)} is not a function.`);',
	'\t};',
	'\tfn.then = (onFulfilled, onRejected) => property.then(onFulfilled, onRejected);',
	'\tfn.catch = (onRejected) => property.catch(onRejected);',
	'\tfn.finally = (onFinally) => property.finally(onFinally);',
	'\treturn fn;',
	'}',
].join('\n');

const count = c.split(needle).length - 1;
if (count !== 1) {
	console.error(`PATCH FAILED: expected 1 match, found ${count}`);
	process.exit(1);
}
c = c.replace(needle, replacement);
fs.writeFileSync(path, c);
console.log("Fix patch (return await) applied successfully");
