const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const [inp, out, short] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + inp, { waitUntil: 'load' });
  const f = 'font-family:Arial,sans-serif;font-size:7.5px;color:#5A5A5A;width:100%;padding:0 20mm;';
  await p.pdf({ path: out, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true,
    headerTemplate: `<div style="${f}text-align:right;">SportSeek Phase 2A &nbsp;|&nbsp; ${short}</div>`,
    footerTemplate: `<div style="${f}text-align:center;">Srivin Platforms · Confidential · Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>` });
  await b.close(); console.log('pdf', out);
})();
