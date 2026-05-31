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

function renderHero(){
  const e = upcoming()[0] || sortedEvents()[0];
  nextEvent.innerHTML = `
    <button class="next-card no-poster-card" onclick="openEvent('${e.id}')" aria-label="Åbn ${e.title}">
      <div class="event-icon large">${e.icon}</div>
      <div class="next-info">
        <span class="tag">${tag(e.type)}</span>
        <h3>${e.title}</h3>
        <div class="match">${e.match}</div>
        <div class="meta">
          <div><span>📅</span><span>${daDate(e.date)}</span></div>
          <div><span>🕘</span><span>${e.open ? e.open + '<br>' : ''}${e.timeText}</span></div>
          <div><span>📍</span><span>${e.place}</span></div>
        </div>
        <p class="desc">${e.text}</p>
        <div class="card-arrow">Tryk for detaljer ›</div>
      </div>
    </button>`;
}
function renderList(){const items = shownEvents(); eventList.innerHTML = items.length ? items.map(e => `<button class="event-card" onclick="openEvent('${e.id}')"><div class="event-icon">${e.icon}</div><div><h3>${e.title}</h3><p><strong>${e.match}</strong><br>${daDate(e.date,false)} · ${e.timeText}</p></div><div class="chev">›</div></button>`).join('') : `<div class="empty">Ingen arrangementer i denne kategori.</div>`;}
function renderCalendar(){let html=''; let current=''; for(const e of upcoming()){const m=monthName(e.date); if(m!==current){current=m; html += `<div class="month-title">${m}</div>`;} html += `<button class="calendar-row" onclick="openEvent('${e.id}')"><div class="date-box">${shortDate(e.date)}</div><div><strong>${e.icon} ${e.title}</strong><span>${e.match}<br>${e.timeText}</span></div></button>`;} calendarList.innerHTML = html;}

window.openEvent = function(id){
  const e=byId(id);
  modalContent.innerHTML = `
    <div class="detail-poster-wrap">
      <img class="detail-poster" src="${e.poster}" alt="${e.title} plakat">
    </div>
    <h2 class="modal-title">${e.icon} ${e.title}</h2>
    <p class="modal-sub">${e.match}</p>
    <div class="info-grid">
      <div class="info-row"><span>📅</span><div>${daDate(e.date)}</div></div>
      <div class="info-row"><span>🕘</span><div>${e.open ? e.open + '<br>' : ''}${e.timeText}</div></div>
      <div class="info-row"><span>📍</span><div>${e.place}</div></div>
      <div class="info-row"><span>🔒</span><div>${tag(e.type)}</div></div>
    </div>
    <p class="description">${e.text}</p>
    <div class="modal-actions">
      <a class="btn primary" href="${calUrl(e)}" target="_blank" rel="noopener">Tilføj kalender</a>
    </div>`;
  modal.showModal();
}


filterSelect.addEventListener('change', e=>{currentFilter=e.target.value; renderList();});
$('[data-close]').addEventListener('click',()=>modal.close());
$('[data-poster-close]').addEventListener('click',()=>posterModal.close());
$('[data-zoom-reset]').addEventListener('click',()=>{zoom=1; posterImage.style.width='100%'; posterImage.style.transform='scale(1)';});
posterImage.addEventListener('dblclick',()=>{zoom = zoom === 1 ? 1.8 : 1; posterImage.style.width = (zoom*100)+'%';});
$$('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{const v=btn.dataset.view; $$('.nav-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); $$('.view').forEach(view=>view.classList.remove('active-view')); $('#view'+v[0].toUpperCase()+v.slice(1)).classList.add('active-view'); window.scrollTo({top:0,behavior:'smooth'});}));
let deferredPrompt; const installBtn=$('#installBtn'); window.addEventListener('beforeinstallprompt',e=>{e.preventDefault(); deferredPrompt=e; installBtn.hidden=false;}); installBtn.addEventListener('click',async()=>{if(!deferredPrompt)return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installBtn.hidden=true;}); if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));}
renderHero(); renderList(); renderCalendar();







