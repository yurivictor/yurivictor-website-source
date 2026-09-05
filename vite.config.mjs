import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const src = path => fileURLToPath( new URL( path, import.meta.url ) );

// Step 2 of ROADMAP.md: Vite bundles JS and serves dev; the SCSS pipeline and
// index.html are still handled outside it. Fonts are referenced from SCSS as
// absolute paths ( url( '/assets/...' ) ) that Vite would try to resolve at
// build time, and index.html is copied verbatim by build:copy-html.
export default defineConfig( {
    // Dev serves straight out of src/, so /css, /images and /assets resolve the
    // same way they do in production.
    root: 'src',
    publicDir: false,
    plugins: [ react() ],
    server: {
        open: true
    },
    build: {
        outDir: '../dist',
        // Load-bearing. dist/CNAME and dist/images/ are committed by hand and
        // no build step regenerates them — emptying dist/ drops the custom
        // domain and every image.
        emptyOutDir: false,
        rollupOptions: {
            input: {
                main: src( 'src/js/main.js' ),
                lanyard: src( 'src/js/lanyard.js' )
            },
            output: {
                // ES rather than IIFE because two entries need to share chunks.
                // main.js has no imports of its own and still reads THREE off
                // the global set by the CDN tag, which module scope doesn't
                // change. Both entries are deferred, so their DOMContentLoaded
                // listeners still register in time.
                format: 'es',
                entryFileNames: 'js/[name].js',
                chunkFileNames: 'js/[name]-[hash].js',
                assetFileNames: 'js/assets/[name]-[hash][extname]'
            }
        }
    }
} );
