import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

// ── Dev-server API plugin ────────────────────────────────────────────────────
//
// Exposes a Node.js route that calls writeTruthSource() so the browser-side
// React form can trigger atomic markdown file writes.
// Only active during `vite dev` — production builds exclude this entirely.

function agencyOsApiPlugin(): Plugin {
  // vite.config.ts lives in src/ — monorepo root is one level up
  const MONOREPO_ROOT = path.resolve(__dirname, '..');

  return {
    name: 'agency-os-api',

    configureServer(server) {
      server.middlewares.use(
        '/api/truth-source/business-data',
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.method !== 'POST') return next();

          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('error', (err: Error) => {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          });

          req.on('end', () => {
            // Dynamically import so Vite tree-shakes this from client bundle
            Promise.resolve()
              .then(() => import('./shared/utils/markdown-parser'))
              .then(async ({ readTruthSource, writeTruthSource }) => {
                const formData = JSON.parse(body) as Record<string, unknown>;

                // ── Read current file content (preserve all existing fields) ──
                const [seoResult, bizResult] = await Promise.all([
                  readTruthSource('seo-and-aeo', MONOREPO_ROOT),
                  readTruthSource('business-operations', MONOREPO_ROOT),
                ]);

                // ── Merge form data → 03-seo-and-aeo.md ──────────────────────
                const updatedSeo = {
                  ...seoResult.data,
                  nap: {
                    ...seoResult.data.nap,
                    business_name:  String(formData['business_name']  ?? ''),
                    street_address: String(formData['street_address'] ?? ''),
                    city:           String(formData['city']           ?? ''),
                    state:          String(formData['state']          ?? ''),
                    zip:            String(formData['zip']            ?? ''),
                    phone:          String(formData['phone']          ?? ''),
                  },
                };

                // ── Merge form data → 02-business-operations.md ──────────────
                const updatedBiz = {
                  ...bizResult.data,
                  service_radius: {
                    ...bizResult.data.service_radius,
                    primary_city: String(formData['city']  ?? ''),
                    state:        String(formData['state'] ?? ''),
                    radius_miles: Number(formData['radius_miles'] ?? 0),
                  },
                };

                // ── Atomic write (writeTruthSource validates before writing) ──
                await Promise.all([
                  writeTruthSource('seo-and-aeo', updatedSeo, seoResult.content, MONOREPO_ROOT),
                  writeTruthSource('business-operations', updatedBiz, bizResult.content, MONOREPO_ROOT),
                ]);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              })
              .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : String(err);
                console.error('[agency-os-api] write failed:', message);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: message }));
              });
          });
        },
      );
    },
  };
}

// ── Vite config ──────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    agencyOsApiPlugin(),
  ],
  resolve: {
    alias: {
      '@shared':   path.resolve(__dirname, './shared'),
      '@features': path.resolve(__dirname, './features'),
      '@/stores':  path.resolve(__dirname, './stores'),
    },
  },
});
