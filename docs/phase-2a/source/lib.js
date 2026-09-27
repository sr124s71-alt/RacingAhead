const fs = require('fs');
const d = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  HeadingLevel, BorderStyle, ImageRun, PageBreak, Header, Footer, PageNumber, PageOrientation, LevelFormat, VerticalAlign } = d;

const NAVY = '1F3864', TEAL = '0F6E7A', INK = '1A1A1A', MUTED = '5A5A5A', RULE = 'C9CED8', ZEBRA = 'F3F5F9';
const FONT = 'Arial';
const PORTRAIT_W = 9638, LAND_W = 14570;

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hx = t => esc(t).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
const tag = (o, h) => { o._html = h; return o; };
// **bold** inline markup -> runs
function runs(text, o = {}) {
  const out = [];
  String(text).split(/(\*\*[^*]+\*\*)/).forEach(seg => {
    if (!seg) return;
    const b = seg.startsWith('**') && seg.endsWith('**');
    out.push(new TextRun({ text: b ? seg.slice(2, -2) : seg, bold: b || o.bold, italics: o.italics, color: o.color || INK, size: o.size, font: FONT }));
  });
  return out;
}
const P = (t, o = {}) => tag(new Paragraph({ children: runs(t, o), spacing: { after: o.after ?? 120, line: 276 }, alignment: o.align, keepNext: o.keepNext }), `<p>${hx(t)}</p>`);
const H1 = t => tag(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t })], pageBreakBefore: true }), `<h1 class="pb">${esc(t)}</h1>`);
const H1n = t => tag(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t })] }), `<h1>${esc(t)}</h1>`);
const H2 = t => tag(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t })], keepNext: true }), `<h2>${esc(t)}</h2>`);
const H3 = t => tag(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t })], keepNext: true }), `<h3>${esc(t)}</h3>`);
const B = (items, lvl = 0) => items.map(t => Array.isArray(t) ? B(t, lvl + 1) : tag(new Paragraph({ numbering: { reference: 'bul', level: lvl }, children: runs(t), spacing: { after: 60, line: 264 } }), `<div class="li l${lvl}">${hx(t)}</div>`)).flat();
const N = (items, ref = 'num') => items.map((t, i) => tag(new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 60, line: 264 } }), `<div class="li num"><span>${i + 1}.</span>${hx(t)}</div>`));
const BR = () => tag(new Paragraph({ children: [new PageBreak()] }), '<div class="pbk"></div>');
const SP = (n = 80) => tag(new Paragraph({ children: [], spacing: { after: n } }), '');

const border = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(content, w, o = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map(c =>
    c instanceof Paragraph ? c : new Paragraph({ children: runs(c, { bold: o.bold, color: o.color, size: o.size }), spacing: { after: 20, line: 250 }, alignment: o.align }));
  return new TableCell({ width: { size: w, type: WidthType.DXA }, borders, verticalAlign: o.valign || VerticalAlign.TOP,
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 }, columnSpan: o.span, children: paras });
}
// cols: [[header, width], ...]; rows: arrays; widths are relative & scaled to full width
function T(cols, rows, o = {}) {
  const full = o.width || PORTRAIT_W; const tot = cols.reduce((a, c) => a + c[1], 0);
  const ws = cols.map(c => Math.floor(c[1] / tot * full)); ws[ws.length - 1] += full - ws.reduce((a, b) => a + b, 0);
  const size = o.size || 18;
  const hdr = new TableRow({ tableHeader: true, cantSplit: true, children: cols.map((c, i) => cell(c[0], ws[i], { bold: true, color: 'FFFFFF', fill: o.head || NAVY, size })) });
  const body = rows.map((r, ri) => {
    if (r.group) return new TableRow({ cantSplit: true, children: [cell(r.group, full, { bold: true, fill: 'DCE3EF', span: cols.length, size })] });
    return new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, ws[i], { size, fill: o.zebra !== false && ri % 2 ? ZEBRA : undefined, bold: o.boldFirst && i === 0 })) });
  });
  const pct = ws.map(w => (w / full * 100).toFixed(2));
  const html = `<table class="t" style="font-size:${size / 2 - 1.2}pt"><colgroup>${pct.map(p => `<col style="width:${p}%">`).join('')}</colgroup><thead><tr>${cols.map(c => `<th style="background:#${o.head || NAVY}">${hx(c[0])}</th>`).join('')}</tr></thead><tbody>${rows.map((r, ri) => r.group ? `<tr class="grp"><td colspan="${cols.length}">${hx(r.group)}</td></tr>` : `<tr class="${o.zebra !== false && ri % 2 ? 'z' : ''}">${r.map((v, i) => `<td${o.boldFirst && i === 0 ? ' class="b"' : ''}>${hx(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return [tag(new Table({ width: { size: full, type: WidthType.DXA }, columnWidths: ws, rows: [hdr, ...body] }), html), SP(140)];
}
// Callout box: kind note|risk|key
function C(title, lines, kind = 'note', width = PORTRAIT_W) {
  const pal = { note: ['E8F1F2', TEAL], risk: ['FBECE8', 'B4412A'], key: ['EAEFF8', NAVY] }[kind];
  const bl = { style: BorderStyle.SINGLE, size: 24, color: pal[1] }; const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const kids = [new Paragraph({ children: [new TextRun({ text: title, bold: true, color: pal[1], font: FONT, size: 20 })], spacing: { after: 60 } }),
    ...(Array.isArray(lines) ? lines : [lines]).map(l => l instanceof Paragraph ? l : new Paragraph({ children: runs(l, { size: 19 }), spacing: { after: 50, line: 260 } }))];
  return [tag(new Table({ width: { size: width, type: WidthType.DXA }, columnWidths: [width], rows: [new TableRow({ children: [new TableCell({ width: { size: width, type: WidthType.DXA },
    borders: { left: bl, top: nb, bottom: nb, right: nb }, shading: { fill: pal[0], type: ShadingType.CLEAR, color: 'auto' }, margins: { top: 110, bottom: 110, left: 180, right: 160 }, children: kids })] })] }),
    `<div class="co" style="background:#${pal[0]};border-left-color:#${pal[1]}"><div class="cot" style="color:#${pal[1]}">${esc(title)}</div>${(Array.isArray(lines) ? lines : [lines]).map(l => `<p>${hx(l)}</p>`).join('')}</div>`), SP(160)];
}
const o_land = w => w > 660;
function IMG(path, wPx, caption) {
  const buf = fs.readFileSync(require('path').join(__dirname, fs.existsSync(path) ? '' : 'figures', path));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const out = [tag(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new ImageRun({ type: 'png', data: buf, transformation: { width: wPx, height: Math.round(wPx * h / w) }, altText: { title: caption || 'figure', description: caption || 'figure', name: 'fig' } })] }), `<figure><img src="data:image/png;base64,${buf.toString('base64')}" style="width:${Math.min(100, wPx / (o_land(wPx) ? 9.7 : 6.43)).toFixed(1)}%">${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`)];
  if (caption) out.push(tag(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: caption, italics: true, color: MUTED, size: 17, font: FONT })] }), ''));
  return out;
}

function cover(o) {
  const L = (t, s, c, b, a = 80) => new Paragraph({ children: [new TextRun({ text: t, size: s, color: c, bold: b, font: FONT })], spacing: { after: a } });
  const tb = T([['Document control', 3], ['', 7]], [
      ['Document', o.docId], ['Programme', 'SportSeek Phase 2 — Phase 2A (Harden & Unify)'], ['Client', 'RacingAhead / SportSeek, Hyderabad'],
      ['Prepared by', 'Srivin Platforms — Technical Programme Management Office'], ['Version / date', `${o.version || 'v1.0'} — 27 September 2026`],
      ['Status', o.status || 'Issued for client review'], ['Reference baseline', 'SportSeek Phase 2 SOW v1.0 (15 Jul 2026); SportsSeek App High Level Requirements'],
      ['Classification', 'Confidential — RacingAhead / SportSeek and Srivin Platforms only']], { zebra: true, boldFirst: true, size: 18 });
  const first = tag(new Paragraph({ children: [new TextRun({ text: 'SRIVIN PLATFORMS', bold: true, size: 30, color: NAVY, font: FONT, characterSpacing: 60 })], spacing: { after: 40 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: TEAL, space: 6 } } }),
    `<div class="cover"><div class="brand">SRIVIN PLATFORMS</div><div class="bsub">Delivery partner to RacingAhead / SportSeek</div><div class="prog">SportSeek — Unified Sports Ecosystem Platform</div><div class="ctitle">${esc(o.title)}</div><div class="csub">${esc(o.subtitle)}</div>${tb[0]._html}</div>`);
  return [first,
    L('Delivery partner to RacingAhead / SportSeek', 18, MUTED, false, 1800),
    L('SportSeek — Unified Sports Ecosystem Platform', 24, TEAL, true, 120),
    L(o.title, 52, NAVY, true, 160),
    L(o.subtitle, 26, INK, false, 900),
    tb[0], tb[1],
  ];
}
function contents(list) {
  return [tag(new Paragraph({ children: [new TextRun({ text: 'Contents', bold: true, size: 32, color: NAVY, font: FONT })], spacing: { before: 0, after: 200 } }), `<div class="toc"><div class="toch">Contents</div>${list.map(t => `<div class="tocl">${esc(t)}</div>`).join('')}</div>`),
    ...list.map(t => tag(new Paragraph({ children: [new TextRun({ text: t, size: 21, color: INK, font: FONT })], spacing: { after: 90 },
      border: { bottom: { style: BorderStyle.DOTTED, size: 4, color: 'D5D8DE', space: 3 } } }), ''))];
}

function build(o) {
  const hdr = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `SportSeek Phase 2A  |  ${o.short}`, size: 16, color: MUTED, font: FONT })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } } })] });
  const ftr = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
    new TextRun({ text: 'Srivin Platforms  ·  Confidential  ·  Page ', size: 16, color: MUTED, font: FONT }),
    new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED, font: FONT }),
    new TextRun({ text: ' of ', size: 16, color: MUTED, font: FONT }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED, font: FONT })] })] });
  const page = land => ({ size: { width: 11906, height: 16838, orientation: land ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134, header: 560, footer: 560 } });
  const doc = new Document({
    creator: 'Srivin Platforms', title: o.title, description: o.subtitle,
    styles: {
      default: { document: { run: { font: FONT, size: 20, color: INK } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 25, bold: true, color: TEAL, font: FONT }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'bul', levels: [0, 1, 2].map(l => ({ level: l, format: LevelFormat.BULLET, text: ['•', '–', '·'][l], alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360 + l * 360, hanging: 260 } } } })) },
      ...['num', 'num2', 'num3', 'num4', 'num5', 'num6'].map(r => ({ reference: r, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } } } }] })),
    ] },
    sections: o.sections.map(s => ({ properties: { page: page(s.landscape), titlePage: !!s.cover }, headers: { default: hdr, first: new Header({ children: [] }) }, footers: { default: ftr, first: new Footer({ children: [] }) }, children: s.children })),
  });
  const cov = cover => cover ? 'cover-sec' : '';
  const body = o.sections.map((sec, i) => {
    const inner = sec.children.map(c => c._html ?? '').join('\n');
    // the cover table is embedded inside the cover block; skip the duplicate
    const cleaned = sec.cover ? sec.children[0]._html : inner;
    return `<section class="${sec.landscape ? 'land' : 'port'} ${cov(sec.cover)}">${cleaned}</section>`; }).join('\n');
  fs.writeFileSync(o.out.replace(/\.docx$/, '.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${esc(o.title)}</title><style>${fs.readFileSync(__dirname + '/print.css', 'utf8')}</style></head><body>${body}</body></html>`);
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(o.out, b); console.log('wrote', o.out); });
}
module.exports = { P, H1, H1n, H2, H3, B, N, BR, SP, T, C, IMG, cover, contents, build, runs, PORTRAIT_W, LAND_W, NAVY, TEAL };
