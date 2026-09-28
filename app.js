'use strict';
const STORAGE_KEY='save-point-games-v1';
const STATUSES=['wishlist','playing','paused','completed','dropped'];
const LABELS={all:'My games',wishlist:'Wishlist',playing:'Playing',paused:'Paused',completed:'Completed',dropped:'Dropped'};
const DESCRIPTIONS={all:"A little home for every world you've visited.",wishlist:'Adventures waiting to begin.',playing:'The worlds you are exploring right now.',paused:'Stories you might return to.',completed:'Every ending worth remembering.',dropped:'Not every adventure needs an ending.'};
const PLATFORMS=['','PC','PlayStation 5','PlayStation 4','Xbox Series X|S','Xbox One','Nintendo Switch','Nintendo Switch 2','Steam Deck','Mobile','Other'];
let games=loadGames(),page='home',filter='all',searchTerm='',selectedStatus='';
let detailGameId=null,detailSelectedStatus=null,draftRating=0,newGameRating=0,editingEventId=null;
const PAGE_IDS={home:'homePage',library:'libraryPage',add:'addPage',timeline:'timelinePage',statistics:'statisticsPage'};
const $=id=>document.getElementById(id);
const today=()=>new Date().toLocaleDateString('en-CA');
const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function loadGames(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(data)?data.filter(g=>g&&typeof g.id==='string'&&typeof g.title==='string'&&STATUSES.includes(g.status)):[]}catch{return []}}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(games));render();return true}catch{toast('Could not save. Check available device storage.');return false}}
function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),3000)}
function render(){
  for(const f of ['all',...STATUSES])$('count-'+f).textContent=f==='all'?games.length:games.filter(g=>g.status===f).length;
  $('pageTitle').innerHTML=escapeHTML(LABELS[filter])+'<span class="dot">.</span>';
  $('pageDescription').textContent=DESCRIPTIONS[filter];
  let shown=games.filter(g=>(filter==='all'||g.status===filter)&&g.title.toLowerCase().includes(searchTerm));
  const sort=$('sort').value;
  shown.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='oldest'?(a.updatedAt||'').localeCompare(b.updatedAt||''):(b.updatedAt||'').localeCompare(a.updatedAt||''));
  $('games').innerHTML=shown.map(g=>`<button class="game-card" data-id="${escapeHTML(g.id)}" aria-label="Open ${escapeHTML(g.title)}"><div class="cover">${g.cover?`<img src="${escapeHTML(g.cover)}" alt="" loading="lazy" onerror="this.remove()">`:`<span>${escapeHTML(g.title[0].toUpperCase())}</span>`}</div><div class="card-body"><h2 class="card-title" title="${escapeHTML(g.title)}">${escapeHTML(g.title)}</h2><div class="meta">${escapeHTML(g.platform||'Platform not set')}</div><div class="card-foot"><span class="pill ${g.status}">${escapeHTML(LABELS[g.status])}</span><span class="rating">${g.rating?'★ '+g.rating+'/5':''}</span></div></div></button>`).join('');
  $('empty').hidden=shown.length>0;$('games').hidden=shown.length===0;
  $('emptyTitle').textContent=games.length?'No games found':'Your story starts here';
  $('emptyText').textContent=games.length?'Try another search or category.':'Add your first game to start building your collection.';
  $('emptyAdd').hidden=games.length>0;
  renderHome();
}
function renderHome(){
  if(!games.length){
    $('homeGrid').innerHTML='<div class="home-card home-empty"><h2>Your story starts here<span class="dot">.</span></h2><p class="home-note">Add your first game to see it show up here.</p><button class="primary" id="homeAdd" type="button">＋ Add a game</button></div>';
    return;
  }
  const byRecent=(a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'');
  const playing=games.filter(g=>g.status==='playing').sort(byRecent);
  const dropped=games.filter(g=>g.status==='dropped').sort(byRecent);
  const wishlist=games.filter(g=>g.status==='wishlist');
  const completed=games.filter(g=>g.status==='completed').length;
  const cards=[];
  cards.push(`<div class="home-card"><h2>You're playing right now<span class="dot">.</span></h2>${playing.length?`<ul class="home-list">${playing.slice(0,4).map(g=>`<li><button type="button" data-id="${escapeHTML(g.id)}">${escapeHTML(g.title)}</button></li>`).join('')}</ul>`:'<p class="home-note">Nothing in progress. Maybe pick something up?</p>'}<button type="button" class="home-link" data-goto="playing">See all playing →</button></div>`);
  if(dropped.length){
    const nudge=dropped[0];
    cards.push(`<div class="home-card"><h2>Do you want to return to ${escapeHTML(nudge.title)}<span class="dot">?</span></h2><p class="home-note">You dropped it${dropped.length>1?` — ${dropped.length-1} more waiting too`:''}.</p><button type="button" class="home-link" data-goto="dropped">See dropped →</button></div>`);
  }
  if(wishlist.length){
    cards.push(`<div class="home-card"><h2>Waiting in your wishlist<span class="dot">.</span></h2><p class="home-note">${wishlist.length} game${wishlist.length===1?'':'s'} you want to play, starting with ${escapeHTML(wishlist[0].title)}.</p><button type="button" class="home-link" data-goto="wishlist">See wishlist →</button></div>`);
  }
  cards.push(`<div class="home-card"><h2>Library snapshot<span class="dot">.</span></h2><p class="home-note">${games.length} game${games.length===1?'':'s'} total · ${completed} completed.</p><button type="button" class="home-link" data-goto="all">See all games →</button></div>`);
  $('homeGrid').innerHTML=cards.join('');
}
function showPage(name){
  page=name;
  for(const id of Object.values(PAGE_IDS))$(id).hidden=(id!==PAGE_IDS[name]);
  for(const id of Object.values(PAGE_IDS))$(id).classList.toggle('active-page',id===PAGE_IDS[name]);
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page?b.dataset.page===name:(name==='library'&&b.dataset.filter===filter)));
  window.scrollTo({top:0,behavior:'instant'});
}
function startAddFlow(){
  selectedStatus='';newGameRating=0;
  $('newGameTitle').value='';$('newGamePlatform').value='';$('newGameNote').value='';$('newGameHours').value='';
  document.querySelectorAll('#statusChoices button').forEach(b=>b.classList.remove('selected'));
  $('saveNewGame').disabled=true;
  $('completedFields').hidden=true;
  $('newGameNoteLabel').innerHTML='Note <em>optional</em>';
  $('newGameNote').placeholder='Anything you want to remember about starting this game...';
  renderStarInput('newGameRatingInput',0);
  $('addStep1').hidden=false;$('addStep1').classList.add('active-step');
  $('addStep2').hidden=true;$('addStep2').classList.remove('active-step');
  $('step1Progress').classList.add('active');$('step2Progress').classList.remove('active');
  $('addStepLabel').textContent='ADD GAME · 1/2';
  showPage('add');
  setTimeout(()=>$('newGameTitle').focus(),0);
}
function goToStep2(){
  const title=$('newGameTitle').value.trim();
  if(!title){$('newGameTitle').focus();toast('Enter a game title first.');return}
  $('setupTitle').innerHTML=escapeHTML(title)+'<span class="dot">.</span>';
  $('addStep1').hidden=true;$('addStep1').classList.remove('active-step');
  $('addStep2').hidden=false;$('addStep2').classList.add('active-step');
  $('step1Progress').classList.remove('active');$('step2Progress').classList.add('active');$('addStepLabel').textContent='ADD GAME · 2/2';
}
function goToStep1(){
  $('addStep2').hidden=true;$('addStep2').classList.remove('active-step');
  $('addStep1').hidden=false;$('addStep1').classList.add('active-step');
  $('step1Progress').classList.add('active');$('step2Progress').classList.remove('active');$('addStepLabel').textContent='ADD GAME · 1/2';
}
function saveNewGame(){
  const title=$('newGameTitle').value.trim();
  if(!title||!selectedStatus){toast('Choose a status before saving.');return}
  const now=new Date().toISOString();
  const isCompleted=selectedStatus==='completed';
  const hoursRaw=$('newGameHours').value.trim();
  const hours=isCompleted&&hoursRaw&&!isNaN(Number(hoursRaw))?Math.max(0,Number(hoursRaw)):null;
  const rating=isCompleted&&newGameRating?newGameRating:null;
  const game={id:uid(),title,platform:$('newGamePlatform').value,status:selectedStatus,cover:'',rating,events:[],note:$('newGameNote').value.trim(),createdAt:now,updatedAt:now};
  if(selectedStatus==='playing'||selectedStatus==='completed')game.events.push({id:uid(),type:selectedStatus,date:today(),hours,rating,note:game.note});
  games.unshift(game);
  if(!persist())return;
  filter='all';searchTerm='';$('search').value='';
  showPage('library');toast('Game added to your library.');
}
function openDetail(id){
  const g=games.find(x=>x.id===id);if(!g)return;
  detailGameId=id;detailSelectedStatus=null;draftRating=0;editingEventId=null;
  $('detailInitial').textContent=g.title[0].toUpperCase();
  $('detailTitle').textContent=g.title;
  $('detailSubtitle').textContent=`${g.platform||'Platform not set'} · ${LABELS[g.status]}${g.rating?` · ★ ${g.rating}/5`:''}`;
  $('detailStatusChoices').innerHTML=STATUSES.map(s=>`<button type="button" data-status="${s}"${s===g.status?' class="current"':''}>${escapeHTML(LABELS[s])}</button>`).join('');
  $('detailUpdateFields').hidden=true;
  $('detailActions').hidden=true;
  renderDetailHistory(g);
  $('detailOverlay').hidden=false;
}
function closeDetail(){
  $('detailOverlay').hidden=true;
  detailGameId=null;detailSelectedStatus=null;editingEventId=null;
}
function renderDetailHistory(g){
  const events=[...g.events].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  $('detailHistoryList').innerHTML=events.length?events.map(ev=>{
    if(ev.id===editingEventId)return `<div class="history-item">
      <strong>${escapeHTML(LABELS[ev.type]||ev.type)}</strong>
      <div class="field"><label>Date</label><input type="date" id="editEventDate" value="${escapeHTML(ev.date||'')}"></div>
      <div class="field"><label>Comment</label><textarea id="editEventNote" rows="3">${escapeHTML(ev.note||'')}</textarea></div>
      <div class="actions"><button type="button" class="secondary" data-cancel-edit>Cancel</button><button type="button" class="primary" data-save-edit="${escapeHTML(ev.id)}">Save</button></div>
    </div>`;
    return `<div class="history-item"><strong>${escapeHTML(LABELS[ev.type]||ev.type)}</strong><small>${escapeHTML(ev.date||'')}${ev.hours?` · ${ev.hours}h`:''}${ev.rating?` · ★ ${ev.rating}/5`:''}</small>${ev.note?`<p>${escapeHTML(ev.note)}</p>`:''}<button type="button" class="home-link" data-edit-event="${escapeHTML(ev.id)}">Edit</button></div>`;
  }).join(''):'<p class="home-note">No history yet.</p>';
}
function renderStarInput(elId,value){
  $(elId).innerHTML=[1,2,3,4,5].map(n=>{
    const cls=value>=n?' full':value>=n-0.5?' half':'';
    return `<button type="button" class="star-btn${cls}" data-star="${n}" aria-label="${n} star${n===1?'':'s'}"></button>`;
  }).join('')+`<span class="star-value">${value?value+'/5':'No rating'}</span>`;
}
function selectDetailStatus(status){
  detailSelectedStatus=status;draftRating=0;
  $('detailHours').value='';$('detailNote').value='';
  renderStarInput('detailRatingInput',0);
  document.querySelectorAll('#detailStatusChoices button').forEach(b=>b.classList.toggle('selected',b.dataset.status===status));
  $('detailUpdateFields').hidden=false;
  $('detailActions').hidden=false;
}
function cancelDetailUpdate(){
  detailSelectedStatus=null;
  document.querySelectorAll('#detailStatusChoices button').forEach(b=>b.classList.remove('selected'));
  $('detailUpdateFields').hidden=true;
  $('detailActions').hidden=true;
}
function saveDetailUpdate(){
  if(!detailGameId||!detailSelectedStatus)return;
  const g=games.find(x=>x.id===detailGameId);if(!g)return;
  const hoursRaw=$('detailHours').value.trim();
  const hours=hoursRaw&&!isNaN(Number(hoursRaw))?Math.max(0,Number(hoursRaw)):null;
  const note=$('detailNote').value.trim();
  g.events.push({id:uid(),type:detailSelectedStatus,date:today(),hours,rating:draftRating||null,note});
  g.status=detailSelectedStatus;
  if(draftRating)g.rating=draftRating;
  g.updatedAt=new Date().toISOString();
  if(!persist())return;
  toast('Game updated.');
  closeDetail();
}
function exportBackup(){
  try{
    const payload={app:'Save Point',version:1,exportedAt:new Date().toISOString(),games};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download=`save-point-backup-${today()}.json`;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup exported.');
  }catch{toast('Could not export backup.');}
}
function importBackup(file){
  if(!file)return;const reader=new FileReader();
  reader.onload=()=>{try{const parsed=JSON.parse(reader.result);const imported=Array.isArray(parsed)?parsed:parsed.games;if(!Array.isArray(imported))throw new Error();games=imported.filter(g=>g&&typeof g.id==='string'&&typeof g.title==='string'&&STATUSES.includes(g.status));persist();toast(`Imported ${games.length} game${games.length===1?'':'s'}.`)}catch{toast('That backup file could not be imported.')}};
  reader.readAsText(file);
}
$('nav').addEventListener('click',e=>{
  const pageBtn=e.target.closest('button[data-page]');
  if(pageBtn){showPage(pageBtn.dataset.page);return}
  const b=e.target.closest('button[data-filter]');if(!b)return;filter=b.dataset.filter;showPage('library');render()
});
$('games').addEventListener('click',e=>{const card=e.target.closest('[data-id]');if(card)openDetail(card.dataset.id)});
$('homeGrid').addEventListener('click',e=>{
  const gotoBtn=e.target.closest('[data-goto]');
  if(gotoBtn){filter=gotoBtn.dataset.goto;searchTerm='';$('search').value='';showPage('library');render();return}
  const idBtn=e.target.closest('[data-id]');
  if(idBtn){openDetail(idBtn.dataset.id);return}
  if(e.target.closest('#homeAdd'))startAddFlow();
});
$('detailClose').addEventListener('click',closeDetail);
$('detailOverlay').addEventListener('click',e=>{if(e.target.id==='detailOverlay')closeDetail()});
$('detailStatusChoices').addEventListener('click',e=>{const b=e.target.closest('button[data-status]');if(b)selectDetailStatus(b.dataset.status)});
$('detailRatingInput').addEventListener('click',e=>{
  const btn=e.target.closest('.star-btn');if(!btn)return;
  const rect=btn.getBoundingClientRect();const n=Number(btn.dataset.star);
  const clicked=(e.clientX-rect.left)<rect.width/2?n-0.5:n;
  draftRating=clicked===draftRating?0:clicked;
  renderStarInput('detailRatingInput',draftRating);
});
$('detailCancelUpdate').addEventListener('click',cancelDetailUpdate);
$('detailSaveUpdate').addEventListener('click',saveDetailUpdate);
$('detailHistoryList').addEventListener('click',e=>{
  const g=games.find(x=>x.id===detailGameId);if(!g)return;
  const editBtn=e.target.closest('[data-edit-event]');
  if(editBtn){editingEventId=editBtn.dataset.editEvent;renderDetailHistory(g);return}
  if(e.target.closest('[data-cancel-edit]')){editingEventId=null;renderDetailHistory(g);return}
  const saveBtn=e.target.closest('[data-save-edit]');
  if(saveBtn){
    const ev=g.events.find(x=>x.id===saveBtn.dataset.saveEdit);if(!ev)return;
    ev.date=$('editEventDate').value||ev.date;
    ev.note=$('editEventNote').value.trim();
    g.updatedAt=new Date().toISOString();
    editingEventId=null;
    if(!persist())return;
    toast('Entry updated.');
    const g2=games.find(x=>x.id===detailGameId);if(g2)renderDetailHistory(g2);
  }
});
$('detailDeleteGame').addEventListener('click',()=>{
  const g=games.find(x=>x.id===detailGameId);if(!g)return;
  if(!confirm(`Delete "${g.title}"? This can't be undone.`))return;
  games=games.filter(x=>x.id!==detailGameId);
  if(!persist())return;
  toast('Game deleted.');
  closeDetail();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('detailOverlay').hidden)closeDetail()});
$('search').addEventListener('input',e=>{searchTerm=e.target.value.trim().toLowerCase();render()});
$('sort').addEventListener('change',render);
$('addBtn').addEventListener('click',startAddFlow);
$('emptyAdd').addEventListener('click',startAddFlow);
$('homeAddBtn').addEventListener('click',startAddFlow);
$('backToLibrary').addEventListener('click',()=>showPage('library'));
$('continueAdd').addEventListener('click',goToStep2);
$('backToStep1').addEventListener('click',goToStep1);
$('saveNewGame').addEventListener('click',saveNewGame);
$('newGameTitle').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();goToStep2()}});
$('statusChoices').addEventListener('click',e=>{
  const b=e.target.closest('button[data-status]');if(!b)return;
  selectedStatus=b.dataset.status;
  document.querySelectorAll('#statusChoices button').forEach(x=>x.classList.toggle('selected',x===b));
  $('saveNewGame').disabled=false;
  const isCompleted=selectedStatus==='completed';
  $('completedFields').hidden=!isCompleted;
  if(isCompleted){
    $('newGameNoteLabel').innerHTML='Feedback <em>optional</em>';
    $('newGameNote').placeholder='What did you think of it?';
  }else{
    $('newGameHours').value='';newGameRating=0;renderStarInput('newGameRatingInput',0);
    $('newGameNoteLabel').innerHTML='Note <em>optional</em>';
    $('newGameNote').placeholder='Anything you want to remember about starting this game...';
  }
});
$('newGameRatingInput').addEventListener('click',e=>{
  const btn=e.target.closest('.star-btn');if(!btn)return;
  const rect=btn.getBoundingClientRect();const n=Number(btn.dataset.star);
  const clicked=(e.clientX-rect.left)<rect.width/2?n-0.5:n;
  newGameRating=clicked===newGameRating?0:clicked;
  renderStarInput('newGameRatingInput',newGameRating);
});
$('exportBtn').addEventListener('click',exportBackup);
$('importInput').addEventListener('change',e=>{importBackup(e.target.files[0]);e.target.value=''});
for(const [i,p] of PLATFORMS.entries()){$('newGamePlatform').add(new Option(p||'Select platform',p,i===0))}
render();
if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
