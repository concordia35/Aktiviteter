
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
const initiativeSubmitModal = $('#initiativeSubmitModal');
const initiativeSubmitForm = $('#initiativeSubmitForm');
const initiativeSubmitStatus = $('#initiativeSubmitStatus');
const submitInitiativeButton = $('#submitInitiativeButton');
const joinModal = $('#joinModal');
const joinForm = $('#joinForm');
const joinStatus = $('#joinStatus');
const joinSubmitButton = $('#joinSubmitButton');
const joinActivityTitle = $('#joinActivityTitle');
const joinActivityId = $('#joinActivityId');
const joinActivityName = $('#joinActivityName');

let events = [];
let logeaftener = [];
let initiativer = [];
let participants = [];
let currentFilter = 'all';

const INITIATIVE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRkJKdrVC23QTs_9qcuTQ51jFl1z5-nOUgVIFhKwzlB99CXgLHK3uJjyOz4f-_nJeMxpF6FynIlyvLx/pub?output=csv';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyDR5b7Tcd1ka28oQV3Wc-Ja1saDRvUi10KEp0KMGmaeVuWhMCXmRW1Hd7CXrpc9Fw/exec';
const PARTICIPANTS_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2gW_OJRwMUK0qo7thrEiiqLj3rcWCKlZcl-4mjo6tkMmuRyNdyD_nGOwzGlFMPccQ-HytwFJfNI80/pub?output=csv';
const PARTICIPATION_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfvSDx6diX77ZzmuZTMGRPvKFZ4B_wb-EKYFfOXYQtDNiMiUQ/viewform';
const PARTICIPATION_ACTIVITY_ENTRY = 'entry.1746932510';
const PARTICIPATION_NAME_ENTRY = 'entry.383752271';
const INITIATIVE_FORM_URL = 'https://docs.google.com/forms/d/1QazCOa3-Xd2UfnDAIxLU8IbGOnHqSvNo-1k0-oUaDsI/viewform';

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


function normalizeKey(value){
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ');
}

function participantActivityValue(row){
  return row.activityId || row['Aktivitet ID'] || row.activity || row.aktivitet || row['Hvilken aktivitet?'] || row['Aktivitet'] || row['Titel på aktiviteten'] || row['Titel'] || '';
}

function participantNameValue(row){
  return row.name || row.navn || row['Dit navn'] || row['Navn'] || row['Navn på kontaktperson'] || '';
}



async function postToAppsScript(action, payload){
  if(!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('INDSAET_DIN_APPS_SCRIPT')){
    throw new Error('Apps Script URL mangler i app.js');
  }

  const body = new URLSearchParams();
  body.set('action', action);
  Object.entries(payload).forEach(([key, value]) => body.set(key, value ?? ''));

  // Google Apps Script giver ofte CORS-problemer, hvis man forsøger at læse svaret.
  // no-cors sender data korrekt, men svaret bliver "opaque", så vi viser succes efter afsendelse.
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body
  });

  return { ok: true };
}

function openJoinDialog(initiative){
  if(!joinModal) return;
  joinActivityId.value = initiative.id || '';
  joinActivityName.value = initiative.title || '';
  joinActivityTitle.textContent = `Du tilmelder dig: ${initiative.title}`;
  joinStatus.textContent = '';
  joinForm.reset();
  joinActivityId.value = initiative.id || '';
  joinActivityName.value = initiative.title || '';
  joinModal.showModal();
}

function participationUrl(initiative){
  const url = new URL(PARTICIPATION_FORM_URL);
  url.searchParams.set(PARTICIPATION_ACTIVITY_ENTRY, initiative.title);
  return url.toString();
}

async function refreshParticipants(){
  try{
    participants = await loadParticipantsFromSheet();
    if(!Array.isArray(participants)) participants = [];
    renderInitiatives();
    return true;
  }catch(err){
    console.warn('Kunne ikke opdatere deltagerlisten:', err);
    return false;
  }
}

function participantsFor(initiative){
  const possible = [
    initiative.id,
    initiative.title,
    initiative.title + ' - ' + (initiative.date || ''),
    initiative.title + ' – ' + (initiative.date || '')
  ].map(normalizeKey);

  const names = participants
    .filter(p => possible.includes(normalizeKey(p.activity)))
    .map(p => p.name)
    .filter(Boolean);

  return [...new Set(names)];
}

function renderInitiatives(){
  if(!initiativeList) return;
  const items = upcomingInitiatives();
  initiativeList.innerHTML = items.length ? items.map(e => {
    const names = participantsFor(e);
    return `
    <button class="event-card" onclick="openInitiative('${e.id}')">
      <div class="event-icon">${e.icon || '🤝'}</div>
      <div><h3>${e.title}</h3><p><strong>${e.host || ''}</strong><br>${daDate(e.date,false)}${e.time ? ' · kl. ' + e.time : ''}<br><span class="participant-count">👥 ${names.length} deltager${names.length === 1 ? '' : 'e'}</span></p></div>
      <div class="chev">›</div>
    </button>`}).join('') : `<div class="empty">Ingen godkendte initiativer lige nu.</div>`;

  const old = pastInitiatives();
  if(pastInitiativeBlock && pastInitiativeList){
    pastInitiativeBlock.hidden = old.length === 0;
    pastInitiativeList.innerHTML = old.map(e => {
      const names = participantsFor(e);
      return `
      <button class="event-card muted-card" onclick="openInitiative('${e.id}')">
        <div class="event-icon">${e.icon || '🤝'}</div>
        <div><h3>${e.title}</h3><p><strong>${e.host || ''}</strong><br>${daDate(e.date,false)}<br><span class="participant-count">👥 ${names.length} deltager${names.length === 1 ? '' : 'e'}</span></p></div>
        <div class="chev">›</div>
      </button>`}).join('');
  }
}

window.openInitiative = function(id){
  const e = initiativeById(id); if(!e) return;
  const names = participantsFor(e);
  const participantList = names.length
    ? `<div class="participants-box"><h3>Deltagere (${names.length})</h3><ul>${names.map(n => `<li>✓ ${n}</li>`).join('')}</ul></div>`
    : `<div class="participants-box"><h3>Deltagere</h3><p>Ingen har skrevet sig på endnu.</p></div>`;

  modalContent.innerHTML = `
    <div class="loge-detail-icon">${e.icon || '🤝'}</div>
    <h2 class="modal-title">${e.title}</h2>
    <p class="modal-sub">Initiativ fra ${e.host || 'en broder'}</p>
    <div class="info-grid">
      <div class="info-row"><span>📅</span><div>${daDate(e.date)}</div></div>
      <div class="info-row"><span>🕘</span><div>${e.time ? 'Kl. ' + e.time : 'Tidspunkt ikke angivet'}</div></div>
      <div class="info-row"><span>📍</span><div>${e.place || 'Sted ikke angivet'}</div></div>
    </div>
    <p class="description">${e.text || ''}</p>
    ${participantList}
    <div class="modal-actions">
      <button class="btn primary" type="button" onclick="openJoinForInitiative(\'${e.id}\')">Jeg deltager</button><button class="btn soft refresh-btn" type="button" onclick="refreshInitiativeParticipants(\'${e.id}\')">Opdater deltagerliste</button>
    </div>
    <p class="sheet-status-note">Skriv dit navn direkte i appen. Deltagerlisten opdateres efter tilmelding.</p>`;
  modal.showModal();
}

function parseCsv(text){
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for(let i = 0; i < text.length; i++){
    const c = text[i];
    const next = text[i + 1];

    if(c === '"' && inQuotes && next === '"'){
      value += '"';
      i++;
    } else if(c === '"'){
      inQuotes = !inQuotes;
    } else if(c === ',' && !inQuotes){
      row.push(value);
      value = '';
    } else if((c === '\n' || c === '\r') && !inQuotes){
      if(c === '\r' && next === '\n') i++;
      row.push(value);
      if(row.some(cell => cell.trim() !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += c;
    }
  }

  row.push(value);
  if(row.some(cell => cell.trim() !== '')) rows.push(row);
  return rows;
}

function normalizeDate(value){
  const raw = String(value || '').trim();
  if(!raw) return '';

  // Google Sheets CSV normally returns Danish dates as dd/mm/yyyy.
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(slash){
    const [, d, m, y] = slash;
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if(dash){
    const [, d, m, y] = dash;
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  // Already ISO
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  return '';
}

function normalizeTime(value){
  const raw = String(value || '').trim();
  if(!raw) return '';

  // Examples: 22.11.00, 22:11:00, 22:11
  const match = raw.match(/^(\d{1,2})[.:](\d{2})(?:[.:]\d{2})?$/);
  if(match){
    return `${String(match[1]).padStart(2,'0')}:${match[2]}`;
  }

  return raw;
}

function rowToObject(headers, row){
  const obj = {};
  headers.forEach((h, i) => obj[h.trim()] = (row[i] || '').trim());
  return obj;
}

function isApproved(status){
  const s = String(status || '').trim().toLowerCase();
  return s === 'godkendt' || s === 'ja' || s === 'approved';
}

async function loadInitiativesFromSheet(){
  const res = await fetch(INITIATIVE_SHEET_CSV_URL + '&v=' + Date.now(), {cache:'no-store'});
  if(!res.ok) throw new Error('Google Sheets CSV kunne ikke indlæses');

  const csv = await res.text();
  const rows = parseCsv(csv);
  if(rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .map((row, index) => {
      const r = rowToObject(headers, row);
      const status = r['Godkendt'] || r['Status'] || '';
      const date = normalizeDate(r['Dato for aktiviteten']);
      return {
        id: 'sheet-' + index,
        icon: '🤝',
        status,
        title: r['Titel på aktiviteten'] || 'Uden titel',
        date,
        time: normalizeTime(r['Tidspunkt']),
        place: r['Sted'] || '',
        host: r['Navn på kontaktperson'] || '',
        text: r['Beskrivelse af aktiviteten'] || ''
      };
    })
    .filter(e => isApproved(e.status))
    .filter(e => e.title && e.date);
}

async function loadParticipantsFromSheet(){
  const res = await fetch(PARTICIPANTS_SHEET_CSV_URL + '&v=' + Date.now(), {cache:'no-store'});
  if(!res.ok) throw new Error('Deltagerliste kunne ikke indlæses');

  const csv = await res.text();
  const rows = parseCsv(csv);
  if(rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .map(row => {
      const r = rowToObject(headers, row);
      return {
        activity: participantActivityValue(r),
        name: participantNameValue(r)
      };
    })
    .filter(p => p.activity && p.name);
}



window.openJoinForInitiative = function(id){
  const e = initiativeById(id);
  if(!e) return;
  openJoinDialog(e);
}

window.refreshInitiativeParticipants = async function(id){
  const ok = await refreshParticipants();
  if(id) openInitiative(id);
  const note = document.querySelector('.sheet-status-note');
  if(note){
    note.textContent = ok
      ? 'Deltagerlisten er opdateret.'
      : 'Deltagerlisten kunne ikke opdateres lige nu.';
  }
}

function renderAll(){
  renderEventHero();
  renderEventList();
  renderLogeHero();
  renderLogeList();
  renderInitiatives();
}

async function loadJson(path){
  const res = await fetch(path + '?v=30b', {cache:'no-store'});
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
    initiativer = await loadInitiativesFromSheet();
    if(!Array.isArray(initiativer)) initiativer = [];
  }catch(err){
    console.warn('Kunne ikke indlæse initiativer fra Google Sheets:', err);
    initiativer = [];
  }

  try{
    participants = await loadParticipantsFromSheet();
    if(!Array.isArray(participants)) participants = [];
  }catch(err){
    console.warn('Kunne ikke indlæse deltagere fra Google Sheets:', err);
    participants = [];
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
  suggestInitiativeBtn.addEventListener('click', () => {
    if(initiativeSubmitStatus) initiativeSubmitStatus.textContent = '';
    if(initiativeSubmitForm) initiativeSubmitForm.reset();
    initiativeSubmitModal.showModal();
  });
}



const closeSubmitInitiativeBtn = $('[data-close-submit-initiative]');
if(closeSubmitInitiativeBtn){
  closeSubmitInitiativeBtn.addEventListener('click', () => initiativeSubmitModal.close());
}
const closeJoinBtn = $('[data-close-join]');
if(closeJoinBtn){
  closeJoinBtn.addEventListener('click', () => joinModal.close());
}

if(initiativeSubmitForm){
  initiativeSubmitForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      title: $('#newInitiativeTitle').value.trim(),
      date: $('#newInitiativeDate').value,
      time: $('#newInitiativeTime').value,
      place: $('#newInitiativePlace').value.trim(),
      host: $('#newInitiativeHost').value.trim(),
      text: $('#newInitiativeText').value.trim()
    };
    submitInitiativeButton.disabled = true;
    initiativeSubmitStatus.textContent = 'Sender forslag...';
    try{
      await postToAppsScript('submitInitiative', payload);
      initiativeSubmitStatus.textContent = '✓ Forslaget er sendt til godkendelse.';
      initiativeSubmitForm.reset();
      setTimeout(() => initiativeSubmitModal.close(), 1200);
    }catch(err){
      initiativeSubmitStatus.textContent = 'Kunne ikke sende. Tjek Apps Script URL.';
      console.error(err);
    }finally{
      submitInitiativeButton.disabled = false;
    }
  });
}

if(joinForm){
  joinForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      activityId: joinActivityId.value,
      activity: joinActivityName.value,
      name: $('#joinName').value.trim()
    };
    joinSubmitButton.disabled = true;
    joinStatus.textContent = 'Sender tilmelding...';
    try{
      await postToAppsScript('joinActivity', payload);
      joinStatus.textContent = '✓ Du er tilmeldt.';
      await refreshParticipants();
      renderInitiatives();
      setTimeout(() => {
        joinModal.close();
        openInitiative(payload.activityId);
      }, 800);
    }catch(err){
      joinStatus.textContent = 'Kunne ikke tilmelde. Tjek Apps Script URL.';
      console.error(err);
    }finally{
      joinSubmitButton.disabled = false;
    }
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
