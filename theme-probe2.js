const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const chrome = process.env.CHROME;
const root = path.resolve('frontend/src');

function run(file, probeJs, label, timeout = 4000) {
  return new Promise((resolve) => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const tmp = path.join(root, file.replace('.html', '.tmp.html'));
    fs.writeFileSync(tmp, html.replace('</body>', probeJs + '</body>'));
    const url = 'file://' + path.resolve(tmp).replace(/\\/g, '/');
    const c = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=1280,900', '--virtual-time-budget=' + timeout, '--dump-dom', url]);
    let out = '';
    c.stdout.on('data', d => { out += d.toString(); });
    c.stderr.on('data', () => {});
    c.on('close', () => {
      fs.unlinkSync(tmp);
      const m = out.match(/<title>PROBE:([^<]+)<\/title>/);
      resolve(m ? JSON.parse(decodeURIComponent(m[1])) : { error: 'PROBE NOT FOUND', label });
    });
  });
}

const contrastProbe = (theme) => `
<script>
window.__probe = function () {
  function rgb(s) { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(',').map(x => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function blend(f, b) { const a = f.a; return { r: f.r * a + b.r * (1 - a), g: f.g * a + b.g * (1 - a), b: f.b * a + b.b * (1 - a), a: 1 }; }
  function lum(c) { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
  function contrast(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  function effBg(el) { let n = el, g = 0, acc = null; while (n && g < 8) { const b = rgb(getComputedStyle(n).backgroundColor); if (b && b.a > 0.02) acc = acc ? blend(b, acc) : b; if (acc && acc.a >= 0.999) break; n = n.parentElement; g++; } return acc || { r: 255, g: 255, b: 255, a: 1 }; }
  const targets = ['body', '.logo', '.nav a', '.icon-btn', '.product-card', '.price', '.card-review-count', '.testimonial-card blockquote', '.testimonial-name', '.recipe-card p', '.faq-item summary', '.deal-card h3', '.footer p', '.sort-box select', '.chip', '.product-count', '.pay-label', '.step h3', '.step p', '.sustain-card p', '.trust-text span'];
  const issues = [];
  targets.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el || el.offsetParent === null && !sel.includes('icon-btn')) return;
    const cs = getComputedStyle(el);
    const color = rgb(cs.color); const bg = effBg(el);
    const ratio = color ? contrast(color, bg) : null;
    if (ratio && ratio < 4.5 && !sel.includes('icon-btn')) issues.push(sel + ' ' + ratio.toFixed(2) + ' "' + (el.textContent || '').trim().slice(0, 20) + '"');
  });
  document.title = 'PROBE:' + encodeURIComponent(JSON.stringify({ theme: document.documentElement.getAttribute('data-theme'), issues }));
};
window.addEventListener('load', () => { document.documentElement.setAttribute('data-theme', '${theme}'); window.__probe(); });
</script>
`;

const toggleProbe = `
<script>
window.addEventListener('load', () => {
  const btn = document.getElementById('theme-toggle');
  document.documentElement.setAttribute('data-theme', 'light');
  try { localStorage.removeItem('fruit-theme'); } catch (e) {}
  btn.click();
  const afterClick = document.documentElement.getAttribute('data-theme');
  const stored = (() => { try { return localStorage.getItem('fruit-theme'); } catch (e) { return null; } })();
  btn.click();
  const afterSecond = document.documentElement.getAttribute('data-theme');
  const sunHidden = getComputedStyle(btn.querySelector('.icon-sun')).display === 'none';
  const moonShown = getComputedStyle(btn.querySelector('.icon-moon')).display !== 'none';
  document.title = 'PROBE:' + encodeURIComponent(JSON.stringify({ afterClick, stored, afterSecond, sunHidden, moonShown }));
});
</script>
`;

(async () => {
  // 1. Light-mode contrast regression check on index
  const light = await run('index.html', contrastProbe('light'), 'index-light');
  console.log('LIGHT MODE index:', JSON.stringify(light));

  // 2. Dark-mode contrast on login + recipe pages
  const login = await run('login.html', contrastProbe('dark'), 'login-dark');
  console.log('DARK MODE login:', JSON.stringify(login));
  const recipe = await run('recipe.html', contrastProbe('dark'), 'recipe-dark');
  console.log('DARK MODE recipe:', JSON.stringify(recipe));

  // 3. Toggle behavior
  const toggle = await run('index.html', toggleProbe, 'toggle');
  console.log('TOGGLE:', JSON.stringify(toggle));
})();
