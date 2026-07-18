import { env, runInDurableObject } from 'cloudflare:test';
import { it, expect } from 'vitest';

// The rejection is fully handled in every one of these. Nothing floats.

it('A: try/catch around a rejecting DO RPC', async () => {
	const stub = env.COUNTER.get(env.COUNTER.idFromName('a'));
	let caught: unknown;
	try {
		await stub.boom();
	} catch (e) {
		caught = e;
	}
	expect((caught as Error).message).toContain('boom');
});

it('B: expect(...).rejects, the idiomatic vitest form', async () => {
	const stub = env.COUNTER.get(env.COUNTER.idFromName('b'));
	await expect(stub.boom()).rejects.toThrow('boom');
});

it('C: .catch() attached directly to the returned promise', async () => {
	const stub = env.COUNTER.get(env.COUNTER.idFromName('c'));
	const msg = await stub.boom().catch((e: Error) => e.message);
	expect(msg).toContain('boom');
});

it('D: runInDurableObject (the pool escape hatch)', async () => {
	const stub = env.COUNTER.get(env.COUNTER.idFromName('d'));
	await runInDurableObject(stub, async (instance: any) => {
		await expect(instance.boom()).rejects.toThrow('boom');
	});
});

it('E: control -- resolves, never rejects', async () => {
	const stub = env.COUNTER.get(env.COUNTER.idFromName('e'));
	await expect(stub.fine()).resolves.toBe('ok');
});

it('F: two handled rejecting calls in one test', async () => {
	const stub = env.COUNTER.get(env.COUNTER.idFromName('f'));
	await expect(stub.boom()).rejects.toThrow('boom');
	await expect(stub.boom()).rejects.toThrow('boom');
});

it('G: property access only -- never called', async () => {
	const stub = env.COUNTER.get(env.COUNTER.idFromName('g'));
	const f = stub.boom;
	expect(typeof f).toBe('function');
});
