import { defineConfig } from 'vite';

// Step 1 of ROADMAP.md: Vite bundles JS only.
//
// The SCSS pipeline and index.html are deliberately left alone for now — fonts
// are referenced from SCSS as absolute paths ( url( '/assets/...' ) ) that Vite
// would try to resolve at build time.
export default defineConfig( {
    build: {
        outDir: 'dist/js',
        // Load-bearing. dist/CNAME and dist/images/ are committed by hand and
        // no build step regenerates them — emptying dist/ drops the custom
        // domain and every image.
        emptyOutDir: false,
        rollupOptions: {
            input: 'src/js/main.js',
            output: {
                // main.js is a classic script reading THREE off the global set
                // by the CDN tag, not an ES module. IIFE preserves that.
                format: 'iife',
                entryFileNames: 'main.js'
            }
        }
    }
} );
