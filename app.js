const APP_VERSION = '1.0.1';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const loadingScreen = $('#loadingScreen');

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
let initiativesLoading = true;
let currentFilter = 'all';

const GOOGLE_SHEET_ID = '1QCnVFk5PzcF_3N6ONFNwzmjCUU-KzBeXFpfyueWa2Jc';
const INITIATIVE_SHEET_NAME = 'Initiativer';
const PARTICIPANTS_SHEET_NAME = 'Deltagere';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzivUCgohSlZRNIFGGsa9goS12lTksr7DMmShgC_bAlJODfmOlogCjj2X6eSeBsP8lY/exec';
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

function firstValue(row, keys){
  for(const key of keys){
    if(row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
  }
  return '';
}

async function fetchAppsScriptAction(action, force=false){
  const cacheKey = action || 'default';
  if(!window.__appsScriptCache) window.__appsScriptCache = {};
  if(window.__appsScriptCache[cacheKey] && !force) return window.__appsScriptCache[cacheKey];

  if(!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('INDSAET_DIN_APPS_SCRIPT')){
    throw new Error('Apps Script URL mangler i app.js');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try{
    const url = new URL(APPS_SCRIPT_URL);
    if(action) url.searchParams.set('action', action);
    url.searchParams.set('t', Date.now());

    const res = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });

    if(!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if(data && data.ok === false){
      throw new Error(data.error || 'Apps Script returnerede fejl');
    }

    window.__appsScriptCache[cacheKey] = data;
    return data;
  }finally{
    clearTimeout(timeout);
  }
}

function extractRows(data, names){
  if(Array.isArray(data)) return data;
  for(const name of names){
    if(Array.isArray(data && data[name])) return data[name];
  }
  if(Array.isArray(data && data.data)) return data.data;
  if(Array.isArray(data && data.rows)) return data.rows;
  if(data && typeof data === 'object'){
    for(const value of Object.values(data)){
      if(Array.isArray(value)) return value;
    }
  }
  return [];
}

async function fetchAppsScriptData(force=false){
  // Beholdes kun som kompatibilitet til resten af filen.
  // Initiativer skal læses via den nye doGet-action: getInitiatives.
  return await fetchAppsScriptAction('getInitiatives', force);
}

function rowsFromData(data, names){
  for(const name of names){
    if(Array.isArray(data && data[name])) return data[name];
  }
  return [];
}

function arrayRowsToObjects(rows){
  if(!Array.isArray(rows) || rows.length < 2 || !Array.isArray(rows[0])) return rows || [];
  const headers = rows[0].map(h => String(h || '').trim());
  return rows.slice(1).map(row => rowToObject(headers, row));
}

function participantActivityValue(row){
  return firstValue(row, [
    'activityId', 'Aktivitet ID', 'Aktivitets ID', 'id',
    'activity', 'aktivitet', 'Hvilken aktivitet?', 'Aktivitet',
    'Titel på aktiviteten', 'Titel', 'Initiativ', 'Initiativ titel'
  ]);
}

function participantNameValue(row){
  return firstValue(row, ['name', 'navn', 'Dit navn', 'Navn', 'Navn på kontaktperson', 'Kontaktperson']);
}



async function postToAppsScript(action, payload){
  if(!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('INDSAET_DIN_APPS_SCRIPT')){
    throw new Error('Apps Script URL mangler i app.js');
  }

  // Apps Script-koden i det nye Sheet bruger doGet, så skrivning skal sendes som query params.
  // Det undgår samtidig CORS/problemer med POST fra GitHub Pages.
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  Object.entries(payload || {}).forEach(([key, value]) => {
    url.searchParams.set(key, value == null ? '' : String(value));
  });
  url.searchParams.set('_', Date.now());

  const res = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store'
  });

  if(!res.ok) throw new Error('Apps Script HTTP ' + res.status);

  const data = await res.json();
  if(!(data.ok || data.success)){
    throw new Error(data.error || 'Apps Script returnerede fejl');
  }

  appDataCache = null;
  window.__appsScriptCache = {};
  return data;
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


let appDataCache = null;

async function getAppData(force=false){
  return await fetchAppsScriptData(force);
}

async function loadInitiativesFromSheet(force=false){
  const data = await fetchAppsScriptAction('getInitiatives', force);
  const rows = arrayRowsToObjects(extractRows(data, ['initiatives', 'initiativer', 'Initiativer', 'items']));
  return normalizeInitiatives(rows);
}

async function loadParticipantsFromSheet(force=false){
  // Nogle Apps Scripts har ikke en særskilt getParticipants endnu.
  // Derfor prøver vi først den rigtige action og derefter den gamle samlede list-action.
  try{
    const data = await fetchAppsScriptAction('getParticipants', force);
    const rows = arrayRowsToObjects(extractRows(data, ['participants', 'deltagere', 'Deltagere', 'rows']));
    return normalizeParticipants(rows);
  }catch(err){
    try{
      const data = await fetchAppsScriptAction('list', force);
      const rows = arrayRowsToObjects(extractRows(data, ['participants', 'deltagere', 'Deltagere', 'rows']));
      return normalizeParticipants(rows);
    }catch(_err){
      return [];
    }
  }
}

async function refreshParticipants(){
  try{
    participants = await loadParticipantsFromSheet(true);
    renderInitiatives();
    return true;
  }catch(err){
    console.warn('Kunne ikke opdatere deltagerlisten fra Google Sheets:', err);
    return false;
  }
}

function participantsFor(initiative){
  const possible = [
    initiative.id,
    initiative.title,
    initiative.title + ' - ' + (initiative.date || ''),
    initiative.title + ' – ' + (initiative.date || '')
  ].map(normalizeKey).filter(Boolean);

  const names = participants
    .filter(p => possible.includes(normalizeKey(p.activityId)) || possible.includes(normalizeKey(p.activity)))
    .map(p => p.name)
    .filter(Boolean);

  return [...new Set(names)];
}

function renderInitiatives(){
  if(!initiativeList) return;
  if(initiativesLoading){
    initiativeList.innerHTML = `<div class="empty initiative-loading"><span class="mini-spinner" aria-hidden="true"></span> Henter initiativer...</div>`;
    if(pastInitiativeBlock) pastInitiativeBlock.hidden = true;
    return;
  }
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


function initiativeCalendarUrl(item){
  if(!item || !item.date) return '#';
  const startTime = item.time || '19:00';
  const endTime = addMinutes(startTime, 90);
  const start = item.date.replaceAll('-','') + 'T' + startTime.replace(':','') + '00';
  const end = item.date.replaceAll('-','') + 'T' + endTime.replace(':','') + '00';
  const text = encodeURIComponent(item.title || 'Broderinitiativ');
  const details = encodeURIComponent(`${item.text || ''}\n\nKontaktperson: ${item.host || ''}`.trim());
  const location = encodeURIComponent(item.place || '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
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
      <button class="btn primary" type="button" onclick="openJoinForInitiative(\'${e.id}\')">Jeg deltager</button>
      <a class="btn soft" href="${initiativeCalendarUrl(e)}" target="_blank" rel="noopener">Tilføj kalender</a>
    </div>
    <p class="sheet-status-note">Skriv dit navn direkte i appen. Deltagerlisten opdateres automatisk efter tilmelding.</p>`;
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

  // Google Sheets kan sende både rene datoer og dato + klokkeslæt.
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+.*)?$/);
  if(slash){
    const [, d, m, y] = slash;
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+.*)?$/);
  if(dash){
    const [, d, m, y] = dash;
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[ T].*)?$/);
  if(iso) return iso[1];

  return '';
}

function normalizeTime(value){
  const raw = String(value || '').trim();
  if(!raw) return '';

  // Eksempler: 22.11.00, 22:11:00, 22:11, 13.2
  const match = raw.match(/^(\d{1,2})[.:](\d{1,2})(?:[.:]\d{1,2})?$/);
  if(match){
    return `${String(match[1]).padStart(2,'0')}:${String(match[2]).padStart(2,'0')}`;
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


function makeInitiativeId(row, index){
  const existing = firstValue(row, ['id', 'ID', 'Initiativ ID', 'Aktivitet ID', 'activityId']);
  if(existing) return String(existing).trim();

  const title = firstValue(row, ['title', 'Titel på aktiviteten', 'Titel', 'Initiativ', 'Aktivitet']);
  const date = normalizeDate(firstValue(row, ['date', 'Dato for aktiviteten', 'Dato', 'Hvornår?']));
  const base = normalizeKey(`${title}-${date}`).replace(/[^a-z0-9æøå -]/g, '').replace(/\s+/g, '-');
  return base || `sheet-${index}`;
}

function normalizeInitiativeRecord(row, index=0){
  const status = firstValue(row, ['status', 'Status', 'Godkendt', 'godkendt', 'Approved']);
  const date = normalizeDate(firstValue(row, ['date', 'Dato for aktiviteten', 'Dato', 'Hvornår?', 'Dato/tid']));
  const title = firstValue(row, ['title', 'Titel på aktiviteten', 'Titel', 'Initiativ', 'Aktivitet']);

  return {
    id: makeInitiativeId(row, index),
    icon: firstValue(row, ['icon', 'Ikon']) || '🤝',
    status,
    title: title || 'Uden titel',
    date,
    time: normalizeTime(firstValue(row, ['time', 'Tidspunkt', 'Tid', 'Klokkeslæt'])),
    place: firstValue(row, ['place', 'Sted', 'Lokation']),
    host: firstValue(row, ['host', 'Navn på kontaktperson', 'Kontaktperson', 'Navn', 'Oprettet af']),
    text: firstValue(row, ['text', 'Beskrivelse af aktiviteten', 'Beskrivelse', 'Tekst'])
  };
}

function normalizeInitiatives(items){
  return (Array.isArray(items) ? items : [])
    .map((row, index) => normalizeInitiativeRecord(row, index))
    .filter(e => isApproved(e.status))
    .filter(e => e.title && e.date);
}

function normalizeParticipantRecord(row){
  return {
    activityId: firstValue(row, ['activityId', 'Aktivitet ID', 'Aktivitets ID', 'id']),
    activity: participantActivityValue(row),
    name: participantNameValue(row)
  };
}

function normalizeParticipants(items){
  return (Array.isArray(items) ? items : [])
    .map(normalizeParticipantRecord)
    .filter(p => (p.activityId || p.activity) && p.name);
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


/* === GOOGLE SHEETS INITIATIVER FIX - 2026-06-03 ===
   Kun Google Sheets/Apps Script. Ingen lokal fallback for initiativer.
   Frontend accepterer både:
   1) { ok:true, initiatives:[...], participants:[...] }
   2) { ok:true, data:[...] }
   3) [...]
   og både danske/originale kolonnenavne samt normaliserede felter.
*/
function pickArray(data, keys){
  if(Array.isArray(data)) return data;
  if(!data || typeof data !== 'object') return [];
  for(const key of keys){
    if(Array.isArray(data[key])) return data[key];
  }
  for(const value of Object.values(data)){
    if(Array.isArray(value)) return value;
  }
  return [];
}

async function fetchAppsScriptAction(action='list', force=false){
  const cacheKey = action || 'list';
  if(!window.__appsScriptCache) window.__appsScriptCache = {};
  if(window.__appsScriptCache[cacheKey] && !force) return window.__appsScriptCache[cacheKey];

  if(!APPS_SCRIPT_URL){
    throw new Error('Apps Script URL mangler i app.js');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try{
    const url = new URL(APPS_SCRIPT_URL);
    if(action) url.searchParams.set('action', action);
    url.searchParams.set('_', Date.now());

    const res = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });

    if(!res.ok) throw new Error('Apps Script HTTP ' + res.status);
    const data = await res.json();
    if(data && data.ok === false) throw new Error(data.error || 'Apps Script returnerede ok:false');
    window.__appsScriptCache[cacheKey] = data;
    return data;
  }finally{
    clearTimeout(timeout);
  }
}

function normalizeDate(value){
  const raw = String(value || '').trim();
  if(!raw) return '';

  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/);
  if(m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;

  m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+.*)?$/);
  if(m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;

  m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+.*)?$/);
  if(m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;

  return '';
}

function normalizeTime(value){
  const raw = String(value || '').trim();
  if(!raw) return '';

  let m = raw.match(/(?:^|\s)(\d{1,2})[.:](\d{1,2})(?:[.:](\d{1,2}))?(?:\s|$)/);
  if(m) return `${String(m[1]).padStart(2,'0')}:${String(m[2]).padStart(2,'0')}`;

  m = raw.match(/T(\d{1,2}):(\d{1,2})/);
  if(m) return `${String(m[1]).padStart(2,'0')}:${String(m[2]).padStart(2,'0')}`;

  return raw;
}

function isApproved(status){
  const s = String(status || '').trim().toLowerCase();
  return ['godkendt','ja','approved','true','1','ok'].includes(s);
}

function makeInitiativeId(row, index){
  const existing = firstValue(row, ['id','ID','Initiativ ID','Aktivitet ID','activityId']);
  if(existing) return String(existing).trim();
  const title = firstValue(row, ['title','Titel','Titel på aktiviteten','Initiativ','Aktivitet']);
  const date = normalizeDate(firstValue(row, ['date','Dato','Dato for aktiviteten','Hvornår?','Dato/tid']));
  const time = normalizeTime(firstValue(row, ['time','Tid','Tidspunkt','Tidspunkt for aktivitet','Klokkeslæt']));
  const base = normalizeKey(`${title}-${date}-${time}`).replace(/[^a-z0-9æøå -]/g, '').replace(/\s+/g, '-');
  return base || `sheet-${index}`;
}

function normalizeInitiativeRecord(row, index=0){
  const status = firstValue(row, ['status','Status','Godkendt','godkendt','Approved']);
  const date = normalizeDate(firstValue(row, ['date','Dato','Dato for aktiviteten','Hvornår?','Dato/tid']));
  const title = firstValue(row, ['title','Titel','Titel på aktiviteten','Initiativ','Aktivitet']);
  const host = firstValue(row, ['host','Kontaktperson','Navn på kontaktperson','Navn','Oprettet af']);
  return {
    id: makeInitiativeId(row, index),
    icon: firstValue(row, ['icon','Ikon']) || '🤝',
    status,
    title: title || 'Uden titel',
    date,
    time: normalizeTime(firstValue(row, ['time','Tid','Tidspunkt','Tidspunkt for aktivitet','Klokkeslæt'])),
    place: firstValue(row, ['place','Sted','Lokation']),
    host,
    text: firstValue(row, ['text','Beskrivelse','Beskrivelse af aktiviteten','Tekst'])
  };
}

function normalizeInitiatives(items){
  return (Array.isArray(items) ? items : [])
    .map((row, index) => normalizeInitiativeRecord(row, index))
    .filter(e => isApproved(e.status))
    .filter(e => e.title && e.date);
}

function normalizeParticipantRecord(row){
  return {
    activityId: firstValue(row, ['activityId','Aktivitet ID','Aktivitets ID','id']),
    activity: firstValue(row, ['activity','Aktivitet','Titel','Titel på aktiviteten','Initiativ']),
    name: firstValue(row, ['name','Navn','Dit navn'])
  };
}

function normalizeParticipants(items){
  return (Array.isArray(items) ? items : [])
    .map(normalizeParticipantRecord)
    .filter(p => (p.activityId || p.activity) && p.name);
}

async function loadInitiativesFromSheet(force=false){
  // Prøv specifik action først. Hvis Apps Script ikke har den, læses den samlede list.
  let data;
  try{
    data = await fetchAppsScriptAction('getInitiatives', force);
  }catch(err){
    data = await fetchAppsScriptAction('list', true);
  }
  const rows = arrayRowsToObjects(pickArray(data, ['initiatives','initiativer','Initiativer','items','data','rows']));
  return normalizeInitiatives(rows);
}

async function loadParticipantsFromSheet(force=false){
  let data;
  try{
    data = await fetchAppsScriptAction('getParticipants', force);
  }catch(err){
    data = await fetchAppsScriptAction('list', true);
  }
  const rows = arrayRowsToObjects(pickArray(data, ['participants','deltagere','Deltagere','items','data','rows']));
  return normalizeParticipants(rows);
}


function renderAll(){
  renderEventHero();
  renderEventList();
  renderLogeHero();
  renderLogeList();
  renderInitiatives();
}

async function loadJson(path){
  const res = await fetch(path + '?v=103', {cache:'no-store'});
  if(!res.ok) throw new Error(path);
  return await res.json();
}

async function init(){
  if(loadingScreen) loadingScreen.classList.remove('hidden');

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

  renderAll();

  if(loadingScreen){
    setTimeout(() => loadingScreen.classList.add('hidden'), 250);
  }

  try{
    initiativer = await loadInitiativesFromSheet(true);
    participants = await loadParticipantsFromSheet(true);
    initiativesLoading = false;
    renderInitiatives();
  }catch(err){
    console.warn('Kunne ikke indlæse initiativdata:', err);
    initiativer = [];
    participants = [];
    initiativesLoading = false;
    renderInitiatives();
  }
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
      appDataCache = null;
      window.__appsScriptCache = {};
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
    const initiative = initiativeById(payload.activityId);
    const existingNames = initiative ? participantsFor(initiative).map(normalizeKey) : [];
    if(existingNames.includes(normalizeKey(payload.name))){
      joinStatus.textContent = 'Du står allerede på deltagerlisten.';
      return;
    }
    joinSubmitButton.disabled = true;
    joinStatus.textContent = 'Sender tilmelding...';
    try{
      await postToAppsScript('joinActivity', payload);
      joinStatus.textContent = '✓ Du er tilmeldt.';
      await new Promise(resolve => setTimeout(resolve, 900));
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

const appVersion = $('#appVersion');
if(appVersion) appVersion.textContent = APP_VERSION;

const updateBanner = $('#updateBanner');
const updateNowBtn = $('#updateNowBtn');
let waitingWorker = null;
let refreshing = false;

function showUpdateBanner(worker){
  waitingWorker = worker;
  if(updateBanner) updateBanner.hidden = false;
}

if(updateNowBtn){
  updateNowBtn.addEventListener('click', () => {
    if(waitingWorker){
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }else{
      location.reload();
    }
  });
}

if('serviceWorker' in navigator){
  window.addEventListener('load', async () => {
    try{
      const registration = await navigator.serviceWorker.register('sw.js?v=' + APP_VERSION);

      if(registration.waiting){
        showUpdateBanner(registration.waiting);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if(!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
            showUpdateBanner(newWorker);
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if(refreshing) return;
        refreshing = true;
        location.reload();
      });

      setTimeout(() => registration.update(), 3000);
    }catch(err){
      console.error('Service worker kunne ikke registreres', err);
    }
  });
}

init();
