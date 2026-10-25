const { spawn } = require('child_process');
const path = require('path');

const chrome = process.env.CHROME;
const url = 'file://' + path.resolve('frontend/src/index.html').replace(/\\/g, '/');

const probe = `
<script>
window.__probe = function (mode) {
  function rgb(s) {
    const m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function blend(fg, bg) {
    const a = fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  function lum(c) {
    if (!c) return 0;
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function contrast(a, b) {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function effBg(el) {
    let n = el, guard = 0, acc = null;
    while (n && guard < 8) {
      const bg = rgb(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0.02) acc = acc ? blend(bg, acc) : bg;
      if (acc && acc.a >= 0.999) break;
      n = n.parentElement;
      guard++;
    }
    return acc || { r: 255, g: 255, b: 255, a: 1 };
  }
  const targets = [
    'body', '.header', '.logo', '.nav a', '.icon-btn',
    '.hero', '.hero-eyebrow', '.hero-content p', '.hero-stat span', '.hero-stat strong',
    '.product-card', '.card-media', '.price', '.card-review-count', '.card-cat',
    '.trust-strip', '.trust-text span',
    '.step', '.step h3', '.step p', '.step-num',
    '.testimonial-card blockquote', '.testimonial-name', '.testimonial-role',
    '.recipe-card p', '.sustain-card p',
    '.faq-item summary', '.faq-item p',
    '.deal-card h3', '.deal-card p',
    '.footer p', '.footer-col h4',
    '.sort-box select', '.view-btn', '.view-btn.active', '.chip', '.product-count',
    '.load-more-count', '.delivery-progress-note', '.pay-label'
  ];
  const out = { theme: document.documentElement.getAttribute('data-theme'), mode, rows: [], issues: [] };
  targets.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    const cs = getComputedStyle(el);
    const color = rgb(cs.color);
    const bg = effBg(el);
    const ratio = color ? contrast(color, bg) : null;
    const text = (el.textContent || '').trim().slice(0, 24);
    out.rows.push({ sel, color: cs.color, bg: 'rgba(' + [bg.r, bg.g, bg.b, bg.a].join(',') + ')', ratio: ratio ? ratio.toFixed(2) : '-', text });
    if (ratio && ratio < 4.5) out.issues.push('LOW CONTRAST ' + sel + ' ' + ratio.toFixed(2) + ' "' + text + '"');
  });
  document.title = 'PROBE:' + encodeURIComponent(JSON.stringify(out));
};
window.addEventListener('load', () => {
  document.documentElement.setAttribute('data-theme', 'dark');
  window.__probe('dark');
});
</script>
`;
const fs = require('fs');
const html = fs.readFileSync('frontend/src/index.html', 'utf8');
const tmp = 'frontend/src/index.tmp.html';
fs.writeFileSync(tmp, html.replace('</body>', probe + '</body>'));
const turl = 'file://' + path.resolve(tmp).replace(/\\/g, '/');

const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=1280,900', '--virtual-time-budget=4000', '--dump-dom', turl];
const c = spawn(chrome, args);
let out = '';
c.stdout.on('data', d => { out += d.toString(); });
c.stderr.on('data', () => {});
c.on('close', () => {
  fs.unlinkSync(tmp);
  const m = out.match(/<title>PROBE:([^<]+)<\/title>/);
  if (!m) { console.log('PROBE NOT FOUND'); return; }
  const data = JSON.parse(decodeURIComponent(m[1]));
  console.log('Mode:', data.mode, '| theme:', data.theme);
  data.rows.forEach(r => console.log('  ' + r.sel.padEnd(32) + ' color=' + r.color.padEnd(22) + ' bg=' + r.bg.padEnd(22) + ' ratio=' + r.ratio + '  ' + r.text));
  console.log('\nISSUES (' + data.issues.length + '):');
  data.issues.forEach(i => console.log('  ! ' + i));
});
