
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const eventList = $('#eventList');
const pastEventList = $('#pastEventList');
const pastEventsBlock = $('#pastEventsBlock');
const logeList = $('#logeList');
const pastLogeList = $('#pastLogeList');
const pastLogeBlock = $('#pastLogeBlock');
const nextEvent = $('#nextEvent');
const nextLoge = $('#nextLoge');
const modal = $('#eventModal');
const modalContent = $('#modalContent');
const filterSelect = $('#filterSelect');
const initiativeList = $('#initiativeList');
const pastInitiativeList = $('#pastInitiativeList');
const pastInitiativeBlock = $('#pastInitiativeBlock');
const initiativeModal = $('#initiativeModal');
const initiativeForm = $('#initiativeForm');
const suggestInitiativeBtn = $('#suggestInitiativeBtn');

let events = [];
let logeaftener = [];
let initiativer = [];
let currentFilter = 'all';

function todayMidnight(){
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
}

function isUpcoming(item){
  return new Date(item.date + 'T00:00:00') >= todayMidnight();
}

function daDate(iso, weekday=true){
  return new Intl.DateTimeFormat('da-DK',{
    weekday: weekday ? 'long' : undefined,
    day:'numeric',
    month:'long',
    year:'numeric'
  }).format(new Date(iso + 'T12:00:00'));
}

function shortDate(iso){
  return new Intl.DateTimeFormat('da-DK',{day:'numeric', month:'short'}).format(new Date(iso + 'T12:00:00'));
}

function tag(type){
  return type === 'internal' ? 'Internt arrangement' : 'Offentligt arrangement';
}

function sortByDate(items){
  return [...items].sort((a,b) => a.date.localeCompare(b.date));
}

function upcomingEvents(){
  return sortByDate(events).filter(isUpcoming);
}

function pastEvents(){
  return sortByDate(events).filter(e => !isUpcoming(e)).reverse();
}

function shownEvents(){
  return upcomingEvents().filter(e => currentFilter === 'all' || e.type === currentFilter);
}

function upcomingLoge(){
  return sortByDate(logeaftener).filter(isUpcoming);
}

function pastLoge(){
  return sortByDate(logeaftener).filter(e => !isUpcoming(e)).reverse();
}

function byId(id){
  return events.find(e => e.id === id);
}

function logeById(id){
  return logeaftener.find(e => e.id === id);
}

function googleCalendarUrl(item){
  if(!item.start || !item.end) return '#';
  const start = item.date.replaceAll('-','') + 'T' + item.start.replace(':','') + '00';
  const end = item.date.replaceAll('-','') + 'T' + item.end.replace(':','') + '00';
  const text = encodeURIComponent(item.title + (item.subtitle ? ' – ' + item.subtitle : ''));
  const details = encodeURIComponent(`${item.text || item.description || ''}\n\n${item.timeText || ''}`);
  const location = encodeURIComponent(item.place || 'Odd Fellow Bygningen, Frederiksgade 15, Slagelse');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
}

function logeCalendarUrl(item){
  if(!item.time) return '#';
  const endTime = item.end || addMinutes(item.time, 120);
  const start = item.date.replaceAll('-','') + 'T' + item.time.replace(':','') + '00';
  const end = item.date.replaceAll('-','') + 'T' + endTime.replace(':','') + '00';
  const text = encodeURIComponent('Logeaften – ' + item.title);
  const details = encodeURIComponent(item.description || '');
  const location = encodeURIComponent('Logen, Frederiksgade 15, Slagelse');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
}

function addMinutes(time, minutes){
  const [h,m] = time.split(':').map(Number);
  const d = new Date(2000,0,1,h,m + minutes);
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

function appleCalendarData(item){
  return '';
}

function renderEventHero(){
  const e = upcomingEvents()[0] || sortByDate(events)[0];
  if(!e){
    nextEvent.innerHTML = `<div class="empty">Ingen aktiviteter oprettet endnu.</div>`;
    return;
  }

  nextEvent.innerHTML = `
    <button class="next-card no-poster-card" onclick="openEvent('${e.id}')" aria-label="Åbn ${e.title}">
      <div class="event-icon large">${e.icon || '•'}</div>
      <div class="next-info">
        <span class="tag">${tag(e.type)}</span>
        <h3>${e.title}</h3>
        <div class="match">${e.subtitle || ''}</div>
        <div class="meta">
          <div><span>📅</span><span>${daDate(e.date)}</span></div>
          <div><span>🕘</span><span>${e.timeText || ''}</span></div>
          <div><span>📍</span><span>${e.place || ''}</span></div>
        </div>
        <p class="desc">${e.text || ''}</p>
        <div class="card-arrow">Tryk for detaljer ›</div>
      </div>
    </button>`;
}

function renderEventList(){
  const items = shownEvents();
  eventList.innerHTML = items.length ? items.map(e => `
    <button class="event-card" onclick="openEvent('${e.id}')">
      <div class="event-icon">${e.icon || '•'}</div>
      <div>
        <h3>${e.title}</h3>
        <p><strong>${e.subtitle || ''}</strong><br>${daDate(e.date,false)} · ${e.timeText || ''}</p>
      </div>
      <div class="chev">›</div>
    </button>
  `).join('') : `<div class="empty">Ingen kommende aktiviteter i denne kategori.</div>`;

  const old = pastEvents();
  pastEventsBlock.hidden = old.length === 0;
  pastEventList.innerHTML = old.map(e => `
    <button class="event-card muted-card" onclick="openEvent('${e.id}')">
      <div class="event-icon">${e.icon || '•'}</div>
      <div>
        <h3>${e.title}</h3>
        <p><strong>${e.subtitle || ''}</strong><br>${daDate(e.date,false)}</p>
      </div>
      <div class="chev">›</div>
    </button>
  `).join('');
}

function renderLogeHero(){
  const e = upcomingLoge()[0];
  if(!e){
    nextLoge.innerHTML = `<div class="empty">Ingen kommende logeaftener oprettet.</div>`;
    return;
  }

  nextLoge.innerHTML = `
    <button class="next-card no-poster-card" onclick="openLoge('${e.id}')" aria-label="Åbn ${e.title}">
      <div class="event-icon large">◆</div>
      <div class="next-info">
        <span class="tag">Logeaften</span>
        <h3>${e.title}</h3>
        <div class="match">${e.time ? 'Mødet kl. ' + e.time : 'Intet møde'}</div>
        <div class="meta">
          <div><span>📅</span><span>${daDate(e.date)}</span></div>
          <div><span>🕘</span><span>${e.time ? 'Kl. ' + e.time : '—'}</span></div>
          <div><span>📍</span><span>Logen</span></div>
        </div>
        ${e.description ? `<p class="desc">${e.description}</p>` : ''}
        <div class="card-arrow">Tryk for detaljer ›</div>
      </div>
    </button>`;
}

function renderLogeList(){
  const items = upcomingLoge();
  logeList.innerHTML = items.length ? items.map(e => `
    <button class="event-card" onclick="openLoge('${e.id}')">
      <div class="date-box small">${shortDate(e.date)}</div>
      <div>
        <h3>${e.title}</h3>
        <p>${e.time ? 'Mødet kl. ' + e.time : 'Intet møde'}${e.description ? '<br>' + e.description : ''}</p>
      </div>
      <div class="chev">›</div>
    </button>
  `).join('') : `<div class="empty">Ingen kommende logeaftener.</div>`;

  const old = pastLoge();
  pastLogeBlock.hidden = old.length === 0;
  pastLogeList.innerHTML = old.map(e => `
    <button class="event-card muted-card" onclick="openLoge('${e.id}')">
      <div class="date-box small">${shortDate(e.date)}</div>
      <div>
        <h3>${e.title}</h3>
        <p>${e.time ? 'Kl. ' + e.time : 'Intet møde'}</p>
      </div>
      <div class="chev">›</div>
    </button>
  `).join('');
}

window.openEvent = function(id){
  const e = byId(id);
  if(!e) return;

  modalContent.innerHTML = `
    ${e.poster ? `
      <div class="detail-poster-wrap">
        <img class="detail-poster" src="${e.poster}" alt="${e.title} plakat">
      </div>` : ''}
    <h2 class="modal-title">${e.icon || ''} ${e.title}</h2>
    <p class="modal-sub">${e.subtitle || ''}</p>
    <div class="info-grid">
      <div class="info-row"><span>📅</span><div>${daDate(e.date)}</div></div>
      <div class="info-row"><span>🕘</span><div>${e.timeText || ''}</div></div>
      <div class="info-row"><span>📍</span><div>${e.place || ''}</div></div>
      <div class="info-row"><span>🔒</span><div>${tag(e.type)}</div></div>
    </div>
    <p class="description">${e.text || ''}</p>
    ${e.start && e.end ? `<div class="modal-actions"><a class="btn primary" href="${googleCalendarUrl(e)}" target="_blank" rel="noopener">Tilføj kalender</a></div>` : ''}
  `;
  modal.showModal();
}

window.openLoge = function(id){
  const e = logeById(id);
  if(!e) return;

  modalContent.innerHTML = `
    <div class="loge-detail-icon">◆</div>
    <h2 class="modal-title">${e.title}</h2>
    <p class="modal-sub">Logeaften</p>
    <div class="info-grid">
      <div class="info-row"><span>📅</span><div>${daDate(e.date)}</div></div>
      <div class="info-row"><span>🕘</span><div>${e.time ? 'Mødet kl. ' + e.time : 'Intet møde'}</div></div>
      <div class="info-row"><span>📍</span><div>Logen</div></div>
    </div>
    ${e.description ? `<p class="description">${e.description}</p>` : ''}
    ${e.time ? `<div class="modal-actions"><a class="btn primary" href="${logeCalendarUrl(e)}" target="_blank" rel="noopener">Tilføj kalender</a></div>` : ''}
  `;
  modal.showModal();
}


function upcomingInitiatives(){ return sortByDate(initiativer).filter(isUpcoming); }
function pastInitiatives(){ return sortByDate(initiativer).filter(e => !isUpcoming(e)).reverse(); }
function initiativeById(id){ return initiativer.find(e => e.id === id); }

function renderInitiatives(){
  if(!initiativeList) return;
  const items = upcomingInitiatives();
  initiativeList.innerHTML = items.length ? items.map(e => `
    <button class="event-card" onclick="openInitiative('${e.id}')">
      <div class="event-icon">${e.icon || '🤝'}</div>
      <div><h3>${e.title}</h3><p><strong>${e.host || ''}</strong><br>${daDate(e.date,false)}${e.time ? ' · kl. ' + e.time : ''}</p></div>
      <div class="chev">›</div>
    </button>`).join('') : `<div class="empty">Ingen kommende initiativer lige nu.</div>`;
  const old = pastInitiatives();
  pastInitiativeBlock.hidden = old.length === 0;
  pastInitiativeList.innerHTML = old.map(e => `
    <button class="event-card muted-card" onclick="openInitiative('${e.id}')">
      <div class="event-icon">${e.icon || '🤝'}</div>
      <div><h3>${e.title}</h3><p><strong>${e.host || ''}</strong><br>${daDate(e.date,false)}</p></div>
      <div class="chev">›</div>
    </button>`).join('');
}

window.openInitiative = function(id){
  const e = initiativeById(id); if(!e) return;
  modalContent.innerHTML = `
    <div class="loge-detail-icon">${e.icon || '🤝'}</div>
    <h2 class="modal-title">${e.title}</h2>
    <p class="modal-sub">Initiativ fra ${e.host || 'en broder'}</p>
    <div class="info-grid">
      <div class="info-row"><span>📅</span><div>${daDate(e.date)}</div></div>
      <div class="info-row"><span>🕘</span><div>${e.time ? 'Kl. ' + e.time : 'Tidspunkt ikke angivet'}</div></div>
      <div class="info-row"><span>📍</span><div>${e.place || 'Sted ikke angivet'}</div></div>
    </div>
    <p class="description">${e.text || ''}</p>`;
  modal.showModal();
}

function buildInitiativeMailto(data){
  const to = 'kiodoa@gmail.com';
  const subject = encodeURIComponent('Forslag til aktivitet i Concordia: ' + data.title);
  const body = encodeURIComponent(`Hej Lars

Jeg vil gerne foreslå denne aktivitet til appen:

Titel:
${data.title}

Dato:
${data.date}

Tidspunkt:
${data.time || 'Ikke angivet'}

Sted:
${data.place || 'Ikke angivet'}

Navn:
${data.host}

Beskrivelse:
${data.text}

Sendt fra Det sker i Concordia.`);
  return `mailto:${to}?subject=${subject}&body=${body}`;
}


function renderAll(){
  renderEventHero();
  renderEventList();
  renderLogeHero();
  renderLogeList();
  renderInitiatives();
}

async function loadJson(path){
  const res = await fetch(path + '?v=17', {cache:'no-store'});
  if(!res.ok) throw new Error(path);
  return await res.json();
}

async function init(){
  try{
    events = await loadJson('events.json');
    if(!Array.isArray(events)) events = [];
  }catch(err){
    console.error('Kunne ikke indlæse events.json:', err);
    events = [];
    if(nextEvent) nextEvent.innerHTML = `<div class="empty">Kunne ikke indlæse events.json.</div>`;
  }

  try{
    logeaftener = await loadJson('logeaftener.json');
    if(!Array.isArray(logeaftener)) logeaftener = [];
  }catch(err){
    console.error('Kunne ikke indlæse logeaftener.json:', err);
    logeaftener = [];
    if(nextLoge) nextLoge.innerHTML = `<div class="empty">Kunne ikke indlæse logeaftener.json.</div>`;
  }

  try{
    initiativer = await loadJson('initiativer.json');
    if(!Array.isArray(initiativer)) initiativer = [];
  }catch(err){
    console.warn('Kunne ikke indlæse initiativer.json:', err);
    initiativer = [];
  }

  renderAll();
}

if(filterSelect) filterSelect.addEventListener('change', e => {
  currentFilter = e.target.value;
  renderEventList();
});

$('[data-close]').addEventListener('click', () => modal.close());

$$('.nav-btn').forEach(btn => btn.addEventListener('click', () => {
  const v = btn.dataset.view;
  $$('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  $$('.view').forEach(view => view.classList.remove('active-view'));
  const targetView = $('#view' + v[0].toUpperCase() + v.slice(1));
  if(targetView) targetView.classList.add('active-view');
  window.scrollTo({top:0, behavior:'smooth'});
}));


if(suggestInitiativeBtn){
  suggestInitiativeBtn.addEventListener('click', () => initiativeModal.showModal());
}
const closeInitiativeBtn = $('[data-close-initiative]');
if(closeInitiativeBtn){
  closeInitiativeBtn.addEventListener('click', () => initiativeModal.close());
}
if(initiativeForm){
  initiativeForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      title: $('#initiativeTitle').value.trim(),
      date: $('#initiativeDate').value,
      time: $('#initiativeTime').value,
      place: $('#initiativePlace').value.trim(),
      host: $('#initiativeHost').value.trim(),
      text: $('#initiativeText').value.trim()
    };
    window.location.href = buildInitiativeMailto(data);
    initiativeModal.close();
    initiativeForm.reset();
  });
}


let deferredPrompt;
const installBtn = $('#installBtn');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

if('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

init();
