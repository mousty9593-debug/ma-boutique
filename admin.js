const $ = i => document.getElementById(i);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('fr-FR') + ' FCFA', dt = d => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
let D = {}, imgs = [];
const api = async (m, u, b) => { const r = await fetch('/api/admin' + u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const j = await r.json().catch(() => ({})); if (r.status === 401) { showLogin(); throw new Error('401'); } if (!r.ok) throw new Error(j.error || 'Erreur'); return j; };
const showLogin = () => { $('login').style.display = ''; $('app').style.display = 'none'; };
async function load() { try { D = await api('GET', '/data'); } catch (e) { return; } $('login').style.display = 'none'; $('app').style.display = ''; draw(); }
function draw() {
  const nw = D.orders.filter(o => o.status === 'nouvelle').length, ca = D.orders.filter(o => o.status !== 'annulée').reduce((s, o) => s + o.total, 0);
  $('stats').innerHTML = [['📦 Produits', D.products.length], ['🧾 Commandes', D.orders.length], ['🆕 Nouvelles', nw], ['💰 Chiffre d’affaires', fmt(ca)], ['📝 Inscrits', D.subscribers.length], ['✉️ Messages', D.messages.length]].map(([a, b]) => `<div class="box"><span>${a}</span><b>${b}</b></div>`).join('');
  const ot = os => os.length ? `<table><tr><th>N°</th><th>Date</th><th>Client</th><th>Articles</th><th>Total</th><th>Statut</th><th></th></tr>${os.map(o => `<tr><td><b>${o.id}</b></td><td>${dt(o.date)}</td><td>${esc(o.name)}<br><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a><br><small>${esc(o.address)}</small>${o.note ? '<br><small>📝 ' + esc(o.note) + '</small>' : ''}</td><td>${o.items.map(i => esc(i.name) + ' ×' + i.qty).join('<br>')}</td><td><b>${fmt(o.total)}</b></td>
  <td><select data-os="${o.id}">${['nouvelle', 'confirmée', 'livrée', 'annulée'].map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><a class="btn sm" style="background:#25d366" target="_blank" href="https://wa.me/${esc(o.phone.replace(/\D/g, '').replace(/^(\d{8})$/, '227$1'))}?text=${encodeURIComponent('Bonjour ' + o.name + ', votre commande ' + o.id + ' est ' + o.status + '.')}">WhatsApp</a></td></tr>`).join('')}</table>` : '<div class="empty">Aucune commande.</div>';
  $('lastord').innerHTML = ot(D.orders.slice(0, 5)); $('olist').innerHTML = ot(D.orders);
  $('cl').innerHTML = [...new Set(D.products.map(p => p.category))].map(c => `<option value="${esc(c)}">`).join('');
  $('plist').innerHTML = D.products.length ? `<table><tr><th></th><th>Produit</th><th>Prix</th><th>Stock</th><th></th></tr>${D.products.map(p => `<tr><td>${p.images[0] ? `<img src="${esc(p.images[0])}" width="48" height="48" style="object-fit:cover;border-radius:8px">` : esc(p.emoji)}</td><td><b>${esc(p.name)}</b>${p.hidden ? ' <small>(masqué)</small>' : ''}<br><small>${esc(p.category)} · ${p.images.length} photo(s)</small></td><td>${fmt(p.price)}</td><td>${p.stock}</td><td><button class="btn sm ghost" data-edit="${p.id}">Modifier</button> <button class="btn sm red" data-del="${p.id}">Supprimer</button></td></tr>`).join('')}</table>` : '<div class="empty">Aucun produit.</div>';
  $('slist').innerHTML = D.subscribers.length ? `<table><tr><th>Date</th><th>Nom</th><th>Téléphone</th><th>Email</th><th></th></tr>${D.subscribers.map(s => `<tr><td>${dt(s.date)}</td><td>${esc(s.name)}</td><td>${esc(s.phone)}</td><td>${esc(s.email)}</td><td><button class="btn sm red" data-ds="subscribers/${s.id}">✕</button></td></tr>`).join('')}</table>` : '<div class="empty">Aucune inscription.</div>';
  $('mlist').innerHTML = D.messages.length ? `<table><tr><th>Date</th><th>De</th><th>Message</th><th></th></tr>${D.messages.map(m => `<tr><td>${dt(m.date)}</td><td>${esc(m.name)}<br><small>${esc(m.contact)}</small></td><td>${esc(m.message)}</td><td><button class="btn sm red" data-ds="messages/${m.id}">✕</button></td></tr>`).join('')}</table>` : '<div class="empty">Aucun message.</div>';
  const f = $('sf'), s = D.settings; for (const k of ['shopName', 'ownerName', 'whatsapp', 'email', 'city', 'tagline', 'about']) f[k].value = s[k]; f.phones.value = s.phones.join(', ');
  $('cm').value = (s.colors || {}).main || '#1f4d3a'; $('ca').value = (s.colors || {}).accent || '#c8552b'; svc = (s.services || []).map(x => ({ ...x })); drawSvc();
  f.logo.value = s.logo || ''; $('lgp').innerHTML = s.logo ? `<img src="${esc(s.logo)}" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain">` : 'Aucun logo'; $('lgx').style.display = s.logo ? '' : 'none';
}
const thumbs = () => $('th').innerHTML = imgs.map((u, i) => `<div><img src="${esc(u)}" alt=""><b data-rm="${i}">✕</b></div>`).join('');
async function shrink(f) { const b = await createImageBitmap(f), r = Math.min(1, 1000 / Math.max(b.width, b.height)), c = document.createElement('canvas'); c.width = b.width * r; c.height = b.height * r; c.getContext('2d').drawImage(b, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .82); }
$('files').onchange = async e => { $('up').textContent = 'Envoi des photos…'; try { for (const f of e.target.files) { if (imgs.length >= 8) break; imgs.push((await api('POST', '/upload', { dataUrl: await shrink(f) })).url); thumbs(); } $('up').textContent = 'Photos prêtes ✔'; } catch (x) { $('up').textContent = 'Échec : ' + x.message; } e.target.value = ''; };
function reset() { $('pf').reset(); $('pf').id.value = ''; imgs = []; thumbs(); $('pft').textContent = 'Ajouter un produit'; $('pcancel').style.display = 'none'; $('up').textContent = ''; }
$('pcancel').onclick = reset;
$('pf').onsubmit = async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), id = f.id; delete f.id; f.hidden = !!f.hidden; f.images = imgs; $('pm').textContent = '';
  try { await api(id ? 'PUT' : 'POST', '/products' + (id ? '/' + id : ''), f); reset(); $('pm').className = 'msg'; $('pm').textContent = 'Produit enregistré ✔'; await load(); } catch (x) { $('pm').className = 'msg err'; $('pm').textContent = x.message; } };
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-t],[data-edit],[data-del],[data-rm],[data-ds]'); if (!t) return;
  if (t.dataset.t) { document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === t.dataset.t)); document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b === t)); }
  else if (t.dataset.rm) { imgs.splice(+t.dataset.rm, 1); thumbs(); }
  else if (t.dataset.edit) { const p = D.products.find(x => x.id === t.dataset.edit), f = $('pf'); f.id.value = p.id; ['name', 'price', 'category', 'stock', 'emoji', 'desc'].forEach(k => f[k].value = p[k]); f.hidden.value = p.hidden ? '1' : ''; imgs = [...p.images]; thumbs(); $('pft').textContent = 'Modifier : ' + p.name; $('pcancel').style.display = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  else if (t.dataset.del && confirm('Supprimer ce produit ?')) { await api('DELETE', '/products/' + t.dataset.del); load(); }
  else if (t.dataset.ds && confirm('Supprimer cette entrée ?')) { await api('DELETE', '/' + t.dataset.ds); load(); }
});
document.addEventListener('change', async e => { if (e.target.dataset.os) { await api('PATCH', '/orders/' + e.target.dataset.os, { status: e.target.value }); load(); } });
$('sf').onsubmit = async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); f.phones = f.phones.split(',').map(x => x.trim()).filter(Boolean); try { await api('PUT', '/settings', f); $('sm').className = 'msg'; $('sm').textContent = 'Réglages enregistrés ✔'; } catch (x) { $('sm').className = 'msg err'; $('sm').textContent = x.message; } };
$('lf').onsubmit = async e => { e.preventDefault(); const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) }); if (r.ok) { e.target.reset(); $('lm').textContent = ''; load(); } else $('lm').textContent = (await r.json()).error; };
$('lo').onclick = async () => { await api('POST', '/logout').catch(() => {}); showLogin(); };
load();

// ---- logo : envoi (PNG avec transparence conservée, max 500 px) et enregistrement immédiat ----
async function logoPng(f) { const b = await createImageBitmap(f), r = Math.min(1, 500 / Math.max(b.width, b.height)), c = document.createElement('canvas'); c.width = Math.round(b.width * r); c.height = Math.round(b.height * r); c.getContext('2d').drawImage(b, 0, 0, c.width, c.height); return c.toDataURL('image/png'); }
$('lgf').onchange = async e => { const f = e.target.files[0]; if (!f) return; $('lgm').className = 'msg'; $('lgm').textContent = 'Envoi du logo…';
  try { const u = (await api('POST', '/upload', { dataUrl: await logoPng(f) })).url; await api('PUT', '/settings', { logo: u }); $('lgm').textContent = 'Logo mis à jour ✔'; await load(); } catch (x) { $('lgm').className = 'msg err'; $('lgm').textContent = 'Échec : ' + x.message; } e.target.value = ''; };
$('lgx').onclick = async () => { if (!confirm('Supprimer le logo ?')) return; await api('PUT', '/settings', { logo: '' }); $('lgm').textContent = 'Logo supprimé'; load(); };

// ---- couleurs ----
const PAL = [['Vert', '#1f4d3a', '#c8552b'], ['Bleu', '#1d3f72', '#e07b00'], ['Violet', '#4a2c7a', '#d6336c'], ['Rouge', '#8c1d2c', '#1f4d3a'], ['Noir', '#222222', '#c8962b'], ['Marron', '#5a3a22', '#2e7d5b']];
$('pal').innerHTML = PAL.map(([n, m, a], i) => `<button type="button" class="btn ghost sm" data-pal="${i}"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${m};vertical-align:-2px"></span><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${a};vertical-align:-2px;margin-right:4px"></span>${n}</button>`).join('');
document.addEventListener('click', e => { const t = e.target.closest('[data-pal]'); if (t) { $('cm').value = PAL[t.dataset.pal][1]; $('ca').value = PAL[t.dataset.pal][2]; } });
$('csave').onclick = async () => { try { await api('PUT', '/settings', { colors: { main: $('cm').value, accent: $('ca').value } }); $('cmsg').className = 'msg'; $('cmsg').textContent = 'Couleurs enregistrées ✔ (actualisez le site avec Ctrl+F5)'; } catch (x) { $('cmsg').className = 'msg err'; $('cmsg').textContent = x.message; } };
// ---- services ----
let svc = [];
function drawSvc() { $('svl').innerHTML = svc.map((x, i) => `<div class="row2" style="grid-template-columns:70px 1fr 2fr auto;align-items:start;margin-bottom:8px"><input data-si="${i}" data-sk="icon" value="${esc(x.icon)}" maxlength="4" title="Emoji"><input data-si="${i}" data-sk="title" value="${esc(x.title)}" placeholder="Titre"><input data-si="${i}" data-sk="text" value="${esc(x.text)}" placeholder="Description"><button type="button" class="btn sm red" data-sd="${i}">✕</button></div>`).join('') || '<div class="empty">Aucun service.</div>'; }
document.addEventListener('input', e => { const t = e.target; if (t.dataset.si !== undefined) svc[+t.dataset.si][t.dataset.sk] = t.value; });
document.addEventListener('click', e => { const d = e.target.closest('[data-sd]'); if (d) { svc.splice(+d.dataset.sd, 1); drawSvc(); } });
$('svadd').onclick = () => { if (svc.length < 8) { svc.push({ icon: '⭐', title: '', text: '' }); drawSvc(); } };
$('svsave').onclick = async () => { try { await api('PUT', '/settings', { services: svc }); $('svmsg').className = 'msg'; $('svmsg').textContent = 'Services enregistrés ✔'; await load(); } catch (x) { $('svmsg').className = 'msg err'; $('svmsg').textContent = x.message; } };

// ---- restauration d'une sauvegarde ----
$('rsf').onchange = async e => { const f = e.target.files[0]; if (!f) return; if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) { e.target.value = ''; return; }
  $('rsm').className = 'msg'; $('rsm').textContent = 'Restauration…';
  try { const r = await api('POST', '/restore', JSON.parse(await f.text())); $('rsm').textContent = `Restauré ✔ (${r.products} produits, ${r.orders} commandes)`; await load(); } catch (x) { $('rsm').className = 'msg err'; $('rsm').textContent = 'Échec : ' + x.message; } e.target.value = ''; };
