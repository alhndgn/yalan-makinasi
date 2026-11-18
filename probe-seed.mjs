
const did = 'demo-' + Math.random().toString(36).slice(2, 8);
const H = { 'content-type': 'application/json', 'x-device-id': did };
const rows = [
  { person: 'Ayşe', channel: 'whatsapp', target: 'sevgili', situation: 'gec_kaldim', text: 'Trafik fena kitledi, köprüde yarım saat durduk; on beşe doğru oradayım.' },
  { person: 'Ayşe', channel: 'whatsapp', target: 'sevgili', situation: 'gidemedim', text: 'Annem rahatsızlandı, hastaneye götürdüm; bu akşam gelemiyorum.' },
  { person: 'Ayşe', channel: 'yuz_yuze', target: 'sevgili', situation: 'mesaji_gormedim', text: 'Telefonu sessize almışım, yeni gördüm mesajını.' },
  { person: 'Ayşe', channel: 'whatsapp', target: 'sevgili', situation: 'plani_bozdum', text: 'Arkadaşlar habersiz geldi, planı bozmak zorunda kaldım.' },
  { person: 'Ayşe', channel: 'telefon', target: 'sevgili', situation: 'isi_yetistiremedim', text: 'İşte acil bir şey çıktı, geç çıkacağım.' },
];
const ids = [];
for (const r of rows) {
  const res = await fetch('http://127.0.0.1:8787/api/lies/manual', { method: 'POST', headers: H, body: JSON.stringify(r) });
  const j = await res.json();
  ids.push(j.id);
}
const statuses = ['tuttu', 'tutmadı', 'tuttu', 'tutmadı', 'beklemede'];
for (let i = 0; i < ids.length; i++) {
  await fetch('http://127.0.0.1:8787/api/lies/' + ids[i], { method: 'PATCH', headers: H, body: JSON.stringify({ status: statuses[i] }) });
}
console.log(JSON.stringify({ did, ids }));
