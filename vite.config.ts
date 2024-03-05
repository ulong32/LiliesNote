import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), purgeCss(), SvelteKitPWA()],
	define: {
		APP_VERSION : JSON.stringify(process.env.npm_package_version)
	}
});