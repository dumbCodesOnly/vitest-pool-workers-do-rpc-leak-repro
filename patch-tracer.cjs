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

const replacement = [
	'function getRPCPropertyCallableThenable(key, property) {',
	'\tconst fn = async function(...args) {',
	'\t\tconsole.error("TRACER:CALL", key);',
	'\t\tconst maybeFn = await property;',
	'\t\tif (typeof maybeFn === "function") {',
	'\t\t\tconsole.error("TRACER:REAL_INVOKE", key);',
	'\t\t\treturn maybeFn(...args);',
	'\t\t} else {',
	'\t\t\tthrow new TypeError(`${JSON.stringify(key)} is not a function.`);',
	'\t\t}',
	'\t};',
	'\tfn.then = (onFulfilled, onRejected) => { console.error("TRACER:THEN", key); return property.then(onFulfilled, onRejected); };',
	'\tfn.catch = (onRejected) => { console.error("TRACER:CATCH", key); return property.catch(onRejected); };',
	'\tfn.finally = (onFinally) => { console.error("TRACER:FINALLY", key); return property.finally(onFinally); };',
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
console.log("Tracer patch applied successfully");
