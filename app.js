const $ = i => document.getElementById(i);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let S = {}, P = [], cart = JSON.parse(localStorage.getItem('cart') || '[]');
const fmt = n => Number(n).toLocaleString('fr-FR') + ' ' + (S.currency || 'FCFA');
const saveCart = () => localStorage.setItem('cart', JSON.stringify(cart));
const photo = p => p.images && p.images.length ? `<img src="${esc(p.images[0])}" alt="${esc(p.name)}">` : esc(p.emoji);
const gallery = p => p.images && p.images.length ? p.images.map((u, i) => `<img src="${esc(u)}" alt="${esc(p.name)}" class="${i ? '' : 'on'}">`).join('') : esc(p.emoji);

function shade(hex, p) { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * (100 + p) / 100))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join(''); }
async function load() {
  const r = await (await fetch('/api/shop')).json(); S = r.settings; P = r.products;
  const col = S.colors || {}, rs = document.documentElement.style;
  if (col.main) rs.setProperty('--green', col.main);
  if (col.accent) { rs.setProperty('--acc', col.accent); rs.setProperty('--acc2', shade(col.accent, -18)); }
  $('srv').innerHTML = (S.services || []).map(x => `<div class="s"><div class="i">${esc(x.icon)}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join('');
  document.title = S.shopName + ' — Boutique en ligne';
  $('logo').innerHTML = S.logo ? `<img class="lg" src="${esc(S.logo)}" alt=""><span>${esc(S.shopName)}</span>` : '🛍️ ' + esc(S.shopName);
  if (S.logo) $('fav').href = S.logo; $('fn').textContent = S.shopName; $('yr').textContent = new Date().getFullYear();
  $('about').textContent = S.about; $('tag').textContent = S.tagline; $('own').textContent = S.ownerName; $('av').textContent = (S.ownerName || 'M')[0].toUpperCase(); $('city').textContent = '📍 ' + S.city;
  const wa = 'https://wa.me/' + S.whatsapp; $('cwa').href = wa; $('fwa').href = wa;
  $('clist').innerHTML = S.phones.map(t => `<li>📱 <a href="tel:+227${esc(t)}">${esc(t.replace(/(\d\d)(?=\d)/g, '$1 '))}</a></li>`).join('') + `<li>✉️ <a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>`;
  const cats = [...new Set(P.map(p => p.category))]; $('cat').innerHTML = '<option value="">Toutes les catégories</option>' + cats.map(c => `<option>${esc(c)}</option>`).join('');
  hero(); marquee(); grid(); drawCart();
}
// ---- accueil : les photos défilent en continu, comme le bandeau de texte (4 PC, 3 tablette, 2/1 téléphone) ----
let PV = 4, items = [];
const perView = () => innerWidth >= 1500 ? 5 : innerWidth >= 1000 ? 4 : innerWidth >= 700 ? 3 : innerWidth >= 420 ? 2 : 1;
function hero() {
  $('bt').textContent = S.shopName; $('bs').textContent = S.tagline; $('bwa').href = 'https://wa.me/' + S.whatsapp;
  items = []; P.forEach(p => { if (p.images.length) p.images.forEach(u => items.push({ p, u })); else items.push({ p }); });
  build();
}
function build() {
  PV = perView(); $('car').style.display = items.length ? '' : 'none'; if (!items.length) return;
  let base = items.slice(); while (base.length < PV) base = base.concat(items);   // assez de photos pour remplir l'écran
  const list = base.concat(base), w = 100 / list.length;                            // liste doublée = boucle sans coupure
  const cell = s => `<div class="it" style="flex:0 0 ${w}%"><div class="ic"><div class="ip" data-view="${s.p.id}">${s.u ? `<img src="${esc(s.u)}" alt="${esc(s.p.name)}" loading="lazy">` : esc(s.p.emoji)}</div>
    <div class="ib"><b>${esc(s.p.name)}</b><span>${fmt(s.p.price)}</span><button class="btn sm" data-add="${s.p.id}">+ Panier</button></div></div></div>`;
  const tr = $('tr'); tr.style.width = (list.length * 100 / PV) + '%'; tr.innerHTML = list.map(cell).join('');
  tr.style.animationDuration = (base.length * 3.5) + 's';                            // vitesse constante : 3,5 s par photo
}
let pz; $('vp').addEventListener('touchstart', () => { clearTimeout(pz); $('vp').classList.add('paused'); }, { passive: true });
$('vp').addEventListener('touchend', () => { pz = setTimeout(() => $('vp').classList.remove('paused'), 1800); });
addEventListener('resize', () => { if (perView() !== PV && items.length) build(); });
function marquee() {
  if (!P.length) { $('track').innerHTML = '<span>Bienvenue ✨</span>'; return; }
  const h = P.map(p => `<span>${p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : esc(p.emoji)} ${esc(p.name)} <b>${fmt(p.price)}</b></span>`).join('');
  $('track').innerHTML = h + h + h + h;
}
// ---- catalogue ----
function grid() {
  const q = $('q').value.toLowerCase().trim(), c = $('cat').value;
  const L = P.filter(p => (!c || p.category === c) && (!q || (p.name + p.desc + p.category).toLowerCase().includes(q)));
  $('grid').innerHTML = L.map(p => `<div class="card"><div class="gal" data-view="${p.id}">${p.stock < 1 ? '<span class="tag out">Rupture</span>' : `<span class="tag">${esc(p.category)}</span>`}${gallery(p)}</div>
  <div class="cb"><h3>${esc(p.name)}</h3><div class="cat">${esc(p.desc).slice(0, 70)}</div><div class="pr">${fmt(p.price)}</div>
  <div class="acts"><button class="btn ghost sm" data-view="${p.id}">Détails</button><button class="btn sm" data-add="${p.id}" ${p.stock < 1 ? 'disabled style="opacity:.5"' : ''}>+ Panier</button></div></div></div>`).join('')
    || '<div class="empty">Aucun produit trouvé.</div>';
}
setInterval(() => document.querySelectorAll('.gal').forEach(g => { const im = g.querySelectorAll('img'); if (im.length < 2) return; const k = [...im].findIndex(x => x.classList.contains('on')); im[k].classList.remove('on'); im[(k + 1) % im.length].classList.add('on'); }), 3000);
$('q').oninput = grid; $('cat').onchange = grid;

function view(id) {
  const p = P.find(x => x.id === id); if (!p) return;
  $('modal').innerHTML = `<button class="x" data-close>✕</button><div class="pd"><div class="gal">${gallery(p)}</div><div class="info"><span class="cat">${esc(p.category)}</span><h2 style="margin:4px 0 8px">${esc(p.name)}</h2>
  <div class="pr" style="font-size:1.5rem;color:var(--acc);font-weight:800">${fmt(p.price)}</div><p>${esc(p.desc)}</p><p style="color:var(--mut)">${p.stock > 0 ? '✔ En stock (' + p.stock + ')' : '✖ Rupture de stock'}</p>
  <button class="btn" data-add="${p.id}" ${p.stock < 1 ? 'disabled style="opacity:.5"' : ''}>Ajouter au panier</button></div></div>`;
  $('modal').classList.add('on'); $('ov').classList.add('on');
}
// ---- panier ----
function add(id) { const p = P.find(x => x.id === id); if (!p || p.stock < 1) return; const l = cart.find(x => x.id === id); if (l) l.qty = Math.min(l.qty + 1, p.stock); else cart.push({ id, qty: 1 }); saveCart(); drawCart(); openCart(); }
function drawCart() {
  cart = cart.filter(l => P.find(p => p.id === l.id)); let t = 0, n = 0;
  $('cbody').innerHTML = cart.map(l => { const p = P.find(x => x.id === l.id); t += p.price * l.qty; n += l.qty;
    return `<div class="ci"><div class="th">${photo(p)}</div><div class="in"><b>${esc(p.name)}</b><br>${fmt(p.price)}</div><div class="qty"><button data-q="${p.id}" data-s="-1">−</button><b>${l.qty}</b><button data-q="${p.id}" data-s="1">+</button></div></div>`; }).join('') || '<div class="empty">Votre panier est vide.</div>';
  $('ctot').textContent = fmt(t); $('cc').textContent = n; $('co').style.display = cart.length ? '' : 'none'; document.querySelector('#cfoot .tot').style.display = cart.length ? '' : 'none';
}
const openCart = () => { $('drawer').classList.add('on'); $('ov').classList.add('on'); };
const closeAll = () => { $('drawer').classList.remove('on'); $('modal').classList.remove('on'); $('ov').classList.remove('on'); };
document.addEventListener('click', e => {
  const t = e.target.closest('[data-add],[data-view],[data-q],[data-close]'); if (!t) return;
  if (t.dataset.add) { $('modal').classList.remove('on'); add(t.dataset.add); }
  else if (t.dataset.view) view(t.dataset.view);
  else if (t.dataset.q) { const l = cart.find(x => x.id === t.dataset.q), p = P.find(x => x.id === t.dataset.q); l.qty += +t.dataset.s; if (l.qty < 1) cart = cart.filter(x => x !== l); else l.qty = Math.min(l.qty, p.stock || 1); saveCart(); drawCart(); }
  else closeAll();
});
$('ov').onclick = closeAll; $('cx').onclick = closeAll; $('cartbtn').onclick = openCart;
$('burger').onclick = () => $('menu').classList.toggle('open'); $('menu').onclick = () => $('menu').classList.remove('open');

// ---- commande -> enregistrée sur le serveur puis envoyée sur WhatsApp ----
$('co').onsubmit = async e => {
  e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); $('comsg').textContent = '';
  const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, items: cart }) });
  const o = await r.json(); if (!r.ok) { $('comsg').textContent = o.error; return; }
  const msg = `🛍️ *Nouvelle commande ${o.id}*\n\n` + o.items.map(i => `• ${i.name} × ${i.qty} = ${fmt(i.price * i.qty)}`).join('\n') +
    `\n\n*Total : ${fmt(o.total)}*\n\n👤 ${o.name}\n📞 ${o.phone}\n📍 ${o.address || 'à préciser'}` + (o.note ? `\n📝 ${o.note}` : '');
  const url = 'https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(msg);
  cart = []; saveCart(); drawCart(); e.target.reset();
  $('cbody').innerHTML = `<div class="empty"><h3>✅ Commande ${esc(o.id)} enregistrée !</h3><p>Envoyez-la maintenant sur WhatsApp pour la confirmer.</p><a class="btn" style="background:#25d366" href="${url}" target="_blank" rel="noopener">💬 Ouvrir WhatsApp</a></div>`;
  window.open(url, '_blank');
};
async function post(url, data, el, form) { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const j = await r.json(); $(el).className = 'msg' + (r.ok ? '' : ' err'); $(el).textContent = r.ok ? 'Merci ! C’est bien reçu ✔' : j.error; if (r.ok) form.reset(); }
$('sub').onsubmit = e => { e.preventDefault(); post('/api/subscribe', Object.fromEntries(new FormData(e.target)), 'submsg', e.target); };
$('cf').onsubmit = e => { e.preventDefault(); post('/api/contact', Object.fromEntries(new FormData(e.target)), 'cfmsg', e.target); };
load();
