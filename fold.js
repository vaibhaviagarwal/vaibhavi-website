/* ==========================================================================
   vaibhaviagarwal.ca — the sheet

   >>> EVERYTHING YOU UPDATE REGULARLY IS IN SECTION 1 <<<
   1 · YOUR CONTENT   trips + photos, poker sessions, last.fm
   2 · helpers
   3 · the sheet      windmill -> lotus -> opened
   4 · panels         full content for each face
   5 · trip deck
   6 · poker log + music receipt
   ========================================================================== */
(() => {

/* ==========================================================================
   1 · YOUR CONTENT
   ========================================================================== */

/* key matches data-trip on the trip row.
   each photo is ['path/to/file.jpeg', 'caption'] — leave the caption '' for none.
   drop new files into travel photos/<city>/ and add a line. */
const TRIPS = {
  kolkata: [
    ['travel photos/kolkata/1.jpeg', ''],  ['travel photos/kolkata/2.jpeg', ''],
    ['travel photos/kolkata/3.jpeg', ''],  ['travel photos/kolkata/4.jpeg', ''],
    ['travel photos/kolkata/5.jpeg', ''],  ['travel photos/kolkata/6.jpeg', ''],
    ['travel photos/kolkata/7.jpeg', ''],  ['travel photos/kolkata/8.jpeg', ''],
    ['travel photos/kolkata/9.jpeg', ''],  ['travel photos/kolkata/10.jpeg', '']
  ],
  hamburg: [
    ['travel photos/hamburg/1.jpeg', ''], ['travel photos/hamburg/2.jpeg', ''],
    ['travel photos/hamburg/4.jpeg', ''], ['travel photos/hamburg/5.jpeg', ''],
    ['travel photos/hamburg/6.jpeg', '']
  ],
  prague: [
    ['travel photos/prague/1.jpeg', ''], ['travel photos/prague/2.jpeg', ''],
    ['travel photos/prague/3.jpeg', ''], ['travel photos/prague/4.jpeg', ''],
    ['travel photos/prague/5.jpeg', ''], ['travel photos/prague/6.jpeg', '']
  ],
  amsterdam: [
    ['travel photos/amsterdam/1.jpeg', ''], ['travel photos/amsterdam/2.jpeg', ''],
    ['travel photos/amsterdam/3.jpeg', ''], ['travel photos/amsterdam/4.jpeg', ''],
    ['travel photos/amsterdam/5.jpeg', '']
  ],
  koln: [
    ['travel photos/koln/1.jpeg', ''], ['travel photos/koln/2.jpeg', ''],
    ['travel photos/koln/3.jpeg', ''], ['travel photos/koln/4.jpeg', ''],
    ['travel photos/koln/5.jpeg', '']
  ],
  berlin: [
    ['travel photos/berlin/09A2B412-C57C-453A-A6DB-7B29BACE5D15_1_102_o.jpeg', ''],
    ['travel photos/berlin/2475A724-AE59-42DB-A1B1-FFB348EB0F4A_1_105_c.jpeg', ''],
    ['travel photos/berlin/7BF981BC-EF2C-461E-96B1-7AC6F20F3261_1_102_o.jpeg', '']
  ],
  iceland:  [],   /* not clickable — it's badged "didn't go" */
  london:   [],   /* folder is empty — the deck says so until you add files */
  montreal: [],
  toronto:  []
};

/* ['YYYY-MM-DD', result in dollars, 'note'] — negative for a losing night */
const SESSIONS = [
  // ['2026-09-08', 18, 'ran quiet, folded a lot'],
];

const LASTFM = { user:'vaibhaviagar696', key:'87d3f3ddb22d342144b155fe4ff51d61',
                 period:'7day', label:'LAST 7 DAYS' };

/* ==========================================================================
   2 · helpers
   ========================================================================== */
const NS = 'http://www.w3.org/2000/svg';
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (n, a = {}) => { const e = document.createElementNS(NS, n);
  for (const k in a) e.setAttribute(k, a[k]); return e; };
const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow  = () => matchMedia('(max-width: 900px)').matches;

/* ---- paper sound: filtered noise, synthesised, no audio files ---- */
const Paper = (() => {
  let ctx = null, on = true, buf = null;
  const build = () => {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const len = ctx.sampleRate * 0.6;
    buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random()*2 - 1) * (1 - i/len);
  };
  /* vol 0–1, bright = crisper crease, long = a slower drawn-out rustle */
  const play = (vol = .3, bright = 2200, long = .22) => {
    if (!on || reduced) return;
    try {
      if (!ctx) build();
      if (ctx.state === 'suspended') ctx.resume();
      const src = ctx.createBufferSource(); src.buffer = buf;
      src.playbackRate.value = .8 + Math.random()*.5;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = bright * (.85 + Math.random()*.3);
      bp.Q.value = .7;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
      const g = ctx.createGain();
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol, now + .012);
      g.gain.exponentialRampToValueAtTime(.0001, now + long);
      src.connect(bp).connect(hp).connect(g).connect(ctx.destination);
      src.start(now); src.stop(now + long + .05);
    } catch (e) { /* audio unavailable — silent */ }
  };
  return {
    crease: () => play(.22, 2600, .16),   /* a single crease being pressed */
    open:   () => play(.30, 1500, .42),   /* paper unfolding */
    close:  () => play(.24, 1900, .30),   /* folding back */
    deal:   () => play(.18, 3200, .12),   /* a card off the deck */
    set(v) { on = v; if (v) play(.16, 2400, .14); },
    get on() { return on; }
  };
})();

/* ==========================================================================
   3 · the sheet — windmill, lotus, and the paper that unfolds from it
   ========================================================================== */
const FACES = ['models','steps','grain','studio','trips','scraps'];
const SUBS  = ['projects','experience','how i work','art','travel','logs'];
const N = FACES.length;

/* One shape, two poses. Four cubics each so the structure matches and they can
   interpolate: the windmill's controls sit on straight lines (sharp, angular
   blades), the lotus's bow outward (soft, pointed petals). */
const BLADE = [
  -21.3, -5.3,  -42.7, -10.7,  -64, -16,      /* straight out to the corner */
  -60,  -31.3,  -56,   -46.7,  -52, -62,      /* square across the blade end */
  -39.3,-56.7,  -26.7, -51.3,  -14, -46,      /* straight back in           */
   -9.3,-30.7,   -4.7, -15.3                  /* and home                   */
];
/* the original lotus petal, split in half at each side so it has four
   segments like the blade. identical curve — verified to 1e-14. */
const PETAL = [
  -13,   -23,   -17.25, -47,    -16.125, -68.75,
  -15,   -90.5,  -8.5, -110,      0,    -124,
    8.5,-110,    15,   -90.5,    16.125, -68.75,
   17.25,-47,    13,    -23
];
const dOf = v => `M0 0 C${v[0]} ${v[1]} ${v[2]} ${v[3]} ${v[4]} ${v[5]}` +
                    ` C${v[6]} ${v[7]} ${v[8]} ${v[9]} ${v[10]} ${v[11]}` +
                    ` C${v[12]} ${v[13]} ${v[14]} ${v[15]} ${v[16]} ${v[17]}` +
                    ` C${v[18]} ${v[19]} ${v[20]} ${v[21]} 0 0 Z`;
const lerp  = (a,b,t) => a.map((x,i) => x + (b[i]-x)*t);
const ease  = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2;

const model = $('#model'), innerG = $('#inner'), labels = $('#labels'), creases = $('#creases');
const core = $('#core'), intro = $('#intro');
const outer = [], inner = [], texts = [];

for (let i = 0; i < N; i++) {
  const g = el('g', { class:'petal' });
  const p = el('path', { fill:'url(#gOut)', 'fill-opacity':'.94', stroke:'rgba(6,12,11,.55)', 'stroke-width':'1' });
  g.appendChild(p); model.appendChild(g);
  outer.push({ g, p });

  const gi = el('g', { class:'petal', opacity:'0' });
  const pi = el('path', { fill:'url(#gIn)', 'fill-opacity':'.92', stroke:'rgba(6,12,11,.45)', 'stroke-width':'.8' });
  gi.appendChild(pi); innerG.appendChild(gi);
  inner.push({ g:gi, p:pi });

  const t = el('text', { class:'pl', 'text-anchor':'middle' }); t.textContent = FACES[i];
  const s = el('text', { class:'ps', 'text-anchor':'middle' }); s.textContent = SUBS[i].toUpperCase();
  const go = () => openFace(FACES[i]);
  t.addEventListener('click', go); s.addEventListener('click', go);
  t.addEventListener('mouseenter', () => outer[i].g.classList.add('hot'));
  t.addEventListener('mouseleave', () => outer[i].g.classList.remove('hot'));
  labels.append(t, s);
  texts.push({ t, s });
}

/* crease pattern behind the model — mountains solid, valleys dashed */
for (let i = 0; i < N; i++) {
  const a = (i/N)*Math.PI*2 - Math.PI/2;
  creases.appendChild(el('line', { x1:0, y1:0, x2:Math.cos(a)*152, y2:Math.sin(a)*152,
    stroke:'var(--cream)', 'stroke-width':'.7', 'stroke-opacity': i%2 ? '.16':'.28',
    'stroke-dasharray': i%2 ? '5 5':'0' }));
}
[48,92,136].forEach((r,k) => {
  const pts = [];
  for (let i = 0; i <= N; i++) { const a = (i/N)*Math.PI*2 - Math.PI/2;
    pts.push(`${Math.cos(a)*r},${Math.sin(a)*r}`); }
  creases.appendChild(el('polyline', { points:pts.join(' '), fill:'none', stroke:'var(--cream)',
    'stroke-width':'.7', 'stroke-opacity': k===1 ? '.24':'.12', 'stroke-dasharray': k===1 ? '0':'4 5' }));
});

/* real lotuses open in daylight and close at night */
const hour = new Date().getHours();
const daylight = Math.max(0, Math.min(1, Math.sin((hour-5)/14*Math.PI)));
const OPENNESS = 0.84 + 0.16*daylight;

let t = 0, target = 0, phase = 0;
let spin = 0, spinV = .22, wind = 0, breathe = 0;
let dragging = false, dragY = 0, dragT = 0;

function render() {
  const e = ease(t);
  const dstr = dOf(lerp(BLADE, PETAL, e));
  breathe += .012;
  const puff = 1 + Math.sin(breathe) * .012 * e;

  for (let i = 0; i < N; i++) {
    const base = (i/N)*360;
    const sc = ((1-t)*0.92 + t*OPENNESS) * puff;
    outer[i].g.setAttribute('transform', `rotate(${base + spin*(1-t)}) scale(${sc})`);
    outer[i].p.setAttribute('d', dstr);

    inner[i].g.setAttribute('opacity', (Math.max(0, e-.45)/.55).toFixed(2));
    inner[i].g.setAttribute('transform',
      `rotate(${base + 30 + spin*(1-t)*.5}) scale(${(sc*.58).toFixed(3)})`);
    inner[i].p.setAttribute('d', dstr);

    const a = (base - 90) * Math.PI/180, R = 146;
    texts[i].t.setAttribute('x', (Math.cos(a)*R).toFixed(1));
    texts[i].t.setAttribute('y', (Math.sin(a)*R).toFixed(1));
    texts[i].s.setAttribute('x', (Math.cos(a)*(R+15)).toFixed(1));
    texts[i].s.setAttribute('y', (Math.sin(a)*(R+15)).toFixed(1));
  }
  core.setAttribute('r', (e*11).toFixed(1));
  core.setAttribute('opacity', e.toFixed(2));
  creases.setAttribute('opacity', (t*.85).toFixed(2));

  const on = t > .74 && phase !== 2;
  texts.forEach(o => { o.t.classList.toggle('on', on); o.s.classList.toggle('on', on); });
  $('#foldpct').textContent = Math.round(t*100) + '% folded';
  $('#state').textContent = phase === 2 ? 'reading' : t < .15 ? 'windmill' : t > .85 ? 'lotus' : 'folding';
  const introOut = Math.max(0, 1 - t * 3.2);
  intro.style.opacity = phase === 2 ? 0 : introOut.toFixed(2);
  intro.style.pointerEvents = introOut > .1 ? 'auto' : 'none';
}

function setPhase(p) {
  phase = p;
  document.body.dataset.phase = p;
  $('#paper').setAttribute('aria-hidden', p !== 2);
}

/* wind — cursor speed spins the windmill */
let lastX = null;
addEventListener('mousemove', ev => {
  if (lastX !== null) wind = Math.min(2.4, Math.abs(ev.clientX - lastX) * .045);
  lastX = ev.clientX;
}, { passive:true });

/* drag to fold */
const sheet = $('#sheet');
const down = y => { if (phase === 2) return; dragging = true; dragY = y; dragT = t; sheet.classList.add('dragging'); };
const move = y => { if (!dragging) return; t = Math.max(0, Math.min(1, dragT + (dragY - y)/240)); render(); };
const up   = () => { if (!dragging) return; dragging = false; sheet.classList.remove('dragging');
  target = t > .35 ? 1 : 0; Paper.crease(); };

sheet.addEventListener('mousedown', ev => { ev.preventDefault(); down(ev.clientY); });
addEventListener('mousemove', ev => move(ev.clientY));
addEventListener('mouseup', up);
sheet.addEventListener('touchstart', ev => down(ev.touches[0].clientY), { passive:true });
addEventListener('touchmove', ev => { if (dragging) move(ev.touches[0].clientY); }, { passive:true });
addEventListener('touchend', up);
sheet.addEventListener('click', () => {
  if (Math.abs(t - dragT) < .02 && phase !== 2) { target = target === 1 ? 0 : 1; Paper.crease(); }
});

$('#home').addEventListener('click', () => {
  if (phase === 2) { closeFace(); return; }
  target = 0; setPhase(0);
});

function loop() {
  if (!dragging) {
    t += (target - t) * .07;
    if (Math.abs(target - t) < .001) t = target;
  }
  if (phase === 0 && t > .9) setPhase(1);
  if (phase === 1 && t < .3) setPhase(0);
  spinV += (.22 + wind - spinV) * .06;
  wind *= .94;
  spin = (spin + spinV * (1-t) * 2.4) % 360;
  render();
  requestAnimationFrame(loop);
}
if (reduced) { t = 1; target = 1; setPhase(1); render(); } else loop();

/* the print sits under the lotus, and opens in the spotlight when clicked */
const printEl = $('#print');
const openPrint = () => openDeck('Euclid Ave · Toronto',
  [['vaibhavi.JPG', 'Koreatown, Toronto']]);
printEl.addEventListener('click', openPrint);
printEl.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openPrint(); }
});

/* sound toggle */
const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => {
  const next = !Paper.on;
  Paper.set(next);
  soundBtn.setAttribute('aria-pressed', next);
  soundBtn.textContent = next ? 'sound on' : 'sound off';
});

const project = (n, num, stack, body, extra = '') => `
  <article class="item"><h3>${n}</h3>
  <p class="meta-l">${num} · ${stack}</p><p class="b">${body}</p>${extra}</article>`;

const CONTENT = {
models: `<p class="lede">Things I built during hackathons or just for fun!</p>
  ${project('empowHER<span class="badge">IBM runner-up</span>','01','NEXT.JS · TYPESCRIPT · FASTAPI · IBM WATSONX.AI',
    'An AI healthcare platform that transcribes a visit and writes the care plan from it. The backend turns unstructured medical dictation into structured JSON through watsonx LLMs; the dashboard tracks care-readiness scores and symptom trends. Runner-up at GenAI &rsquo;26.',
    '<a class="repo" href="#" target="_blank" rel="noopener">repo ↗</a>')}
  ${project('Settlement assistant','02','REACT · FIREBASE · GOOGLE MAPS · GEMINI',
    'Newcomer guidance across housing, employment and services, personalised by profile, with a multilingual chatbot answering in 20+ languages. I moved countries once; the paperwork is worse than the flight.',
    '<a class="repo" href="#" target="_blank" rel="noopener">repo ↗</a>')}
  ${project('ShantiChat','03','PYTHON · LLM · CBT + HINDU PHILOSOPHY',
    'A wellness chatbot for talking through a bad day — CBT-style prompting blended with gentle Hindu philosophy. Support, not medical care.',
    '<video controls preload="metadata" playsinline src="shanti_chat.mp4"></video><a class="repo" href="#" target="_blank" rel="noopener">repo ↗</a>')}
  ${project('Waterloo course finder','04','JAVA 17 · SWING · MAVEN · GSON',
    'Type a course code, get title, prereqs, coreqs and antireqs immediately. Built it because the official search took four clicks too many.',
    '<video controls preload="metadata" playsinline src="finder-demo.mp4"></video><a class="repo" href="#" target="_blank" rel="noopener">repo ↗</a>')}`,

steps: `
  <article class="item"><h3>Research assistant, business analytics</h3>
  <p class="meta-l">HAMBURG UNIVERSITY OF TECHNOLOGY (TUHH) · HAMBURG · APR 2026 – PRESENT</p>
  <ul><li>Built a full-stack desktop app (React, FastAPI, Electron) for ConFlowGen, an open-source PyPI library, so non-technical researchers can generate synthetic maritime container datasets without Python or a CLI.</li>
  <li>Architected a REST API wrapping the ConFlowGen Python API — SSE real-time log streaming, SQLite scenario management, CSV import, and zero-dependency deployment via a bundled Python 3.12 runtime.</li>
  <li>Engineered a data-cleaning pipeline over 5,000 inland waterway notices across four countries, parsing nested JSON and standardising mixed-format timestamps into a validated 4,743-row export.</li></ul></article>

  <article class="item"><h3>Developer</h3>
  <p class="meta-l">UNIFY GIVING · REMOTE · INCOMING AUG 2026</p></article>

  <article class="item"><h3>Directed reading program participant</h3>
  <p class="meta-l">COMBINATORICS &amp; OPTIMIZATION, UWATERLOO (WIMDRP) · MAY 2026 – PRESENT</p>
  <ul><li>Selected for the competitive Women in Mathematics DRP to study computational origami and geometric folding theory under faculty mentorship.</li>
  <li>Working through flat-foldability, crease-pattern validity, and graph-theoretic models of fold sequences.</li></ul></article>

  <article class="item"><h3>Editor-in-chief</h3>
  <p class="meta-l">HUMBERSIDE COLLEGIATE INSTITUTE · TORONTO · SEP 2024 – JUL 2025</p>
  <ul><li>Directed 10 subteams and 30+ contributors to produce and deliver the annual yearbook to a student body of 2,000+.</li>
  <li>Coordinated across clubs, student council, faculty and administration, and shot original event photography.</li></ul></article>

  <article class="item"><h3>Assistant badminton coach</h3>
  <p class="meta-l">ETOBICOKE JUNIOR BADMINTON CLUB · TORONTO · SEP 2022 – JUL 2025</p>
  <ul><li>Coached 30+ youth players over three years through structured drills and individual feedback.</li>
  <li>Managed a volunteer team, tracking schedules and service hours.</li></ul></article>`,

grain: `<p class="lede">Not a skills list — the resume has that.</p>
  <article class="item"><h3>I get tighter before I get bolder.</h3>
  <p class="b">I like to understand the room before I commit to a direction. Whether I'm looking at a dataset, working through an argument, or solving a problem, I enjoy gathering the information that others might skip past. Once I understand the shape of the problem, I move quickly.</p></article>
  <article class="item"><h3>I learn by teaching.</h3>
  <p class="b">Coaching beginners made me better than playing did. Breaking something down for someone who couldn't do it yet forced me to understand it precisely, not approximately. It's also how I tend to work with teams: if I can explain something simply, I probably understand it well enough to improve it.</p></article>
  <article class="item"><h3>I look for the simplest path that works.</h3>
  <p class="b">I like getting to the point. I'm naturally drawn to finding the direct route through a problem, cutting steps that don't add value, and making complicated things easier to navigate. I care about efficiency, but not for its own sake — the goal is to make the outcome clearer and better.</p></article>
  <article class="item"><h3>I build for the person who doesn't know yet.</h3>
  <p class="b">This is probably the through-line in everything I do. I'm interested in taking something that only works if you already have the context and making it accessible to someone who doesn't. A container dataset. A course lookup. Navigating a new country. A first badminton lesson. Different problems, same instinct: understand the system deeply enough to make the way in easier for someone else.</p></article>
  <p class="lede" style="border-top:1px dashed var(--line);padding-top:1.1rem;margin-top:.4rem">That's how I tend to contribute. I ask questions before I make assumptions, learn quickly by getting close to the problem, simplify where I can, and try to leave things easier to understand than I found them.</p>`,

studio: `<p class="lede">My mum paints, properly. I was made to learn young, and I keep coming back to it.</p>
  <div class="artgrid">
    <figure><img src="art/1.jpeg" alt="Veronice — lead and charcoal drawing by Vaibhavi Agarwal">
    <figcaption>Veronice<span>Lead &amp; Charcoal</span></figcaption></figure>
  </div>`,

trips: `<p class="lede">Places I've been, and the ones I keep planning. I photograph everything — it's how I hold onto a trip in detail rather than in general.</p>
  <ul class="trips">
    <li data-trip="hamburg"><span class="place">Hamburg</span><span class="state went">went</span></li>
    <li data-trip="kolkata"><span class="place">Kolkata</span><span class="state went">went</span></li>
    <li data-trip="berlin"><span class="place">Berlin</span><span class="state went">went</span></li>
    <li data-trip="amsterdam"><span class="place">Amsterdam</span><span class="state went">went</span></li>
    <li data-trip="koln"><span class="place">Köln</span><span class="state went">went</span></li>
    <li data-trip="prague"><span class="place">Prague</span><span class="state went">went</span></li>
    <li data-trip="london"><span class="place">London</span><span class="state went">went</span></li>
    <li data-trip="toronto"><span class="place">Toronto</span><span class="state went">went</span></li>
    <li data-trip="montreal"><span class="place">Montréal</span><span class="state went">went</span></li>
    <li data-trip="iceland"><span class="place">Iceland, ring road, allegedly two weeks</span><span class="state no">didn't go</span></li>
  </ul>
  <p class="triphint">Click a place I've been to deal the hand.</p>`,

scraps: `<p class="lede">Three things I keep track of. None of them are work.</p>

  <section class="log">
    <div class="log-head"><p class="tag">At the table</p>
      <p class="log-sub">poker · tuesdays and thursdays</p></div>
    <div id="pstats"></div>
    <canvas id="spark" height="64" aria-label="Cumulative result across sessions"></canvas>
    <ul id="plog"></ul>
    <p class="pnote">Kept honestly — wins and losses both.</p>
  </section>

  <section class="log">
    <div class="log-head"><p class="tag">On repeat</p>
      <p class="log-sub">straight off last.fm, no upkeep</p></div>
    <div class="receipt" id="receipt"></div>
  </section>

  <section class="log">
    <div class="log-head"><p class="tag">Watched</p>
      <p class="log-sub">whenever something sticks</p></div>
    <article class="film">
      <h3>Fallen Angels</h3>
      <p class="filmmeta">Wong Kar-wai · 1995</p>
      <p class="rating" aria-label="5 out of 5"><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span></p>
      <p class="b">Three people who've each put a wall between themselves and everyone
        else, and the film never asks them to take it down. The wide-angle lens does most
        of that work — everyone's close enough to touch and still looks like they're
        standing in separate rooms. I keep rewatching it and finding it warmer than I
        remembered.</p>
    </article>
  </section>`
};


const paper = $('#paper');
let openId = null;

function openFace(id) {
  const i = FACES.indexOf(id);
  openId = id;
  $('#paper-kicker').textContent = `fold 0${i+1} — ${SUBS[i]}`;
  $('#paper-title').textContent = id;
  $('#paper-body').innerHTML = CONTENT[id] || '<p class="lede">not folded yet.</p>';
  $('.leaf').scrollTop = 0;
  setPhase(2);
  Paper.open();
  wireFace(id);
  /* single column: bring the paper into view instead of leaving it below the fold */
  if (narrow()) requestAnimationFrame(() =>
    $('#paper').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }));
}
function closeFace() {
  openId = null; setPhase(1); Paper.close();
  if (narrow()) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
$('#paper-close').addEventListener('click', closeFace);
addEventListener('keydown', ev => {
  if (ev.key !== 'Escape') return;
  if (!$('#deck-overlay').hidden) closeDeck();
  else if (phase === 2) closeFace();
});

/* per-face wiring once its markup exists */
function wireFace(id) {
  $$('#paper-body .repo').forEach(a => { if (a.getAttribute('href') === '#') a.remove(); });
  $$('#paper-body img').forEach(img => img.addEventListener('error', () => {
    const f = img.closest('figure'); if (f) f.remove();
  }));
  if (id === 'trips') wireTrips();
  if (id === 'scraps') { renderPoker(); requestAnimationFrame(drawSpark); loadMusic(); }
}

/* ==========================================================================
   5 · trip deck
   ========================================================================== */
const overlay = $('#deck-overlay'), deckEl = $('#deck');
const deckBar = $('.deck-bar'), deckHint = $('.deck-hint');
let deckPhotos = [], deckIdx = 0, lastFocus = null;

function layoutDeck() {
  const n = deckPhotos.length;
  [...deckEl.children].forEach((card, i) => {
    let off = (i - deckIdx + n) % n; if (off > 3) off = 4;
    card.dataset.off = off; card.style.zIndex = String(20 - off);
  });
  $('#deck-count').textContent = (deckIdx + 1) + ' / ' + n;
}
const step = dir => { const n = deckPhotos.length; if (n < 2) return;
  deckIdx = (deckIdx + dir + n) % n; layoutDeck(); Paper.deal(); };

function emptyCard() {
  deckBar.hidden = true;
  deckHint.textContent = 'esc or click away to fold';
  deckEl.innerHTML = '<figure class="pcard pcard-empty" data-off="0"><p>No photos to display at the moment.</p></figure>';
}

function openDeck(title, photos) {
  deckPhotos = photos || []; deckIdx = 0; lastFocus = document.activeElement;
  $('#deck-title').textContent = title;
  const empty = !deckPhotos.length;
  deckBar.hidden = empty || deckPhotos.length < 2;
  deckHint.textContent = empty ? 'esc or click away to fold'
                               : 'click the card to shuffle · esc to fold';
  if (empty) emptyCard();
  else {
    deckEl.innerHTML = deckPhotos.map(([src, cap]) =>
      `<figure class="pcard"><img src="${esc(src)}" alt="${esc(cap || title)}">` +
      (cap ? `<figcaption>${esc(cap)}</figcaption>` : '') + `</figure>`).join('');
    [...deckEl.children].forEach(c => {
      c.addEventListener('click', () => step(1));
      c.querySelector('img').addEventListener('error', () => {
        const i = [...deckEl.children].indexOf(c);
        if (i > -1) deckPhotos.splice(i, 1);
        c.remove();
        if (!deckPhotos.length) return emptyCard();
        deckIdx = 0; deckBar.hidden = deckPhotos.length < 2; layoutDeck();
      });
    });
    layoutDeck();
  }
  overlay.hidden = false;
  Paper.deal();
  requestAnimationFrame(() => overlay.classList.add('on'));
  (empty ? overlay : $('#deck-next')).focus();
}
function closeDeck() {
  overlay.classList.remove('on');
  setTimeout(() => { overlay.hidden = true; deckEl.innerHTML = ''; }, 220);
  if (lastFocus) lastFocus.focus();
}
overlay.addEventListener('click', e => { if (e.target === overlay) closeDeck(); });
$('#deck-next').addEventListener('click', () => step(1));
$('#deck-prev').addEventListener('click', () => step(-1));
addEventListener('keydown', e => {
  if (overlay.hidden) return;
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft')  step(-1);
});
let swipeX = null;
overlay.addEventListener('touchstart', e => { swipeX = e.touches[0].clientX; }, { passive:true });
overlay.addEventListener('touchend', e => {
  if (swipeX === null) return;
  const dx = e.changedTouches[0].clientX - swipeX;
  if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
  swipeX = null;
}, { passive:true });

function wireTrips() {
  $$('#paper-body .trips li[data-trip]').forEach(li => {
    if (!li.querySelector('.state.went')) return;
    const photos = TRIPS[li.dataset.trip] || [];
    const place = li.querySelector('.place');
    const label = place.textContent;
    place.innerHTML = `<button class="tripbtn" type="button">${esc(label)}` +
      (photos.length ? `<span class="tripn">${photos.length}</span>` : '') + '</button>';
    place.querySelector('button').addEventListener('click', () => openDeck(label, photos));
  });
}

/* ==========================================================================
   6 · poker log + music receipt
   ========================================================================== */
const money = n => (n >= 0 ? '+$' : '−$') + Math.abs(n);

function renderPoker() {
  const stats = $('#pstats'); if (!stats) return;
  if (!SESSIONS.length) {
    stats.outerHTML = '<p class="pempty">Tracking from September 2026. Every session, wins and losses both — a record is only worth keeping if it\'s complete.</p>';
    $('#spark') && $('#spark').remove();
    $('#plog') && $('#plog').remove();
    $('.pnote') && $('.pnote').remove();
    return;
  }
  const net  = SESSIONS.reduce((s,x) => s + x[1], 0);
  const wins = SESSIONS.filter(x => x[1] > 0).length;
  const best = Math.max(...SESSIONS.map(x => x[1]));
  stats.innerHTML = [['sessions',SESSIONS.length],['net',money(net)],
    ['winning nights', wins+'/'+SESSIONS.length],['best',money(best)]]
    .map(([k,v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  $('#plog').innerHTML = SESSIONS.slice().reverse().map(([d,r,n]) =>
    `<li><span class="pd">${d.slice(5)}</span>
      <span class="pn">${esc(n||'—')}</span>
      <span class="pr">${money(r)}</span></li>`).join('');
}

function drawSpark() {
  const cv = $('#spark'); if (!cv || !cv.clientWidth || !SESSIONS.length) return;
  const ctx = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = 70;
  cv.width = w*dpr; cv.height = h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  let acc = 0;
  const pts = [0].concat(SESSIONS.map(s => (acc += s[1])));
  const lo = Math.min(...pts,0), hi = Math.max(...pts,0), pad = 8;
  const X = i => (i/(pts.length-1))*(w-2)+1;
  const Y = v => h - pad - ((v-lo)/((hi-lo)||1))*(h-pad*2);
  ctx.strokeStyle = 'rgba(27,23,18,.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,Y(0)); ctx.lineTo(w,Y(0)); ctx.stroke();
  ctx.strokeStyle = pts[pts.length-1] >= 0 ? '#4a6b5c' : '#8a6a2f';
  ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.beginPath();
  pts.forEach((v,i) => i ? ctx.lineTo(X(i),Y(v)) : ctx.moveTo(X(i),Y(v)));
  ctx.stroke();
}
addEventListener('resize', drawSpark);

const FALLBACK = [['Nothing scrobbled yet','give it a few days',''],
                  ['Everything you play','lands here on its own',''],
                  ['No upkeep required','that is the point','']];

function renderReceipt(rows, plays, last) {
  const r = $('#receipt'); if (!r) return;
  r.innerHTML = `<h3>Vaibhavi&rsquo;s receipt</h3><p class="rsub">TOP TRACKS · ${LASTFM.label}</p><div class="rrule"></div>` +
    rows.map(([n,a,p],i) => `<div class="rrow"><span class="i">${String(i+1).padStart(2,'0')}</span>
      <span class="n">${esc(n)}<span class="a">${esc(a)}</span></span><span class="d">${p?'×'+p:''}</span></div>`).join('') +
    `<div class="rrule"></div><div class="rtot"><span>ITEMS</span><span>${rows.length}</span></div>` +
    (plays ? `<div class="rtot"><span>TOTAL PLAYS</span><span>${plays}</span></div>` : '') +
    `<div class="barcode"></div>` +
    (last ? `<p class="rlast">LAST PLAYED · ${esc(last)}</p>` : '') +
    `<p class="rfoot">THANK YOU FOR LISTENING</p>`;
}

async function loadMusic() {
  renderReceipt(FALLBACK, 0, '');
  if (!LASTFM.key) return;
  const api = (m, extra) => `https://ws.audioscrobbler.com/2.0/?method=${m}` +
    `&user=${encodeURIComponent(LASTFM.user)}&api_key=${LASTFM.key}&format=json${extra}`;
  try {
    const [tr, rr] = await Promise.all([
      fetch(api('user.gettoptracks', `&period=${LASTFM.period}&limit=5`)),
      fetch(api('user.getrecenttracks', '&limit=1'))
    ]);
    const top = await tr.json();
    const list = (top && top.toptracks && top.toptracks.track) || [];
    if (!list.length) return;
    const rows  = list.map(x => [x.name, (x.artist && x.artist.name) || '', x.playcount]);
    const plays = list.reduce((s,x) => s + Number(x.playcount || 0), 0);
    let last = '';
    try {
      const rec = await rr.json();
      const r0 = rec && rec.recenttracks && rec.recenttracks.track && rec.recenttracks.track[0];
      if (r0) last = r0.name + ' — ' + ((r0.artist && r0.artist['#text']) || '');
    } catch (e) {}
    renderReceipt(rows, plays, last);
  } catch (e) { /* file:// or offline — fallback already rendered */ }
}

})();
