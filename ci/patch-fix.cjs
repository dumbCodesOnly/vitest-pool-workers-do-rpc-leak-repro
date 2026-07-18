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

// CANDIDATE FIX: return await instead of return, to avoid the extra
// PromiseResolveThenableJob microtask hop that leaves boom()'s already-live
// rejection unobserved for one tick (see Notion mem0:issue-workers-sdk-14736).
const replacement = [
	'function getRPCPropertyCallableThenable(key, property) {',
	'\tconst fn = async function(...args) {',
	'\t\tconst maybeFn = await property;',
	'\t\tif (typeof maybeFn === "function") return await maybeFn(...args);',
	'\t\telse throw new TypeError(`${JSON.stringify(key)} is not a function.`);',
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
