import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://catai.marliere.dev',
  integrations: [tailwind({ applyBaseStyles: false })],
});
