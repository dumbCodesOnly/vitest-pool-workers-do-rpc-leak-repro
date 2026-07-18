import { defineConfig } from 'vitest/config';
import { cloudflareTest, cloudflarePool } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
	plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' } })],
	test: {
		globals: true,
		include: ['src/**/*.test.ts'],
		pool: cloudflarePool({ wrangler: { configPath: './wrangler.jsonc' } }),
	},
});
