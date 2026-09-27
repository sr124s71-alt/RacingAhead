// Builds the Lit front end.
//   node build.mjs proto          -> dist/proto: shareable prototype, Identity API runs in the browser
//   node build.mjs live           -> dist/live: talks to the .NET API (API_URL, default http://localhost:5080)
//   node build.mjs live --serve   -> serves dist/live on http://localhost:8082 with rebuild on change
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

const mode = process.argv[2] === 'live' ? 'live' : 'proto';
const outdir = `dist/${mode}`;
mkdirSync(outdir, { recursive: true });
copyFileSync('index.html', `${outdir}/index.html`);

const options = {
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2022',
  outfile: `${outdir}/app.js`,
  legalComments: 'none',
  define: {
    __MOCK__: String(mode === 'proto'),
    __API_URL__: JSON.stringify(mode === 'proto' ? 'in-browser prototype API' : (process.env.API_URL ?? 'http://localhost:5080')),
  },
};

if (process.argv.includes('--serve')) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: outdir, port: 8082 });
  console.log(`Serving ${outdir} on http://localhost:${port}`);
} else {
  await esbuild.build(options);
  console.log(`Built ${outdir}`);
}
