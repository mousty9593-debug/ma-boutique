// Ma Boutique — serveur e-commerce sans dépendance (Node >= 18)
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';
const BASE = process.env.DATA_DIR || __dirname; // en ligne : dossier du disque persistant (ex. /var/data)
const DATA = path.join(BASE, 'data'), UP = path.join(BASE, 'uploads'), PUB = path.join(__dirname, 'public');
[DATA, UP].forEach(d => fs.mkdirSync(d, { recursive: true }));
const DBF = path.join(DATA, 'db.json');

let db = {
  secret: crypto.randomBytes(32).toString('hex'),
  settings: { shopName: 'Ma Boutique', ownerName: 'Mousty', whatsapp: '22798537713', phones: ['95937725', '98537713'],
    email: 'mousty9593@gmail.com', logo: '', colors: { main: '#1f4d3a', accent: '#c8552b' },
    services: [{ icon: '🚚', title: 'Livraison rapide', text: 'Nous livrons votre commande à l’adresse de votre choix.' },
      { icon: '💬', title: 'Commande WhatsApp', text: 'Votre commande arrive directement sur WhatsApp, confirmation rapide.' },
      { icon: '💵', title: 'Paiement facile', text: 'Payez à la livraison ou par mobile money.' },
      { icon: '🤝', title: 'Service client', text: 'Une équipe à votre écoute avant et après l’achat.' }], currency: 'FCFA', city: 'Niamey, Niger',
    tagline: 'Des produits de qualité, livrés chez vous.',
    about: 'Ma Boutique propose des produits de qualité à des prix accessibles. Notre objectif : une expérience d’achat simple, rapide et de confiance, directement depuis votre téléphone.' },
  products: [
    { id: 'p1', name: 'Chaussures sport', price: 15000, category: 'Mode', emoji: '👟', desc: 'Confort et style au quotidien.', stock: 20, images: [], created: Date.now() },
    { id: 'p2', name: 'Sac à main', price: 12000, category: 'Mode', emoji: '👜', desc: 'Élégant et solide.', stock: 15, images: [], created: Date.now() + 1 },
    { id: 'p3', name: 'Casque audio', price: 18000, category: 'Électronique', emoji: '🎧', desc: 'Un son clair et puissant.', stock: 10, images: [], created: Date.now() + 2 }],
  orders: [], subscribers: [], messages: []
};
const DEFAULTS = { ...db.settings };
if (fs.existsSync(DBF)) { try { db = { ...db, ...JSON.parse(fs.readFileSync(DBF, 'utf8')) }; } catch (e) { console.error('db.json illisible', e); } }
const save = () => { fs.writeFileSync(DBF + '.tmp', JSON.stringify(db, null, 1)); fs.renameSync(DBF + '.tmp', DBF); };
db.settings = { ...DEFAULTS, ...db.settings }; // complète les anciennes installations
save();

const uid = () => crypto.randomBytes(5).toString('hex');
const clean = (s, n = 200) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

// --- authentification admin (cookie signé) ---
const sign = v => crypto.createHmac('sha256', db.secret).update(v).digest('hex');
const makeToken = () => { const e = Date.now() + 7 * 864e5; return e + '.' + sign('' + e); };
const isAdmin = req => {
  const m = /(?:^|; )adm=([^;]+)/.exec(req.headers.cookie || ''); if (!m) return false;
  const [e, s] = m[1].split('.'); if (!e || !s || Date.now() > +e) return false;
  const a = Buffer.from(s), b = Buffer.from(sign(e)); return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const fails = {};
const send = (res, code, obj, headers = {}) => { res.writeHead(code, { 'Content-Type': 'application/json', ...headers }); res.end(JSON.stringify(obj)); };
const body = (req, max = 12e6) => new Promise((ok, ko) => { let d = '', n = 0; req.on('data', c => { n += c.length; if (n > max) { ko(new Error('trop gros')); req.destroy(); } else d += c; }); req.on('end', () => { try { ok(d ? JSON.parse(d) : {}); } catch (e) { ko(e); } }); });

const publicShop = () => ({ settings: db.settings, products: db.products.filter(p => !p.hidden).sort((a, b) => b.created - a.created) });

async function api(req, res, url) {
  const m = req.method, p = url.pathname;
  if (m === 'GET' && p === '/api/shop') return send(res, 200, publicShop());

  if (m === 'POST' && p === '/api/orders') {
    const b = await body(req), items = [];
    for (const it of (Array.isArray(b.items) ? b.items : [])) {
      const pr = db.products.find(x => x.id === it.id), q = Math.floor(+it.qty);
      if (pr && q > 0 && q <= 99) items.push({ id: pr.id, name: pr.name, price: pr.price, qty: q });
    }
    const name = clean(b.name, 80), phone = clean(b.phone, 30);
    if (!items.length || !name || !phone) return send(res, 400, { error: 'Nom, téléphone et au moins un produit requis.' });
    const order = { id: 'CMD-' + String(db.orders.length + 1).padStart(4, '0'), items, total: items.reduce((s, i) => s + i.price * i.qty, 0),
      name, phone, address: clean(b.address, 200), note: clean(b.note, 300), status: 'nouvelle', date: new Date().toISOString() };
    db.orders.push(order); save(); return send(res, 201, order);
  }
  if (m === 'POST' && p === '/api/subscribe') {
    const b = await body(req), name = clean(b.name, 80), phone = clean(b.phone, 30);
    if (!name || !phone) return send(res, 400, { error: 'Nom et téléphone requis.' });
    db.subscribers.push({ id: uid(), name, phone, email: clean(b.email, 100), date: new Date().toISOString() }); save(); return send(res, 201, { ok: true });
  }
  if (m === 'POST' && p === '/api/contact') {
    const b = await body(req), name = clean(b.name, 80), text = clean(b.message, 1000);
    if (!name || !text) return send(res, 400, { error: 'Nom et message requis.' });
    db.messages.push({ id: uid(), name, contact: clean(b.contact, 100), message: text, date: new Date().toISOString() }); save(); return send(res, 201, { ok: true });
  }

  if (m === 'POST' && p === '/api/admin/login') {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(), f = fails[ip] || { n: 0, t: 0 };
    if (f.n >= 5 && Date.now() - f.t < 9e5) return send(res, 429, { error: 'Trop d’essais. Réessayez dans 15 minutes.' });
    const b = await body(req), a = Buffer.from(String(b.password || '')), c = Buffer.from(ADMIN_PASSWORD);
    if (a.length === c.length && crypto.timingSafeEqual(a, c)) { delete fails[ip]; return send(res, 200, { ok: true }, { 'Set-Cookie': `adm=${makeToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}` }); }
    fails[ip] = { n: f.n + 1, t: Date.now() }; return send(res, 401, { error: 'Mot de passe incorrect.' });
  }
  if (p.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return send(res, 401, { error: 'Non autorisé' });
    if (m === 'POST' && p === '/api/admin/logout') return send(res, 200, { ok: true }, { 'Set-Cookie': 'adm=; Max-Age=0; Path=/' });
    if (m === 'GET' && p === '/api/admin/data') return send(res, 200, { settings: db.settings, products: db.products, orders: db.orders.slice().reverse(), subscribers: db.subscribers.slice().reverse(), messages: db.messages.slice().reverse() });
    if (m === 'GET' && p === '/api/admin/backup') { // sauvegarde complète : données + photos
      const files = {}; for (const f of fs.readdirSync(UP)) files[f] = fs.readFileSync(path.join(UP, f)).toString('base64');
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="sauvegarde-boutique.json"' });
      return res.end(JSON.stringify({ db, files }));
    }
    if (m === 'POST' && p === '/api/admin/restore') {
      const b = await body(req, 100e6);
      if (!b.db || !Array.isArray(b.db.products) || !Array.isArray(b.db.orders)) return send(res, 400, { error: 'Fichier de sauvegarde invalide.' });
      for (const [n, d] of Object.entries(b.files || {})) if (/^[\w.-]+$/.test(n)) fs.writeFileSync(path.join(UP, n), Buffer.from(String(d), 'base64'));
      const secret = db.secret; db = { ...db, ...b.db, secret }; db.settings = { ...DEFAULTS, ...db.settings }; save();
      return send(res, 200, { ok: true, products: db.products.length, orders: db.orders.length });
    }
    if (m === 'POST' && p === '/api/admin/upload') {
      const b = await body(req), r = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(b.dataUrl || '');
      if (!r) return send(res, 400, { error: 'Image invalide' });
      const f = uid() + Date.now().toString(36) + '.' + (r[1] === 'jpeg' ? 'jpg' : r[1]);
      fs.writeFileSync(path.join(UP, f), Buffer.from(r[2], 'base64')); return send(res, 201, { url: '/uploads/' + f });
    }
    if (m === 'POST' && p === '/api/admin/products') {
      const b = await body(req), pr = { id: uid(), created: Date.now(), category: 'Divers', emoji: '📦', desc: '', stock: 10, images: [] }; applyProduct(pr, b);
      if (!pr.name || !(pr.price > 0)) return send(res, 400, { error: 'Nom et prix requis.' });
      db.products.push(pr); save(); return send(res, 201, pr);
    }
    let mm;
    if ((mm = /^\/api\/admin\/products\/(\w+)$/.exec(p))) {
      const i = db.products.findIndex(x => x.id === mm[1]); if (i < 0) return send(res, 404, { error: 'Introuvable' });
      if (m === 'PUT') { applyProduct(db.products[i], await body(req)); save(); return send(res, 200, db.products[i]); }
      if (m === 'DELETE') { db.products[i].images.forEach(u => fs.unlink(path.join(UP, path.basename(u)), () => {})); db.products.splice(i, 1); save(); return send(res, 200, { ok: true }); }
    }
    if (m === 'PATCH' && (mm = /^\/api\/admin\/orders\/([\w-]+)$/.exec(p))) {
      const o = db.orders.find(x => x.id === mm[1]); const b = await body(req);
      if (!o || !['nouvelle', 'confirmée', 'livrée', 'annulée'].includes(b.status)) return send(res, 400, { error: 'Requête invalide' });
      o.status = b.status; save(); return send(res, 200, o);
    }
    if (m === 'DELETE' && (mm = /^\/api\/admin\/(subscribers|messages)\/(\w+)$/.exec(p))) { db[mm[1]] = db[mm[1]].filter(x => x.id !== mm[2]); save(); return send(res, 200, { ok: true }); }
    if (m === 'PUT' && p === '/api/admin/settings') {
      const b = await body(req), s = db.settings;
      ['shopName', 'ownerName', 'whatsapp', 'email', 'city', 'tagline', 'about'].forEach(k => { if (k in b) s[k] = clean(b[k], k === 'about' ? 1500 : 150); });
      if (Array.isArray(b.phones)) s.phones = b.phones.map(x => clean(x, 20)).filter(Boolean).slice(0, 5);
      if (b.colors && typeof b.colors === 'object') for (const k of ['main', 'accent']) if (/^#[0-9a-f]{6}$/i.test(b.colors[k] || '')) s.colors[k] = b.colors[k];
      if (Array.isArray(b.services)) s.services = b.services.slice(0, 8).map(x => ({ icon: clean(x.icon, 4) || '⭐', title: clean(x.title, 60), text: clean(x.text, 220) })).filter(x => x.title);
      if ('logo' in b) {
        const nl = /^\/uploads\/[\w.-]+$/.test(b.logo) ? b.logo : '';
        if (s.logo && s.logo !== nl) fs.unlink(path.join(UP, path.basename(s.logo)), () => {});
        s.logo = nl;
      }
      s.whatsapp = s.whatsapp.replace(/\D/g, ''); save(); return send(res, 200, s);
    }
  }
  send(res, 404, { error: 'Introuvable' });
}
function applyProduct(pr, b) {
  if ('name' in b) pr.name = clean(b.name, 100);
  if ('price' in b) pr.price = Math.max(0, Math.round(+b.price) || 0);
  if ('category' in b) pr.category = clean(b.category, 40) || 'Divers';
  if ('emoji' in b) pr.emoji = clean(b.emoji, 4) || '📦';
  if ('desc' in b) pr.desc = clean(b.desc, 500);
  if ('stock' in b) pr.stock = Math.max(0, Math.floor(+b.stock) || 0);
  if ('hidden' in b) pr.hidden = !!b.hidden;
  if (Array.isArray(b.images)) pr.images = b.images.filter(u => /^\/uploads\/[\w.-]+$/.test(u)).slice(0, 8);
  pr.images = pr.images || [];
}
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html'; if (p === '/admin') p = '/admin.html';
  const root = p.startsWith('/uploads/') ? UP : PUB, rel = p.startsWith('/uploads/') ? p.slice(9) : p;
  const f = path.normalize(path.join(root, rel));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('Page introuvable'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': root === UP ? 'public, max-age=2592000' : 'no-cache', 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(f).pipe(res);
}
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try { url.pathname.startsWith('/api/') ? await api(req, res, url) : serveStatic(req, res, url); }
  catch (e) { console.error(e); if (!res.headersSent) send(res, 500, { error: 'Erreur serveur' }); }
}).listen(PORT, () => {
  console.log(`Boutique : http://localhost:${PORT}   |   Admin : http://localhost:${PORT}/admin`);
  if (!process.env.ADMIN_PASSWORD) console.log('⚠️  Mot de passe admin par défaut (admin1234). Définissez ADMIN_PASSWORD !');
});
