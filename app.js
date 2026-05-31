const events = [
  {id:'vm-aabningskamp', type:'internal', icon:'⚽', title:'VM – Åbningskamp', match:'Mexico – Sydafrika', date:'2026-06-11', start:'20:00', end:'23:30', open:'Dørene åbner kl. 20.00', timeText:'Kampstart kl. 21.00', place:'Logen, Frederiksgade 15, Slagelse', poster:'assets/vm-i-logen-2026.png', text:'Uformel fodboldaften med kampe på storskærm, chips, hygge og mulighed for at købe øl og vand i baren. Tag gerne en ledsager med.'},
  {id:'vm-gruppekamp', type:'internal', icon:'⚽', title:'VM – Gruppekamp', match:'Norge – Frankrig', date:'2026-06-26', start:'20:00', end:'23:30', open:'Dørene åbner kl. 20.00', timeText:'Kampstart kl. 21.00', place:'Logen, Frederiksgade 15, Slagelse', poster:'assets/vm-i-logen-2026.png', text:'Endnu en uformel VM-aften i logen med storskærm, chips og god stemning. Øl og vand kan købes i baren.'},
  {id:'vm-finale', type:'internal', icon:'⚽', title:'VM – Finale', match:'Finalen', date:'2026-07-19', start:'20:00', end:'23:59', open:'Dørene åbner kl. 20.00', timeText:'Kampstart kl. 21.00', place:'Logen, Frederiksgade 15, Slagelse', poster:'assets/vm-i-logen-2026.png', text:'Finaleaften i logen med storskærm, chips og hygge. Øl og vand kan købes i baren. Tag gerne en ledsager med.'},
  {id:'loppemarked', type:'public', icon:'🛍️', title:'Loppemarked', match:'Kom og gør et kup', date:'2026-08-22', start:'10:00', end:'15:00', open:'', timeText:'Kl. 10.00 – 15.00', place:'Odd Fellow Bygningen, Frederiksgade 15, Slagelse', poster:'assets/loppemarked-2026.png', text:'Loppemarked i Odd Fellow-huset med stande, loppefund, pølser med brød, kaffe, kage og gratis popcorn.'},
  {id:'sct-michaels-nat', type:'public', icon:'🎪', title:'Sct. Michaels Nat', match:'Mød Odd Fellow logerne i Slagelse', date:'2026-09-25', start:'18:00', end:'22:00', open:'', timeText:'Fredag d. 25. september', place:'Slagelse Midtby', poster:'assets/sct-michaels-nat-2026.png', text:'Kom forbi vores stand og få en uforpligtende snak om fællesskab, aktiviteter og hvad der foregår i en loge. Der vil også være mulighed for at vinde præmier.'},
  {id:'sct-patricks-day', type:'public', icon:'🍀', title:"Sct. Patrick's Day", match:'Vi gentager succesen', date:'2027-03-19', start:'17:00', end:'23:00', open:'', timeText:'Kl. 17.00 – 23.00', place:'Odd Fellow Bygningen, Frederiksgade 15, Slagelse', poster:'assets/sct-patricks-day-2027.png', text:'Festlig aften med musik, fællesskab, irsk stemning, salg af drikkevarer og mulighed for at købe lidt mad.'}
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const eventList = $('#eventList');
const calendarList = $('#calendarList');
const nextEvent = $('#nextEvent');
const modal = $('#eventModal');
const modalContent = $('#modalContent');
const posterModal = $('#posterModal');
const posterImage = $('#posterImage');
const posterTitle = $('#posterTitle');
const filterSelect = $('#filterSelect');
let currentFilter = 'all';
let zoom = 1;

function daDate(iso, weekday=true){return new Intl.DateTimeFormat('da-DK',{weekday: weekday?'long':undefined, day:'numeric', month:'long', year:'numeric'}).format(new Date(iso+'T12:00:00'));}
function shortDate(iso){return new Intl.DateTimeFormat('da-DK',{day:'numeric', month:'short'}).format(new Date(iso+'T12:00:00'));}
function monthName(iso){return new Intl.DateTimeFormat('da-DK',{month:'long', year:'numeric'}).format(new Date(iso+'T12:00:00'));}
function tag(type){return type === 'internal' ? 'Internt arrangement' : 'Offentligt arrangement';}
function sortedEvents(){return [...events].sort((a,b)=>a.date.localeCompare(b.date));}
function upcoming(){const today = new Date(); today.setHours(0,0,0,0); return sortedEvents().filter(e => new Date(e.date+'T00:00:00') >= today);}
function shownEvents(){return upcoming().filter(e => currentFilter === 'all' || e.type === currentFilter);}
function byId(id){return events.find(e => e.id === id);}
function calUrl(e){const start=e.date.replaceAll('-','')+'T'+e.start.replace(':','')+'00'; const end=e.date.replaceAll('-','')+'T'+e.end.replace(':','')+'00'; const text=encodeURIComponent(e.title + (e.match ? ' – '+e.match : '')); const details=encodeURIComponent(`${e.text}\n\n${e.open ? e.open + '\n' : ''}${e.timeText}`); return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${encodeURIComponent(e.place)}`;}

function renderHero(){const e = upcoming()[0] || sortedEvents()[0]; nextEvent.innerHTML = `<article class="next-card"><button class="next-thumb" onclick="openPoster('${e.id}')" aria-label="Åbn plakat"><img src="${e.poster}" alt="${e.title} plakat"></button><div class="next-info"><span class="tag">${tag(e.type)}</span><h3>${e.icon} ${e.title}</h3><div class="match">${e.match}</div><div class="meta"><div><span>📅</span><span>${daDate(e.date)}</span></div><div><span>🕘</span><span>${e.open ? e.open + '<br>' : ''}${e.timeText}</span></div><div><span>📍</span><span>${e.place}</span></div></div><p class="desc">${e.text}</p><div class="actions"><button class="btn primary" onclick="openEvent('${e.id}')">Se detaljer ›</button><button class="btn soft" onclick="openPoster('${e.id}')">Se plakat ⛶</button></div></div></article>`;}
function renderList(){const items = shownEvents(); eventList.innerHTML = items.length ? items.map(e => `<button class="event-card" onclick="openEvent('${e.id}')"><div class="event-icon">${e.icon}</div><div><h3>${e.title}</h3><p><strong>${e.match}</strong><br>${daDate(e.date,false)} · ${e.timeText}</p></div><div class="chev">›</div></button>`).join('') : `<div class="empty">Ingen arrangementer i denne kategori.</div>`;}
function renderCalendar(){let html=''; let current=''; for(const e of upcoming()){const m=monthName(e.date); if(m!==current){current=m; html += `<div class="month-title">${m}</div>`;} html += `<button class="calendar-row" onclick="openEvent('${e.id}')"><div class="date-box">${shortDate(e.date)}</div><div><strong>${e.icon} ${e.title}</strong><span>${e.match}<br>${e.timeText}</span></div></button>`;} calendarList.innerHTML = html;}

window.openEvent = function(id){const e=byId(id); modalContent.innerHTML = `<div class="detail-poster-wrap" onclick="openPoster('${e.id}')"><img class="detail-poster" src="${e.poster}" alt="${e.title} plakat"></div><h2 class="modal-title">${e.icon} ${e.title}</h2><p class="modal-sub">${e.match}</p><div class="info-grid"><div class="info-row"><span>📅</span><div>${daDate(e.date)}</div></div><div class="info-row"><span>🕘</span><div>${e.open ? e.open + '<br>' : ''}${e.timeText}</div></div><div class="info-row"><span>📍</span><div>${e.place}</div></div><div class="info-row"><span>🔒</span><div>${tag(e.type)}</div></div></div><p class="description">${e.text}</p><div class="modal-actions"><a class="btn primary" href="${calUrl(e)}" target="_blank" rel="noopener">Tilføj kalender</a><button class="btn soft" onclick="openPoster('${e.id}')">Åbn plakat</button></div>`; modal.showModal();}
window.openPoster = function(id){const e=byId(id); posterImage.src=e.poster; posterImage.alt=e.title+' plakat'; posterTitle.textContent=e.title; zoom=1; posterImage.style.width='100%'; posterImage.style.transform='scale(1)'; if(modal.open) modal.close(); posterModal.showModal();}

filterSelect.addEventListener('change', e=>{currentFilter=e.target.value; renderList();});
$('[data-close]').addEventListener('click',()=>modal.close());
$('[data-poster-close]').addEventListener('click',()=>posterModal.close());
$('[data-zoom-reset]').addEventListener('click',()=>{zoom=1; posterImage.style.width='100%'; posterImage.style.transform='scale(1)';});
posterImage.addEventListener('dblclick',()=>{zoom = zoom === 1 ? 1.8 : 1; posterImage.style.width = (zoom*100)+'%';});
$$('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{const v=btn.dataset.view; $$('.nav-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); $$('.view').forEach(view=>view.classList.remove('active-view')); $('#view'+v[0].toUpperCase()+v.slice(1)).classList.add('active-view'); window.scrollTo({top:0,behavior:'smooth'});}));
let deferredPrompt; const installBtn=$('#installBtn'); window.addEventListener('beforeinstallprompt',e=>{e.preventDefault(); deferredPrompt=e; installBtn.hidden=false;}); installBtn.addEventListener('click',async()=>{if(!deferredPrompt)return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installBtn.hidden=true;}); if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));}
renderHero(); renderList(); renderCalendar();



/* V7: Pinch-to-zoom poster viewer */
(() => {
  const overlay = document.getElementById("posterZoomOverlay");
  const viewport = document.getElementById("posterZoomViewport");
  const img = document.getElementById("posterZoomImage");
  const closeBtn = document.getElementById("posterZoomClose");
  if (!overlay || !viewport || !img || !closeBtn) return;

  let scale = 1;
  let minScale = 1;
  let maxScale = 5;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let startScale = 1;
  let startDistance = 0;
  let startMid = { x: 0, y: 0 };
  let lastTap = 0;
  let active = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function applyTransform() {
    img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }

  function resetTransform() {
    scale = 1;
    x = 0;
    y = 0;
    applyTransform();
  }

  function distance(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  function midpoint(t1, t2) {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }

  function openPoster(src, alt = "Plakat") {
    if (!src) return;
    img.src = src;
    img.alt = alt || "Plakat";
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    resetTransform();
  }

  function closePoster() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    img.removeAttribute("src");
    resetTransform();
  }

  closeBtn.addEventListener("click", closePoster);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePoster();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) closePoster();
  });

  viewport.addEventListener("touchstart", (e) => {
    if (!overlay.classList.contains("is-open")) return;
    active = true;

    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap < 280) {
        resetTransform();
        e.preventDefault();
        lastTap = 0;
        return;
      }
      lastTap = now;
      startX = e.touches[0].clientX - x;
      startY = e.touches[0].clientY - y;
    }

    if (e.touches.length === 2) {
      startDistance = distance(e.touches[0], e.touches[1]);
      startScale = scale;
      startMid = midpoint(e.touches[0], e.touches[1]);
    }
  }, { passive: false });

  viewport.addEventListener("touchmove", (e) => {
    if (!active || !overlay.classList.contains("is-open")) return;
    e.preventDefault();

    if (e.touches.length === 1 && scale > 1) {
      x = e.touches[0].clientX - startX;
      y = e.touches[0].clientY - startY;
      applyTransform();
    }

    if (e.touches.length === 2) {
      const newDistance = distance(e.touches[0], e.touches[1]);
      const mid = midpoint(e.touches[0], e.touches[1]);
      const nextScale = clamp(startScale * (newDistance / startDistance), minScale, maxScale);

      // Keep the pinch midpoint roughly stable
      const scaleRatio = nextScale / scale;
      x = mid.x - (mid.x - x) * scaleRatio + (mid.x - startMid.x);
      y = mid.y - (mid.y - y) * scaleRatio + (mid.y - startMid.y);

      scale = nextScale;
      applyTransform();
    }
  }, { passive: false });

  viewport.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      active = false;
      if (scale <= 1.02) resetTransform();
    }
  }, { passive: false });

  // Mouse wheel zoom for desktop testing
  viewport.addEventListener("wheel", (e) => {
    if (!overlay.classList.contains("is-open")) return;
    e.preventDefault();
    const oldScale = scale;
    const delta = e.deltaY < 0 ? 1.12 : 0.88;
    scale = clamp(scale * delta, minScale, maxScale);
    const ratio = scale / oldScale;
    x = e.clientX - (e.clientX - x) * ratio;
    y = e.clientY - (e.clientY - y) * ratio;
    applyTransform();
  }, { passive: false });

  // Broad hook: any element with poster-ish attributes/classes opens here.
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-poster], [data-poster-src], [data-show-poster], .poster-thumb, .poster-button, .poster-link, .view-poster, .show-poster");
    if (!target) return;

    const src =
      target.dataset.poster ||
      target.dataset.posterSrc ||
      target.dataset.showPoster ||
      target.getAttribute("href") ||
      (target.tagName === "IMG" ? target.src : null) ||
      target.querySelector("img")?.src;

    if (!src || src === "#") return;
    e.preventDefault();
    e.stopPropagation();
    openPoster(src, target.getAttribute("aria-label") || target.textContent?.trim() || "Plakat");
  }, true);

  window.openPosterZoom = openPoster;
})();
