import { DurableObject } from 'cloudflare:workers';

export class Counter extends DurableObject {
	async boom(): Promise<never> {
		throw new Error('boom from inside the DO');
	}
	async fine(): Promise<string> {
		return 'ok';
	}
}

export default { fetch: () => new Response('ok') };
