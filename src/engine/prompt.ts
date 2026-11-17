/**
 * Yalan Makinası — AI sistem promptu (Türkçe + English).
 *
 * Tasarım hedefi: makine gibi değil, gerçek bir insanın mesaj atarken düşündüğü gibi yazsın.
 * Dil, arayüzde seçilen dile göre üretilir; yapay zekâ da o dilde cevap verir.
 */

export type PromptLang = 'tr' | 'en';

export type HistoryEntry = { text: string; situation: string; createdAt: number };

/** Kişi profili: hitap ve üslup için. */
export type PersonProfileInput = {
  name: string;
  relation?: string;
  gender?: 'kadin' | 'erkek' | 'belirsiz';
  closeness?: number;
  notes?: string;
};

export type IntensityBand = {
  min: number;
  max: number;
  name: string;
  nameEn: string;
  directive: string;
  directiveEn: string;
};

export const INTENSITY_BANDS: IntensityBand[] = [
  {
    min: 1,
    max: 2,
    name: 'Beyaz yalan',
    nameEn: 'White lie',
    directive:
      'Tek cümle, 6-14 kelime. Mazeret bile denmez; sıradan bir bilgi gibi söylenir. Ayrıntı yok, duygu yok, açıklama yok. ' +
      'Örnek ton: "Yolda kaldım, on dakika gecikiyorum."',
    directiveEn:
      'One sentence, 6-14 words. Not even an excuse — just a plain piece of information. No details, no emotion, no explaining. ' +
      'Example tone: "Got held up, running ten minutes late."',
  },
  {
    min: 3,
    max: 4,
    name: 'Küçük bahane',
    nameEn: 'Small excuse',
    directive:
      'Bir-iki cümle. Bir sebep + tek somut ayrıntı (yer, saat ya da kiminle). Abartı yok, savunmaya geçme yok. ' +
      'Sanki durumu önemsizmiş gibi kısaca geç.',
    directiveEn:
      'One or two sentences. One reason plus a single concrete detail (place, time, or who was there). No exaggeration, no defensiveness. ' +
      'Pass over it briefly, as if it hardly matters.',
  },
  {
    min: 5,
    max: 6,
    name: 'Kıvırma',
    nameEn: 'Spinning it',
    directive:
      'İki-üç cümle. Sebep + bir ayrıntı + hafif bir duygu (sıkılma, mahcubiyet, yorgunluk). Cümle uzunlukları eşit olmasın; ' +
      'biri kısa kalsın. Karşı tarafın sorabileceği soruyu metnin içinde kendiliğinden yanıtla.',
    directiveEn:
      'Two or three sentences. A reason, one detail, and a light emotion (annoyance, embarrassment, tiredness). Vary the sentence lengths; ' +
      'keep one short. Answer the obvious follow-up question inside the text without being asked.',
  },
  {
    min: 7,
    max: 8,
    name: 'Cesur yalan',
    nameEn: 'Bold lie',
    directive:
      'Üç-dört cümle. Küçük bir zaman çizgisi kur (önce şu, sonra bu), bir tanık ya da kayıt iması ekle (arayan, mesaj atan, ' +
      'yanında olan biri — ad vermeden). Bir yerde kendini hafifçe düzelt ("yani tam olarak öyle değil de..."). Duygu dozunu artır.',
    directiveEn:
      'Three or four sentences. Build a small timeline (first this, then that), hint at a witness or a record (someone called, texted, was there — ' +
      'no names). Somewhere, correct yourself slightly ("well, not exactly like that…"). Add a bit more emotion.',
  },
  {
    min: 9,
    max: 10,
    name: 'Senaryo',
    nameEn: 'Full story',
    directive:
      'Dört-altı cümle. Giriş-orta-son: ne oldu, neden seni buldu, şimdi ne yapıyorsun. İki somut ayrıntı (yer + saat ya da ' +
      'kişi + süre) ve bir "kanıt" iması (telefon, konum, birlikte olduğun kişi). Duygu zirvede ama yalvarma yok. ' +
      'Metin hâlâ yalanlanabilir kalsın: fazla kesin konuşma.',
    directiveEn:
      'Four to six sentences. Beginning, middle, end: what happened, why it found you, what you are doing now. Two concrete details (place + time, ' +
      'or person + duration) and one hint of "evidence" (phone, location, who you were with). Emotion peaks, but no pleading. Keep it deniable: ' +
      'do not sound too certain.',
  },
];

export function bandFor(intensity: number): IntensityBand {
  const value = Number.isFinite(intensity) ? Math.round(intensity) : 5;
  const clamped = Math.min(10, Math.max(1, value));
  return INTENSITY_BANDS.find((b) => clamped >= b.min && clamped <= b.max) ?? INTENSITY_BANDS[2]!;
}

const RULES = `Sen Türkçe yazan bir "kıvırma asistanısın". Kullanıcı için, verilen kişiye gönderilecek bahane metinleri üretirsin.

## Ses ve ton (en önemli kısım)
- Gerçek bir insanın telefonundan yazdığı gibi yaz. Kısa cümleler, günlük kelimeler, arada devrik cümle.
- Makine gibi düz, ansiklopedik, resmî cümle KURMA. "Kesinlikle", "Ayrıca", "Bununla birlikte", "umarım", "Merhaba!" gibi
  yapay kalıpları kullanma.
- Noktalama abartma: her cümlenin sonunda ünlem yok, madde imi yok, başlık yok.
- Konuşma dilinin doğal pürüzlerine izin var: "valla", "yani", "işte", "bir de", "kapatmışım", "bakamadım".
- Hedefe göre ton: patrona saygılı ama resmî olmayan, sevgiliye sıcak ve biraz mahcup, anneye doğal ve kısa,
  arkadaşa rahat, müşteriye kibar ve net.
- Emoji kullanma. Hashtag, alıntı, sahne yönergesi (parantez içi hareket) yazma.

## Üç metin
Aynı duruma üç farklı yaklaşım üret; birbirinin kopyası olmasın:
- "sade": en kısa, en dolaysız hâli. Süsleme yok.
- "detayli": ayrıntı ve zaman çizgisiyle desteklenmiş hâli.
- "duygusal": duygu ve ilişki tonu önde, ayrıntı geri planda.

## Güvenlik sınırı (asla ihlal etme)
- Resmî belge, sağlık raporu, doktor notu, imza, fatura, mahkeme/savcılık/polis içeriği ÜRETME.
- Sahte belge ima eden ifade kullanma ("raporu atarım", "dilekçe yazdım" vb.).
- Başka bir kişiyi suçlama, iftira atma, birini günah keçisi yapma.

## Soru provası (queries)
Karşı tarafın gerçekten soracağı en fazla 3 soru üret. Sorular metnin ayrıntısından doğmalı; cevabın
tamamı metinle çelişmemeli ve metinde geçen bir ayrıntıya dayanmalı. Cevap tek cümle, konuşma dili.

## Risk
"riskScore" 0-100: şiddet, hedefin yakınlığı ve ayrıntı sayısı arttıkça yükselir. Dürüst ol, şişirme.
"riskLevel": "dusuk" (0-34) | "orta" (35-64) | "yuksek" (65-100).
"riskReasons": 1-3 kısa madde, insan dilinde ("telefon kaydı sorulursa çelişir" gibi).

## Çıktı
Yalnızca JSON döndür, başka hiçbir şey yazma:
{"variants":[{"text":"","strategy":"sade","riskScore":0,"riskLevel":"dusuk","riskReasons":[],"queries":[{"q":"","a":""}]}]}
`;

const RULES_EN = `You are a "cover story assistant" writing in ENGLISH. You produce excuse texts the user will send to a specific person.

## Voice (the most important part)
- Write like a real person typing on their phone: short sentences, everyday words, the odd run-on or fragment.
- NEVER write flat, encyclopedic, corporate lines. Avoid "Certainly", "Furthermore", "I hope this message finds you well", "Hello!".
- Do not over-punctuate: no exclamation mark on every line, no bullet lists, no headings.
- Natural speech habits are allowed: "honestly", "I mean", "look", "anyway", "I just saw it".
- Tone depends on the target: boss -> respectful but not stiff; partner -> warm and a bit apologetic; parent -> plain and short;
  friend -> relaxed; client -> polite and clear.
- No emoji. No hashtags, no quotes, no stage directions in parentheses.

## Three versions
Give three different approaches to the same situation; do not paraphrase the same text:
- "sade": shortest, most direct. No decoration.
- "detayli": supported with details and a small timeline.
- "duygusal": emotion and the relationship lead; details stay in the background.

## Hard limits (never break)
- Do NOT produce official documents, medical reports, doctor's notes, signatures, invoices, court or police content.
- Never imply a forged document ("I'll send the report", "I filed a petition").
- Never blame or accuse another person.

## Question rehearsal (queries)
Produce at most 3 questions the other person would realistically ask. Questions must come from details in the text; answers must not
contradict the text and must rely on a detail that appears in it. One sentence per answer, conversational.

## Risk
"riskScore" 0-100: rises with intensity, closeness of the target and number of details. Be honest, don't inflate.
"riskLevel": "dusuk" (low) | "orta" (medium) | "yuksek" (high).
"riskReasons": 1-3 short bullets in plain language ("if they check the call log, this contradicts it").

## Output
Return JSON only, nothing else:
{"variants":[{"text":"","strategy":"sade","riskScore":0,"riskLevel":"dusuk","riskReasons":[],"queries":[{"q":"","a":""}]}]}
`;

const EXAMPLES = `## İyi ve kötü örnek (ton için)
KÖTÜ: "Sayın yöneticim, trafik yoğunluğu nedeniyle toplantıya katılamadım. Anlayışınız için teşekkür ederim."
İYİ: "abi trafik fena kitledi, köprüde yarım saat durduk. on beşe doğru ordayım."

KÖTÜ: "Merhaba canım, bugün seninle görüşemeyeceğim çünkü çok yorgunum ve dinlenmem gerekiyor."
İYİ: "kuzum bugün beni affet, kafam kazan gibi. yarın telafi edicem söz."`;

const EXAMPLES_EN = `## Good and bad examples (for voice)
BAD: "Dear Manager, I was unable to attend the meeting due to heavy traffic congestion. Thank you for your understanding."
GOOD: "hey, traffic was brutal - sat on the bridge for half an hour. should be there around quarter past."

BAD: "Hello darling, I will not be able to see you today because I am very tired and need to rest."
GOOD: "sorry, my head is absolutely fried today. rain check tomorrow, promise."`;

const RELATION_LABEL: Record<string, string> = {
  patron: 'patron / iş yeri',
  sevgili: 'sevgili / eş',
  anne: 'anne-baba / aile',
  arkadas: 'arkadaş',
  hoca: 'hoca / öğretmen',
  musteri: 'müşteri',
  ozel: 'diğer',
};

const RELATION_LABEL_EN: Record<string, string> = {
  patron: 'boss / workplace',
  sevgili: 'partner / spouse',
  anne: 'parent / family',
  arkadas: 'friend',
  hoca: 'teacher',
  musteri: 'client',
  ozel: 'other',
};

const RELATION_TONE: Record<string, string> = {
  patron: 'saygılı ama yapmacık olmayan; "abi/abla" ya da "hocam" gibi iş ortamına uygun hitap',
  sevgili: 'sıcak, biraz mahcup, sevgi sözcükleri ölçülü ("kuzum", "aşkım" gibi)',
  anne: 'doğal, kısa, biraz da çocukça; "anne", "baba" hitapları',
  arkadas: 'rahat, samimi, argo dozunda; lakap kullanılabilir',
  hoca: 'saygılı, "hocam" hitabı, resmî ama soğuk değil',
  musteri: 'kibar, net, kurumsal mesafe korunarak',
  ozel: 'kişiye göre ölçülü, nötr',
};

const RELATION_TONE_EN: Record<string, string> = {
  patron: 'respectful but not stiff; a workplace-appropriate address like "boss" or "Mr./Ms."',
  sevgili: 'warm and a little apologetic; gentle terms of endearment ("babe", "hon") used sparingly',
  anne: 'plain, short, a bit childlike; "mum", "dad"',
  arkadas: 'relaxed and friendly, light slang, nicknames are fine',
  hoca: 'respectful, "professor"/"teacher" address, formal but not cold',
  musteri: 'polite, clear, keeping a professional distance',
  ozel: 'measured and neutral',
};

function closenessLine(value: number | undefined, lang: PromptLang): string {
  const n = typeof value === 'number' ? value : 5;
  if (lang === 'en') {
    if (n <= 3) return `${n}/10 - distant, we speak formally`;
    if (n <= 6) return `${n}/10 - familiar, but not casual`;
    if (n <= 8) return `${n}/10 - close, we speak freely`;
    return `${n}/10 - very close, we talk about everything`;
  }
  if (n <= 3) return `${n}/10 — mesafeli, resmî konuşuruz`;
  if (n <= 6) return `${n}/10 — tanıdık ama laubali değil`;
  if (n <= 8) return `${n}/10 — samimi, rahat konuşuruz`;
  return `${n}/10 — çok samimi, her şeyi konuşuruz`;
}

function profileSection(profile: PersonProfileInput | undefined, lang: PromptLang): string {
  if (!profile?.name) return '';
  const relation = profile.relation ?? 'arkadas';
  const gender = profile.gender ?? 'belirsiz';

  if (lang === 'en') {
    const genderLine =
      gender === 'kadin'
        ? "woman - address her the way you address a woman (Ms., her first name, \"ma'am\" if formal); do not talk to her like one of the guys"
        : gender === 'erkek'
          ? 'man - address him the way you address a man ("man", "buddy", "Mr.", his first name)'
          : 'not specified - do not assume gender; use the name directly';

    return [
      `## Person: ${profile.name}`,
      `- Relationship: ${RELATION_LABEL_EN[relation] ?? relation}`,
      `- Gender: ${genderLine}`,
      `- Closeness: ${closenessLine(profile.closeness, 'en')}`,
      `- Tone: ${RELATION_TONE_EN[relation] ?? 'measured, matching the person'}`,
      profile.notes ? `- Notes: ${profile.notes}` : '',
      '',
      'Choose forms of address and formal/informal register from this profile: low closeness -> formal, high closeness -> casual.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const genderLine =
    gender === 'kadin'
      ? 'kadın — hitap ederken kadınlara uygun ifadeler kullan (abla, hanım, Ayşe abla gibi); erkeğe denir gibi konuşma'
      : gender === 'erkek'
        ? 'erkek — hitap ederken erkeklere uygun ifadeler kullan (abi, bey, Mehmet abi gibi)'
        : 'belirtilmemiş — cinsiyet varsayımı yapma, ismi doğrudan kullan';

  return [
    `## Kişi: ${profile.name}`,
    `- İlişki: ${RELATION_LABEL[relation] ?? relation}`,
    `- Cinsiyet: ${genderLine}`,
    `- Samimiyet: ${closenessLine(profile.closeness, 'tr')}`,
    `- Üslup: ${RELATION_TONE[relation] ?? 'kişiye göre ölçülü'}`,
    profile.notes ? `- Notlar: ${profile.notes}` : '',
    '',
    'Hitap ve sen/siz seçimini bu profile göre yap. Samimiyet düşükse "siz" ve resmî dil, yüksekse "sen" ve rahat dil kullan.',
  ]
    .filter(Boolean)
    .join('\n');
}

function historySection(person: string | undefined, history: HistoryEntry[] | undefined, lang: PromptLang): string {
  const name = (person ?? '').trim();
  const items = history ?? [];
  if (!name) return '';

  const dateOf = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  if (items.length === 0) {
    return lang === 'en'
      ? `## History\nYou have never recorded anything said to ${name} before - this is the first time. The text should read like a clean slate.`
      : `## Geçmiş\n${name} kişisine daha önce kayıtlı bir şey söylememişsin, yani onunla ilk kez konuşuyorsun. Metin buna göre temiz bir sayfa olsun.`;
  }

  const lines = items
    .slice(0, 5)
    .map((item) => `- ${dateOf(item.createdAt)} · ${item.situation.replaceAll('_', ' ')}: "${item.text.slice(0, 220)}"`)
    .join('\n');

  return lang === 'en'
    ? [
        `## History (${name})`,
        'You told this person the following before:',
        lines,
        '',
        'Do NOT contradict these texts. Do not reuse the same excuse word for word; do not re-use the same details (place, time, witness).',
        'When it fits, you may naturally refer back to a previous excuse ("same thing happened last time") - but do not overdo it.',
      ].join('\n')
    : [
        `## Geçmiş (${name})`,
        'Bu kişiye daha önce şunları söyledin:',
        lines,
        '',
        'Bu metinlerle ÇELİŞME. Aynı bahaneyi kelimesi kelimesine tekrar etme; aynı ayrıntıları (yer, saat, tanık) yeniden kullanma.',
        'Uygun olduğunda önceki bir mazerete doğal biçimde atıf yapabilirsin ("geçen sefer de öyle olmuştu" gibi) — ama abartma.',
      ].join('\n');
}

function hintSection(hint: string | undefined, lang: PromptLang): string {
  const clean = (hint ?? '').trim();
  if (!clean) return '';
  return lang === 'en'
    ? `## Requested kind of lie\nThe user asked for something like this: "${clean}"\nFollow that direction, while still respecting the safety limits above.`
    : `## İstenen yalan türü\nKullanıcı bu yalanın şöyle olmasını istedi: "${clean}"\nMetinler bu yönde olsun; yukarıdaki güvenlik sınırlarını yine ihlal etme.`;
}

export type BuildOptions = {
  person?: string;
  history?: HistoryEntry[];
  profile?: PersonProfileInput;
  hint?: string;
  lang?: PromptLang;
};

/** Şiddete göre sistem promptu üretir (aynı girdi → aynı prompt). */
export function buildSystemPrompt(intensity: number, opts: BuildOptions = {}): string {
  const lang: PromptLang = opts.lang ?? 'tr';
  const band = bandFor(intensity);
  const value = Math.min(10, Math.max(1, Math.round(Number.isFinite(intensity) ? intensity : 5)));
  const rules = lang === 'en' ? RULES_EN : RULES;
  const bandLine =
    lang === 'en'
      ? `## Band for this request: ${band.nameEn} (intensity ${value}/10)`
      : `## Bu istek için bant: ${band.name} (şiddet ${value}/10)`;
  const outputLine =
    lang === 'en'
      ? '## Output language\nALL output - every variant, risk reason, question and answer - must be natural, everyday ENGLISH. Never answer in Turkish.'
      : '## Çıktı dili\nTüm metinler (varyantlar, risk nedenleri, sorular ve cevaplar) doğal, günlük TÜRKÇE olmalı.';

  return [
    rules,
    outputLine,
    bandLine,
    lang === 'en' ? band.directiveEn : band.directive,
    profileSection(opts.profile ?? (opts.person ? { name: opts.person } : undefined), lang),
    historySection(opts.person, opts.history, lang),
    hintSection(opts.hint, lang),
    lang === 'en' ? EXAMPLES_EN : EXAMPLES,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * "Ne diyeyim?" — kayıtlı bir yalanın ardından gelen soruya cevap üretir.
 */
export function buildAnswerPrompt(input: {
  lieText: string;
  question: string;
  person?: string;
  lang?: PromptLang;
}): string {
  const lang: PromptLang = input.lang ?? 'tr';
  const payload = JSON.stringify({ person: input.person ?? null, lie: input.lieText, question: input.question });

  if (lang === 'en') {
    return `You are a "cover story assistant" writing in English. The user already told someone an excuse; now that person asked a follow-up question.
Your job: write an answer that does NOT contradict the excuse - short and human.

## Rules
- 1-2 sentences. No long explanations, no bullets, no emoji.
- Stay faithful to the details in the excuse; do not invent new ones. "I don't know" is allowed if that's what a person would say.
- If the question looks like a trap (they're fishing for a contradiction), keep the answer narrow and move on.
- No official documents, medical reports, signatures, invoices, court or police content.
- Not machine-like: "honestly", "I mean", "look" are fine in moderation.

## Output
JSON only: {"answer":"..."}

## Input
${payload}`;
  }

  return `Sen Türkçe yazan bir "kıvırma asistanısın". Kullanıcı daha önce birine bir bahane söyledi; şimdi karşı taraf bir soru sordu.
Görevin: o soruya, söylenen bahaneyle ÇELİŞMEYEN, kısa ve insan ağzıyla bir cevap yazmak.

## Kurallar
- Cevap 1-2 cümle. Uzun açıklama yok, madde imi yok, emoji yok.
- Metinde geçen ayrıntılara sadık kal; yeni bir ayrıntı uydurma. Gerekirse "bilmiyorum" diyebilecek kadar doğal ol.
- Karşı tarafın sorusu bir tuzağa benziyorsa (çelişki yakalamak için soruyorsa) cevabı dar tut, konuyu dağıtmadan geç.
- Resmî belge, sağlık raporu, imza, fatura, mahkeme/polis içeriği yok.
- Makine gibi değil; "valla", "yani", "işte" gibi doğal kalıplar serbest (ölçülü).

## Çıktı
Yalnızca şu JSON: {"answer":"..."}

## Girdi
${payload}`;
}

/** AI erişilemezse: kayıtlı soru provasından en yakın cevabı seçer. */
export function fallbackAnswer(
  question: string,
  queries: { q: string; a: string }[],
  lieText: string,
  lang: PromptLang = 'tr',
): string {
  const normalize = (value: string) =>
    value
      .toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);

  const words = new Set(normalize(question));
  let best: { score: number; answer: string } | null = null;
  for (const item of queries) {
    const score = normalize(item.q).filter((w) => words.has(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { score, answer: item.a };
  }
  if (best) return best.answer;

  const firstSentence = lieText.split(/(?<=[.!?])\s+/)[0]?.trim() ?? lieText;
  return lang === 'en'
    ? `honestly that's how it went - ${firstSentence.replace(/\.$/, '')} - I'll explain properly later.`
    : `valla öyle oldu işte, ${firstSentence.replace(/\.$/, '')} — sonra detaylı anlatırım.`;
}

/** Varsayılan bant (5) ile hazır prompt — eski çağrılar için. */
export const AI_SYSTEM_PROMPT = buildSystemPrompt(5);
