const SB_URL='https://brtylfnzrcljicppargr.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydHlsZm56cmNsamljcHBhcmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjU2OTMsImV4cCI6MjA3NzMwMTY5M30.cUFqyzyOlrJuM_CxdQcokXfj5-5NUnLorIriEHWDl2I';
const ADMIN_PASS='CSDOCS';
const db = window.supabase.createClient(SB_URL, SB_KEY);

// ── CONFIG DEFAULTS ──
const CONFIG_DEFAULTS = {
  logo: '⚙️',
  title: 'هندسة أوامر الذكاء الاصطناعي',
  description: 'مرحباً بك في جلسة هندسة أوامر الذكاء الاصطناعي\nأدخل اسمك للمشاركة في النقاش',
  header_sub: 'لوحة نقاش تفاعلية • مباشر'
};
let boardConfig = { ...CONFIG_DEFAULTS };
const EMOJI_OPTIONS = [
  '🎓','👨‍🏫','📚','📝','📖','📌','📢',
  '💬','❓','✅','🧪','🧠','💡','🎯',
  '📊','📈','🌐','💻','⌨️','⚙️','🚀'
];

// Reaction emojis (fixed set)
const REACTION_EMOJIS = ['👍','❤️','💡','👏','😮'];

// ── STATE ──
let UID=sessionStorage.getItem('b_uid')||('u_'+Math.random().toString(36).slice(2,10));
sessionStorage.setItem('b_uid',UID);
let userName=sessionStorage.getItem('b_name')||'';
let isAdmin=false,adminName='',topics=[],expandedId=null,lastComment={};
let activeTopicId=null;
const pollPreviews=new Set();
let viewingArchiveId=null;
let archiveSessions=[];

// ★ Poll type state for admin form
let newPollType = 'single'; // 'single' | 'multi'

// ★ Reactions cache: { targetId: { emoji: count, __mine: emoji|null } }
let reactionsCache = {};

// ★ Attendance cache
let myAttendance = sessionStorage.getItem('b_attended') === '1';

const dname=()=>isAdmin?adminName:userName;
const AV=['av0','av1','av2','av3','av4','av5'];
function avc(s){let h=0;for(const c of(s||'u'))h=(h*31+c.charCodeAt(0))>>>0;return AV[h%6];}
function ini(n){return(n||'?').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();}

// ── POLL TYPE TOGGLE (admin) ──
function setPollType(type) {
  newPollType = type;
  const single = document.getElementById('ptt-single');
  const multi  = document.getElementById('ptt-multi');
  const desc   = document.getElementById('poll-type-desc');
  if (type === 'single') {
    single.classList.add('active');
    multi.classList.remove('active');
    desc.textContent = 'المستخدم يختار إجابة واحدة فقط من الخيارات.';
    desc.style.color = 'var(--text3)';
  } else {
    multi.classList.add('active');
    single.classList.remove('active');
    desc.textContent = 'المستخدم يمكنه اختيار أكثر من إجابة في نفس الوقت.';
    desc.style.color = 'var(--multi)';
  }
}

// ── BOARD CONFIG ──
async function loadBoardConfig(){
  try {
    const {data,error}=await db.from('board_config').select('*').eq('id',1).maybeSingle();
    if(!error && data){
      boardConfig={
        logo: data.logo || CONFIG_DEFAULTS.logo,
        title: data.title || CONFIG_DEFAULTS.title,
        description: data.description || CONFIG_DEFAULTS.description,
        header_sub: data.header_sub || CONFIG_DEFAULTS.header_sub
      };
    }
  } catch(e){ boardConfig = { ...CONFIG_DEFAULTS }; }
  applyBoardConfig();
}
function applyBoardConfig(){
  const dynContent = document.getElementById('onboard-dynamic-content');
  if(dynContent){
    dynContent.innerHTML=`
      <div class="onboard-logo" id="onboard-logo-el">${boardConfig.logo}</div>
      <div class="onboard-title" id="onboard-title-el">${esc(boardConfig.title)}</div>
      <div class="onboard-sub" id="onboard-sub-el">${esc(boardConfig.description).replace(/\n/g,'<br>')}</div>`;
  }
  const hdrLogo=document.getElementById('hdr-logo');
  const hdrTitle=document.getElementById('hdr-title');
  if(hdrLogo) hdrLogo.textContent=boardConfig.logo;
  if(hdrTitle) hdrTitle.textContent=boardConfig.title;
  if(!viewingArchiveId){
    const subEl=document.getElementById('brand-sub-txt');
    if(subEl && !subEl.classList.contains('archived-mode'))subEl.textContent=boardConfig.header_sub;
  }
  document.title='لوحة المناقشة — '+boardConfig.title;
}
async function saveConfig(){
  const logo=document.getElementById('cfg-emoji-custom').value.trim()||document.querySelector('.emoji-opt.selected')?.dataset.emoji||boardConfig.logo;
  const title=document.getElementById('cfg-title').value.trim();
  const desc=document.getElementById('cfg-desc').value.trim();
  const sub=document.getElementById('cfg-sub').value.trim();
  if(!title){toast('أدخل عنوان اللوحة','error');return;}
  const {error}=await db.from('board_config').upsert({
    id:1,logo:logo||CONFIG_DEFAULTS.logo,title,
    description:desc||CONFIG_DEFAULTS.description,
    header_sub:sub||CONFIG_DEFAULTS.header_sub,
    updated_at:new Date().toISOString()
  });
  if(error){toast('خطأ: تأكد من إنشاء جدول board_config في Supabase','error');return;}
  boardConfig={logo:logo||CONFIG_DEFAULTS.logo,title,description:desc||CONFIG_DEFAULTS.description,header_sub:sub||CONFIG_DEFAULTS.header_sub};
  applyBoardConfig();
  toast('✅ تم حفظ الإعدادات وتطبيقها على الجميع','success');
}
function initSettingsForm(){
  const grid=document.getElementById('emoji-grid');
  if(!grid.innerHTML){
    EMOJI_OPTIONS.forEach(e=>{
      const d=document.createElement('div');
      d.className='emoji-opt'+(boardConfig.logo===e?' selected':'');
      d.dataset.emoji=e;d.textContent=e;
      d.onclick=()=>{
        grid.querySelectorAll('.emoji-opt').forEach(x=>x.classList.remove('selected'));
        d.classList.add('selected');
        document.getElementById('cfg-emoji-custom').value='';
        updateConfigPreview();
      };
      grid.appendChild(d);
    });
  }
  document.getElementById('cfg-title').value=boardConfig.title;
  document.getElementById('cfg-desc').value=boardConfig.description;
  document.getElementById('cfg-sub').value=boardConfig.header_sub;
  grid.querySelectorAll('.emoji-opt').forEach(x=>{x.classList.toggle('selected',x.dataset.emoji===boardConfig.logo);});
  document.getElementById('cfg-emoji-custom').value=EMOJI_OPTIONS.includes(boardConfig.logo)?'':boardConfig.logo;
  updateConfigPreview();
  ['cfg-title','cfg-desc','cfg-sub','cfg-emoji-custom'].forEach(id=>{document.getElementById(id).oninput=updateConfigPreview;});
}
function updateConfigPreview(){
  const selEmoji=document.querySelector('.emoji-opt.selected')?.dataset.emoji;
  const customEmoji=document.getElementById('cfg-emoji-custom')?.value.trim();
  const logo=customEmoji||selEmoji||boardConfig.logo;
  const title=document.getElementById('cfg-title')?.value.trim()||boardConfig.title;
  const sub=document.getElementById('cfg-sub')?.value.trim()||boardConfig.header_sub;
  document.getElementById('cfg-prev-logo').textContent=logo;
  document.getElementById('cfg-prev-title').textContent=title;
  document.getElementById('cfg-prev-sub').textContent=sub;
}
db.channel('rt-config')
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'board_config'},payload=>{
    if(!isAdmin){
      const d=payload.new;
      boardConfig={logo:d.logo||CONFIG_DEFAULTS.logo,title:d.title||CONFIG_DEFAULTS.title,description:d.description||CONFIG_DEFAULTS.description,header_sub:d.header_sub||CONFIG_DEFAULTS.header_sub};
      applyBoardConfig();
    }
  }).subscribe();

// ── ONBOARD ──
async function initOnboard(){
  await Promise.all([loadBoardConfig(), loadArchiveSessions()]);
  if(userName){document.getElementById('onboard-overlay').style.display='none';updateHdr();}
  else renderPastSessionsOnboard();
}
function renderPastSessionsOnboard(){
  // Past sessions are NOT shown on the entry form — users enter the live session directly.
  const wrap=document.getElementById('past-sessions-wrap');
  if(wrap) wrap.innerHTML='';
}
function viewArchiveFromOnboard(archiveId){
  const name=document.getElementById('onboard-name').value.trim();
  if(!name){shake('onboard-name');toast('أدخل اسمك أولاً للدخول','error');return;}
  userName=name;sessionStorage.setItem('b_name',name);
  document.getElementById('onboard-overlay').style.display='none';
  updateHdr();loadArchiveSession(archiveId);
}
document.getElementById('onboard-name').addEventListener('keydown',e=>{if(e.key==='Enter')enterBoard();});
async function enterBoard(){
  const v=document.getElementById('onboard-name').value.trim();
  if(!v){shake('onboard-name');return;}
  userName=v;sessionStorage.setItem('b_name',v);
  document.getElementById('onboard-overlay').style.display='none';
  updateHdr();toast('مرحباً '+v+'!','success');
  // Auto-register presence in current live session
  await autoRegisterPresence(v);
  loadTopics();
}

async function autoRegisterPresence(name){
  try {
    await db.from('attendance').upsert({
      session_id:'live', user_id:UID, user_name:name, checked_in_at:new Date().toISOString()
    });
    myAttendance=true;
    sessionStorage.setItem('b_attended','1');
  } catch(e){}
}
function updateHdr(){
  const n=dname()||'…';
  document.getElementById('hdr-name').textContent=n;
  const av=document.getElementById('hdr-av');
  av.className='u-av '+(n?avc(n):'av0');
  av.textContent=ini(n);
}
function shake(id){const el=document.getElementById(id);el.style.animation='none';el.offsetHeight;el.style.animation='shake 0.3s ease';el.focus();}

// ── MODALS ──
function openModal(id){document.getElementById(id).classList.remove('hidden');}
function closeModal(id){document.getElementById(id).classList.add('hidden');}
function showConfirm(title,msg,cb,btnTxt='تأكيد',btnCls='btn-danger'){
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-msg').textContent=msg;
  document.getElementById('confirm-modal').classList.remove('hidden');
  const ok=document.getElementById('confirm-ok');
  ok.textContent=btnTxt;ok.className='btn '+btnCls;
  ok.onclick=()=>{closeModal('confirm-modal');cb();};
}
function showEdit(title,lbl,val,descVal,cb){
  document.getElementById('edit-title').textContent=title;
  document.getElementById('edit-lbl').textContent=lbl;
  document.getElementById('edit-val').value=val;
  const dw=document.getElementById('edit-desc-wrap');
  if(descVal!==undefined){dw.style.display='block';document.getElementById('edit-desc').value=descVal||'';}
  else dw.style.display='none';
  document.getElementById('edit-save').onclick=cb;
  openModal('edit-modal');
}

// ── ADMIN LOGIN / LOGOUT ──
function doLogin(){
  const n=document.getElementById('aname').value.trim();
  const p=document.getElementById('apass').value;
  if(!n){shake('aname');return;}
  if(p!==ADMIN_PASS){toast('كلمة مرور خاطئة','error');return;}
  isAdmin=true;adminName=n;
  closeModal('admin-modal');
  document.getElementById('admin-panel').classList.add('open');
  document.getElementById('admin-btn').classList.add('active');
  document.getElementById('admin-btn').textContent='⚡ مشرف';
  document.getElementById('apass').value='';
  document.getElementById('archive-view-btn').style.display='flex';
  updateHdr();populatePollSel();loadAdminArchiveList();
  toast('مرحباً '+n+'! وضع المشرف مفعّل','success');
  renderTopics();
}
function doLogout(){
  isAdmin=false;adminName='';
  document.getElementById('admin-panel').classList.remove('open');
  document.getElementById('admin-btn').classList.remove('active');
  document.getElementById('admin-btn').textContent='🔐 مشرف';
  document.getElementById('archive-view-btn').style.display='none';
  updateHdr();renderTopics();toast('تم تسجيل الخروج');
}
function switchTab(t){
  const tabs=['topic','poll','settings','archive','presence'];
  document.querySelectorAll('.atab').forEach((el,i)=>{el.classList.toggle('active',tabs[i]===t);});
  tabs.forEach(name=>{const el=document.getElementById('f-'+name);if(el)el.classList.toggle('open',name===t);});
  if(t==='poll')populatePollSel();
  if(t==='archive')loadAdminArchiveList();
  if(t==='settings')initSettingsForm();
  if(t==='presence')loadPresencePanel();
}
function populatePollSel(){
  const sel=document.getElementById('poll-tsel');
  sel.innerHTML='<option value="">اختر موضوعاً…</option>';
  topics.forEach(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=t.title;sel.appendChild(o);});
}

// ── ACTIVE TOPIC ──
async function setActiveTopic(tid){
  const newActive=(activeTopicId===tid)?null:tid;
  const updates=topics.map(t=>db.from('topics').update({is_active:t.id===newActive}).eq('id',t.id));
  await Promise.all(updates);
  activeTopicId=newActive;
  await loadTopics();
  toast(newActive?'✅ تم تعيين الموضوع النشط':'تم إلغاء الموضوع النشط','success');
}
function renderActiveBanner(){
  const banner=document.getElementById('active-topic-banner');
  if(!activeTopicId||viewingArchiveId){banner.innerHTML='';return;}
  const t=topics.find(x=>x.id===activeTopicId);
  if(!t){banner.innerHTML='';return;}
  banner.innerHTML=`
    <div class="active-topic-banner">
      <div class="active-topic-badge"><div class="active-pulse"></div>الموضوع النشط الآن</div>
      <div class="active-topic-title">${esc(t.title)}</div>
      ${t.description?`<div class="active-topic-desc">${esc(t.description)}</div>`:''}
      <button class="active-topic-cta" onclick="scrollToTopic('${t.id}')">انتقل إلى الموضوع ↓</button>
    </div>`;
}
function scrollToTopic(tid){
  const card=document.getElementById('tc-'+tid);if(!card)return;
  if(expandedId!==tid)toggleTopic(tid);
  setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'start'}),120);
}

// ── LOAD DATA ──
async function loadTopics(){
  const {data,error}=await db.from('topics').select('*').order('created_at',{ascending:true});
  if(error){document.getElementById('topics-list').innerHTML='<div class="state-empty">خطأ في تحميل البيانات</div>';return;}
  topics=data||[];
  const active=topics.find(t=>t.is_active);
  activeTopicId=active?active.id:null;
  document.getElementById('st-topics').textContent=topics.length;
  renderActiveBanner();renderTopics();loadStats();
}
async function loadStats(archiveId=null){
  if(archiveId){
    const {data:sess}=await db.from('archive_sessions').select('comment_count,poll_count,vote_count,topic_count').eq('id',archiveId).single();
    if(sess){
      document.getElementById('st-topics').textContent=sess.topic_count??'–';
      document.getElementById('st-comments').textContent=sess.comment_count??'–';
      document.getElementById('st-polls').textContent=sess.poll_count??'–';
      document.getElementById('st-votes').textContent=sess.vote_count??'–';
    }
    return;
  }
  const [{count:cc},{count:pc},{count:vc}]=await Promise.all([
    db.from('comments').select('*',{count:'exact',head:true}),
    db.from('polls').select('*',{count:'exact',head:true}),
    db.from('poll_votes').select('*',{count:'exact',head:true})
  ]);
  document.getElementById('st-comments').textContent=cc??'–';
  document.getElementById('st-polls').textContent=pc??'–';
  document.getElementById('st-votes').textContent=vc??'–';
}

function renderTopics(archiveMode=false){
  const c=document.getElementById('topics-list');
  if(!topics.length){
    c.innerHTML=`<div class="state-empty"><span class="icon">${archiveMode?'📦':'💬'}</span>${archiveMode?'لا توجد مواضيع في هذا الأرشيف':'لا توجد مواضيع بعد'}</div>`;
    return;
  }
  c.innerHTML='';
  topics.forEach((t,i)=>{
    const isAct=!archiveMode&&(t.id===activeTopicId);
    const card=document.createElement('div');
    card.className='topic-card'+(expandedId===t.id?' expanded':'')+(isAct?' is-active-topic':'');
    card.id='tc-'+t.id;card.style.animationDelay=(i*0.055)+'s';
    const adminBar=isAdmin&&!archiveMode?`<div class="admin-bar">
      <button class="btn btn-purple btn-sm${isAct?' is-active':''}" onclick="event.stopPropagation();setActiveTopic('${t.id}')">${isAct?'⚡ نشط':'📌 تعيين نشط'}</button>
      <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editTopic('${t.id}')">✏️ تعديل</button>
      <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteTopic('${t.id}')">🗑 حذف</button>
      <!--<button class="btn btn-sm" style="background:var(--teal-bg);color:var(--teal);border:1px solid var(--multi-border)" onclick="event.stopPropagation();openAttendanceModal('${t.id}')">👥 الحضور</button>-->
    </div>`:'';
    card.innerHTML=`
      <div class="topic-header" onclick="toggleTopic('${t.id}')">
        <div class="t-left">
          <div><span class="t-index${isAct?' active-idx':''}">${isAct?'⚡ نشط':archiveMode?'📦 مؤرشف':'موضوع '+(i+1)}</span></div>
          <div class="t-title">${esc(t.title)}</div>
          ${t.description?`<div class="t-desc">${esc(t.description)}</div>`:''}
          <div class="t-meta">
            <span class="t-meta-item" id="mc-${t.id}">💬 –</span>
            <span class="t-meta-item" id="mp-${t.id}"></span>
            ${!archiveMode?`<span class="t-meta-item" id="att-${t.id}"></span>`:''}
          </div>
        </div>
        <span class="t-chevron">›</span>
      </div>
      ${adminBar}
      <div class="topic-body" id="tb-${t.id}">
        <div class="topic-body-inner" id="tbi-${t.id}">
          <div class="state-empty"><div class="ldots"><span></span><span></span><span></span></div></div>
        </div>
      </div>`;
    c.appendChild(card);
    loadMeta(t.id);
    if(!archiveMode) loadAttendanceMeta(t.id);
  });
}
async function loadMeta(tid){
  const [{count:cc},{data:polls}]=await Promise.all([
    db.from('comments').select('*',{count:'exact',head:true}).eq('topic_id',tid),
    db.from('polls').select('id').eq('topic_id',tid).limit(1)
  ]);
  const cel=document.getElementById('mc-'+tid);if(cel)cel.textContent='💬 '+(cc??0)+' تعليق';
  const pel=document.getElementById('mp-'+tid);if(pel&&polls?.length)pel.textContent='📊 استطلاع';
}
async function loadAttendanceMeta(tid){
  if(!isAdmin) return;
  const el = document.getElementById('att-'+tid);
  if(!el) return;
  const {count} = await db.from('attendance').select('*',{count:'exact',head:true}).eq('session_id','live');
  if(count) el.textContent = `👥 ${count} حاضر`;
}

// ── EXPAND ──
async function toggleTopic(id){
  if(viewingArchiveId){
    if(expandedId===id){document.getElementById('tc-'+id)?.classList.remove('expanded');expandedId=null;return;}
    if(expandedId)document.getElementById('tc-'+expandedId)?.classList.remove('expanded');
    expandedId=id;document.getElementById('tc-'+id)?.classList.add('expanded');
    await renderArchiveBody(id);return;
  }
  if(expandedId===id){document.getElementById('tc-'+id)?.classList.remove('expanded');expandedId=null;return;}
  if(expandedId)document.getElementById('tc-'+expandedId)?.classList.remove('expanded');
  expandedId=id;document.getElementById('tc-'+id)?.classList.add('expanded');
  await renderBody(id);
}
async function renderBody(tid){
  const inner=document.getElementById('tbi-'+tid);if(!inner)return;
  inner.innerHTML='<div class="state-empty"><div class="ldots"><span></span><span></span><span></span></div></div>';
  const [{data:comments},{data:polls},{data:linkPosts}]=await Promise.all([
    db.from('comments').select('*').eq('topic_id',tid).is('parent_id',null).order('created_at',{ascending:true}),
    db.from('polls').select('*').eq('topic_id',tid).order('created_at',{ascending:true}),
    db.from('link_posts').select('*').eq('topic_id',tid).order('created_at',{ascending:true})
  ]);
  let html='';
  for(const p of(polls||[]))html+=await buildPollHTML(p);
  // Attendance check-in button
  html += buildAttendanceWidget(tid);
  // Link posts
  for(const lp of(linkPosts||[]))html+=await buildLinkPostHTML(lp);
  html+=buildCommentsHTML(tid,comments||[]);
  inner.innerHTML=html;
  setupCooldown(tid);
  // Load inline link post form toggle
  const lpBtn = inner.querySelector('.lp-toggle-btn');
  if(lpBtn) lpBtn.onclick = () => toggleLinkForm(tid);
}

// ── POLLS ──
const votedPolls={};

async function buildPollHTML(poll){
  const isMulti = poll.poll_type === 'multi';
  const opts=poll.options;
  const [{data:votes},{data:myVotes}]=await Promise.all([
    db.from('poll_votes').select('option_index,user_id').eq('poll_id',poll.id),
    db.from('poll_votes').select('option_index').eq('poll_id',poll.id).eq('user_id',UID)
  ]);
  const total = isMulti
    ? (votes||[]).filter((v,i,a)=>a.findIndex(x=>x.user_id===v.user_id)===i).length
    : (votes||[]).length;
  const counts=opts.map((_,i)=>(votes||[]).filter(v=>v.option_index===i).length);
  const voted=!!(myVotes&&myVotes.length>0);
  const choiceIndices=myVotes?myVotes.map(v=>v.option_index):[];
  if(voted)votedPolls[poll.id]=choiceIndices;
  const isPreviewing=pollPreviews.has(poll.id);
  return buildPollMarkup(poll,opts,counts,total,voted,choiceIndices,isPreviewing);
}

function buildPollMarkup(poll,opts,counts,total,voted,choiceIndices,isPreviewing){
  const isArchived=!!viewingArchiveId;
  const isMulti = poll.poll_type === 'multi';
  const multiClass = isMulti ? ' multi-choice' : '';
  const tagClass = isMulti ? ' multi-tag' : '';
  const tagLabel = isMulti ? '📊 استطلاع متعدد الخيارات' : '📊 استطلاع رأي';

  let h=`<div class="poll-wrap${multiClass}" id="pw-${poll.id}">
    <div><span class="poll-tag${tagClass}">${tagLabel}</span></div>
    ${isAdmin&&!isArchived?`<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" onclick="editPoll('${poll.id}')">✏️ تعديل السؤال</button>
      <button class="btn btn-ghost btn-sm" onclick="editPollOptions('${poll.id}')">🔧 تعديل الخيارات</button>
      <button class="btn btn-danger btn-sm" onclick="deletePoll('${poll.id}')">🗑 حذف</button>
    </div>`:''}
    <div class="poll-question">${esc(poll.question)}</div>`;

  if(!voted && !isPreviewing && !isArchived){
    if(isMulti){
      h+=`<div class="multi-check-counter" id="mcc-${poll.id}"><span id="mcc-count-${poll.id}">0</span> خيار محدد</div>`;
      h+=`<div id="pf-${poll.id}">`;
      opts.forEach((o,i)=>{
        h+=`<label class="poll-check-label" id="pcl-${poll.id}-${i}" onclick="toggleCheck('${poll.id}',${i})">
          <input type="checkbox" name="pm${poll.id}" value="${i}" onchange="updateCheckStyle('${poll.id}',${i},this.checked);updateCheckCounter('${poll.id}')"> ${esc(o)}
        </label>`;
      });
      h+=`</div>`;
      h+=`<div class="poll-type-hint multi">☑ حدد كل الخيارات المناسبة لك</div>`;
    } else {
      h+=`<form id="pf-${poll.id}">`;
      opts.forEach((o,i)=>{h+=`<label class="poll-opt-label"><input type="radio" name="p${poll.id}" value="${i}"> ${esc(o)}</label>`;});
      h+=`</form>`;
    }
    const voteBtn = isMulti
      ? `<button class="btn-vote-multi" id="pvb-${poll.id}" onclick="castVote('${poll.id}')">🗳 تصويت بخياراتي</button>`
      : `<button class="btn-vote-now" id="pvb-${poll.id}" onclick="castVote('${poll.id}')">🗳 تصويت</button>`;
    h+=`<div class="poll-actions">${voteBtn}<button class="btn-skip" onclick="skipToPreview('${poll.id}')">معاينة النتائج 👁</button></div>`;
  } else {
    h+=`<div class="poll-results" id="pr-${poll.id}">`;
    opts.forEach((o,i)=>{
      const pct=total>0?Math.round((counts[i]/total)*100):0;
      const cnt=counts[i];
      const isChosen=(choiceIndices||[]).includes(i);
      const fillClass=isMulti?' multi-fill':'';
      const nameClass=isChosen?(isMulti?' chosen-multi':' chosen'):'';
      h+=`<div class="poll-bar-row">
        <div class="poll-bar-name${nameClass}">${esc(o)}${isChosen?' ✓':''}</div>
        <div class="poll-track"><div class="poll-fill${fillClass}" style="width:${pct}%" id="pf-${poll.id}-${i}"></div></div>
        <div class="poll-pct" id="pp-${poll.id}-${i}">${pct}%</div>
        <div class="poll-count" id="pc-${poll.id}-${i}">${cnt}</div>
      </div>`;
    });
    h+=`</div>`;
    const voterLabel = isMulti ? `${total} مشارك` : `${total} صوت`;
    h+=`<div class="poll-footer">
      <div class="poll-total-txt" id="pt-${poll.id}">${voterLabel} ${!isArchived?'<span class="rt-pulse"></span>':''}</div>`;
    if(voted){
      if(isMulti && choiceIndices && choiceIndices.length){
        const chosen=choiceIndices.map(i=>esc(opts[i])).join('، ');
        h+=`<div class="voted-choices-badge">✓ اخترت: ${chosen}</div>`;
      } else {
        h+=`<div class="voted-badge">✓ تم التصويت</div>`;
      }
    } else if(isPreviewing && !isArchived){
      h+=`<div class="preview-badge">👁 معاينة فقط</div>`;
    }
    h+=`</div>`;
    if(isPreviewing && !voted && !isArchived){
      h+=`<div class="back-to-vote-row">
        <span style="font-size:12px;color:var(--text3)">يمكنك التصويت متى أردت</span>
        <button class="back-to-vote-btn" onclick="backToVote('${poll.id}')">← العودة للتصويت</button>
      </div>`;
    }
  }
  h+=`</div>`;
  return h;
}

// ── MULTI-CHOICE HELPERS ──
function toggleCheck(pollId, idx) {}
function updateCheckStyle(pollId, idx, checked) {
  const lbl = document.getElementById(`pcl-${pollId}-${idx}`);
  if(lbl) lbl.classList.toggle('checked', checked);
}
function updateCheckCounter(pollId) {
  const form = document.getElementById('pf-'+pollId);
  if(!form) return;
  const count = form.querySelectorAll(`input[name="pm${pollId}"]:checked`).length;
  const el = document.getElementById('mcc-count-'+pollId);
  if(el) el.textContent = count;
}

function skipToPreview(pollId){
  pollPreviews.add(pollId);
  const box=document.getElementById('pw-'+pollId);if(!box)return;
  db.from('polls').select('*').eq('id',pollId).single().then(async({data:poll})=>{
    if(!poll)return;
    const isMulti = poll.poll_type === 'multi';
    const {data:votes}=await db.from('poll_votes').select('option_index,user_id').eq('poll_id',poll.id);
    const total = isMulti
      ? (votes||[]).filter((v,i,a)=>a.findIndex(x=>x.user_id===v.user_id)===i).length
      : (votes||[]).length;
    const counts=poll.options.map((_,i)=>(votes||[]).filter(v=>v.option_index===i).length);
    const d=document.createElement('div');
    d.innerHTML=buildPollMarkup(poll,poll.options,counts,total,false,[],true);
    box.replaceWith(d.firstChild);
    toast('يمكنك التصويت لاحقاً من زر "العودة للتصويت"');
  });
}
function backToVote(pollId){
  pollPreviews.delete(pollId);
  const box=document.getElementById('pw-'+pollId);if(!box)return;
  db.from('polls').select('*').eq('id',pollId).single().then(async({data:poll})=>{
    if(!poll)return;
    const isMulti = poll.poll_type === 'multi';
    const {data:votes}=await db.from('poll_votes').select('option_index,user_id').eq('poll_id',poll.id);
    const total = isMulti
      ? (votes||[]).filter((v,i,a)=>a.findIndex(x=>x.user_id===v.user_id)===i).length
      : (votes||[]).length;
    const counts=poll.options.map((_,i)=>(votes||[]).filter(v=>v.option_index===i).length);
    const d=document.createElement('div');
    d.innerHTML=buildPollMarkup(poll,poll.options,counts,total,false,[],false);
    box.replaceWith(d.firstChild);
  });
}

function updatePollBars(pollId,votes,isMulti){
  const total = isMulti
    ? (votes||[]).filter((v,i,a)=>a.findIndex(x=>x.user_id===v.user_id)===i).length
    : (votes||[]).length;
  const opts=votes.reduce((acc,v)=>{acc[v.option_index]=(acc[v.option_index]||0)+1;return acc;},{});
  let i=0;
  while(document.getElementById(`pf-${pollId}-${i}`)){
    const cnt=opts[i]||0;
    const pct=total>0?Math.round((cnt/total)*100):0;
    const fill=document.getElementById(`pf-${pollId}-${i}`);
    const pp=document.getElementById(`pp-${pollId}-${i}`);
    const pc=document.getElementById(`pc-${pollId}-${i}`);
    if(fill)fill.style.width=pct+'%';
    if(pp)pp.textContent=pct+'%';
    if(pc)pc.textContent=cnt;
    i++;
  }
  const pt=document.getElementById('pt-'+pollId);
  const label = isMulti ? 'مشارك' : 'صوت';
  if(pt)pt.innerHTML=total+` ${label} <span class="rt-pulse"></span>`;
}

async function castVote(pollId){
  if(!dname()){toast('يرجى إدخال اسمك أولاً','error');return;}
  const btn=document.getElementById('pvb-'+pollId);if(btn)btn.disabled=true;
  const {data:poll}=await db.from('polls').select('*').eq('id',pollId).single();
  if(!poll){if(btn)btn.disabled=false;return;}
  const isMulti = poll.poll_type === 'multi';
  let chosenIndices=[];
  if(isMulti){
    const form=document.getElementById('pf-'+pollId);if(!form){if(btn)btn.disabled=false;return;}
    const checked=[...form.querySelectorAll(`input[name="pm${pollId}"]:checked`)];
    if(!checked.length){toast('اختر خياراً واحداً على الأقل','error');if(btn)btn.disabled=false;return;}
    chosenIndices=checked.map(inp=>parseInt(inp.value));
  } else {
    const form=document.getElementById('pf-'+pollId);if(!form){if(btn)btn.disabled=false;return;}
    const sel=form.querySelector(`input[name="p${pollId}"]:checked`);
    if(!sel){toast('اختر خياراً أولاً','error');if(btn)btn.disabled=false;return;}
    chosenIndices=[parseInt(sel.value)];
  }
  const rows=chosenIndices.map(idx=>({poll_id:pollId,user_id:UID,option_index:idx}));
  const {error}=await db.from('poll_votes').insert(rows);
  if(error){
    const msg=error.code==='23505'?'لقد صوّتت مسبقاً':'خطأ في التصويت';
    toast(msg,'error');if(btn)btn.disabled=false;return;
  }
  votedPolls[pollId]=chosenIndices;
  pollPreviews.delete(pollId);
  toast(isMulti?`تم تسجيل ${chosenIndices.length} اختيارات! 🎉`:'تم تسجيل تصويتك! 🎉','success');
  const box=document.getElementById('pw-'+pollId);
  if(box){const d=document.createElement('div');d.innerHTML=await buildPollHTML(poll);box.replaceWith(d.firstChild);}
  loadStats();
}

// ── EDIT POLL OPTIONS ──
async function editPollOptions(pollId){
  const {data:poll}=await db.from('polls').select('*').eq('id',pollId).single();if(!poll)return;
  const list=document.getElementById('poll-opts-editor-list');
  list.innerHTML='';
  poll.options.forEach((opt,i)=>{
    const row=document.createElement('div');row.className='poe-row';
    row.innerHTML=`<span style="font-size:12px;color:var(--text3);min-width:22px;text-align:center;font-weight:700">${i+1}</span>
      <input class="poe-input" data-idx="${i}" value="${esc(opt)}" maxlength="200" placeholder="الخيار ${i+1}">`;
    list.appendChild(row);
  });
  document.getElementById('poll-opts-save').onclick=async()=>{
    const inputs=[...list.querySelectorAll('.poe-input')];
    const newOpts=inputs.map(inp=>inp.value.trim());
    if(newOpts.some(o=>!o)){toast('لا يمكن ترك خيار فارغاً','error');return;}
    const {error}=await db.from('polls').update({options:newOpts}).eq('id',pollId);
    if(error){toast('خطأ في الحفظ','error');return;}
    closeModal('poll-opts-modal');toast('تم تحديث الخيارات ✓','success');
    if(expandedId)renderBody(expandedId);
  };
  openModal('poll-opts-modal');
}

// ═══════════════════════════════════════════════════════════════
// ★ FEATURE 1: THREADED REPLIES
// ═══════════════════════════════════════════════════════════════

// ── COMMENTS ──
function buildCommentsHTML(tid,comments){
  const isArchived=!!viewingArchiveId;
  // Separate root comments (parent_id = null) from replies
  const roots = comments.filter(c=>!c.parent_id);
  // Build replies map
  const repliesMap = {};
  comments.filter(c=>c.parent_id).forEach(c=>{
    if(!repliesMap[c.parent_id])repliesMap[c.parent_id]=[];
    repliesMap[c.parent_id].push(c);
  });
  let h=`<div class="comments-section">
    <div class="comments-header">
      <div class="comments-title">التعليقات ${!isArchived?'<span class="rt-pulse"></span>':''}</div>
      <div class="comments-count-badge" id="cc-${tid}">${comments.length}</div>
    </div>
    <div id="cl-${tid}">`;
  if(!roots.length)h+=`<div class="no-comments">${isArchived?'لا توجد تعليقات في هذا الموضوع المؤرشف':'لا توجد تعليقات بعد — كن أول المشاركين ✍️'}</div>`;
  else roots.forEach(c=>{
    h+=buildCItem(c,false);
    // Replies (collapsed by default)
    const replies = repliesMap[c.id]||[];
    if(replies.length){
      h+=`<div class="replies-toggle" id="rt-${c.id}" onclick="toggleReplies('${c.id}')">
        <span class="replies-toggle-arrow" id="rta-${c.id}">▶</span>
        عرض ${replies.length} رد
      </div>
      <div class="replies-container hidden" id="rc-${c.id}">`;
      replies.forEach(r=>{h+=buildCItem(r,true);});
      h+=`</div>`;
    } else if(!isArchived){
      // Show empty reply container so new replies append here
      h+=`<div class="replies-container hidden" id="rc-${c.id}"></div>`;
    }
  });
  h+=`</div>`;
  if(!isArchived){
    const cool=coolLeft(tid);
    h+=`<div class="cform-wrap">
      <div id="reply-indicator-${tid}" class="reply-indicator hidden">
        <span id="reply-to-label-${tid}"></span>
        <button onclick="cancelReply('${tid}')" class="cancel-reply-btn">✕ إلغاء</button>
      </div>
      <div class="cform-row">
        <textarea class="cform-textarea" id="ctf-${tid}" placeholder="شارك رأيك أو سؤالك…" maxlength="500"></textarea>
        <button class="btn btn-primary" id="cb-${tid}" onclick="postComment('${tid}')" ${cool>0?'disabled':''}>إرسال</button>
      </div>
      <div class="cooldown-bar" id="cdb-${tid}" style="${cool>0?'display:block':''}"><div class="cooldown-fill" id="cdf-${tid}" style="width:${cool>0?Math.round((cool/60)*100):0}%"></div></div>
      <div class="cooldown-txt" id="cdt-${tid}">${cool>0?'انتظر '+cool+' ثانية':''}</div>
    </div>`;
  } else {
    h+=`<div class="archive-notice">📦 هذه الجلسة مؤرشفة — لا يمكن إضافة تعليقات جديدة</div>`;
  }
  h+=`</div>`;
  return h;
}

// Track reply state per topic
const replyTargets = {}; // { tid: { parentId, parentName } }

function setReplyTarget(tid, parentId, parentName){
  replyTargets[tid] = {parentId, parentName};
  const ind = document.getElementById('reply-indicator-'+tid);
  const lbl = document.getElementById('reply-to-label-'+tid);
  if(ind) ind.classList.remove('hidden');
  if(lbl) lbl.textContent = `↩ ردّ على: ${parentName}`;
  const ta = document.getElementById('ctf-'+tid);
  if(ta){ ta.focus(); ta.placeholder='اكتب ردّك…'; }
}
function cancelReply(tid){
  delete replyTargets[tid];
  const ind = document.getElementById('reply-indicator-'+tid);
  if(ind) ind.classList.add('hidden');
  const ta = document.getElementById('ctf-'+tid);
  if(ta) ta.placeholder = 'شارك رأيك أو سؤالك…';
}
function toggleReplies(parentId){
  const rc = document.getElementById('rc-'+parentId);
  const arrow = document.getElementById('rta-'+parentId);
  const toggle = document.getElementById('rt-'+parentId);
  if(!rc) return;
  const hidden = rc.classList.toggle('hidden');
  if(arrow) arrow.textContent = hidden ? '▶' : '▼';
  if(toggle){
    const count = rc.querySelectorAll('.comment-item').length;
    toggle.innerHTML = `<span class="replies-toggle-arrow" id="rta-${parentId}">${hidden?'▶':'▼'}</span> ${hidden?'عرض':'إخفاء'} ${count} رد`;
  }
}

function buildCItem(c, isReply=false){
  const name=c.user_name||c.user_id;
  const isMe=c.user_id===UID;
  const isAdminC=c.is_admin;
  const time=new Date(c.created_at).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
  const badges=(isMe?'<span class="c-you-badge">أنت</span>':'')+(isAdminC?'<span class="c-admin-badge">مشرف</span>':'');
  const adminActs=isAdmin&&!viewingArchiveId?`<div class="c-admin-acts">
    <button class="btn btn-ghost btn-sm" onclick="editComment('${c.id}','${c.topic_id}')">✏️</button>
    <button class="btn btn-danger btn-sm" onclick="deleteComment('${c.id}','${c.topic_id}')">🗑</button>
  </div>`:'';
  const replyToTag = isReply && c.reply_to_name
    ? `<span class="reply-to-tag">@${esc(c.reply_to_name)}</span> `
    : '';
  // Reply button (only on root comments, not replies)
  const replyBtn = !isReply && !viewingArchiveId
    ? `<button class="c-reply-btn" onclick="setReplyTarget('${c.topic_id}','${c.id}','${esc(name)}')">↩ ردّ</button>`
    : '';
  // Reactions
  const reactionsHTML = buildReactionsHTML(c.id, 'comment');
  return `<div class="comment-item${isReply?' is-reply':''}" id="ci-${c.id}">
    <div class="c-av ${avc(name)}">${ini(name)}</div>
    <div class="c-body">
      <div class="c-name">${esc(name)}${badges}</div>
      <div class="c-text">${replyToTag}${esc(c.content)}</div>
      <div class="c-footer-row">
        <div class="c-time">${time}</div>
        ${replyBtn}
        ${adminActs}
      </div>
      ${reactionsHTML}
    </div>
  </div>`;
}

function setupCooldown(tid){if(coolLeft(tid)>0)startCooldown(tid);}
function coolLeft(tid){const l=lastComment[tid];if(!l)return 0;return Math.max(0,60-Math.floor((Date.now()-l)/1000));}
function startCooldown(tid){
  const iv=setInterval(()=>{
    const left=coolLeft(tid);
    const btn=document.getElementById('cb-'+tid);
    const bar=document.getElementById('cdb-'+tid);
    const fill=document.getElementById('cdf-'+tid);
    const txt=document.getElementById('cdt-'+tid);
    if(left<=0){clearInterval(iv);if(btn)btn.disabled=false;if(bar)bar.style.display='none';if(txt)txt.textContent='';}
    else{if(btn)btn.disabled=true;if(bar)bar.style.display='block';if(fill)fill.style.width=Math.round((left/60)*100)+'%';if(txt)txt.textContent='انتظر '+left+' ثانية قبل التعليق مجدداً';}
  },1000);
}
async function postComment(tid){
  if(!dname()){toast('يرجى إدخال اسمك أولاً','error');return;}
  const inp=document.getElementById('ctf-'+tid);
  const content=inp.value.trim();if(!content)return;
  if(coolLeft(tid)>0){toast('انتظر قبل التعليق مجدداً','error');return;}
  const btn=document.getElementById('cb-'+tid);if(btn)btn.disabled=true;
  const replyInfo = replyTargets[tid];
  const insertData = {
    topic_id:tid,user_id:UID,user_name:dname(),content,is_admin:isAdmin,
    parent_id: replyInfo ? replyInfo.parentId : null,
    reply_to_name: replyInfo ? replyInfo.parentName : null
  };
  const {data,error}=await db.from('comments').insert(insertData).select().single();
  if(error){toast('خطأ في إرسال التعليق','error');if(btn)btn.disabled=false;return;}
  lastComment[tid]=Date.now();inp.value='';startCooldown(tid);
  cancelReply(tid);
  appendComment(tid,data,true);
  loadMeta(tid);loadStats();
  toast('تم إرسال التعليق ✓','success');
}
function appendComment(tid,c,scrollTo=false){
  if(c.parent_id){
    // It's a reply — append to the replies container
    let rc = document.getElementById('rc-'+c.parent_id);
    if(!rc){
      // Create replies container if missing
      const parentEl = document.getElementById('ci-'+c.parent_id);
      if(parentEl){
        const wrap = document.createElement('div');
        wrap.id = 'rc-'+c.parent_id;
        wrap.className = 'replies-container';
        parentEl.insertAdjacentElement('afterend', wrap);
        // Add toggle button
        const toggle = document.createElement('div');
        toggle.className = 'replies-toggle';
        toggle.id = 'rt-'+c.parent_id;
        toggle.onclick = ()=>toggleReplies(c.parent_id);
        toggle.innerHTML = `<span class="replies-toggle-arrow" id="rta-${c.parent_id}">▼</span> عرض 1 رد`;
        parentEl.insertAdjacentElement('afterend', toggle);
        rc = wrap;
      }
    }
    if(rc){
      const div=document.createElement('div');div.innerHTML=buildCItem(c,true);
      const el=div.firstElementChild;
      rc.appendChild(el);
      rc.classList.remove('hidden'); // show replies when a new one comes in
      // Update toggle count
      const toggle = document.getElementById('rt-'+c.parent_id);
      if(toggle){
        const count = rc.querySelectorAll('.comment-item').length;
        const arrow = document.getElementById('rta-'+c.parent_id);
        toggle.innerHTML = `<span class="replies-toggle-arrow" id="rta-${c.parent_id}">${arrow?.textContent||'▼'}</span> ${count} رد`;
      }
      if(scrollTo)el.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  } else {
    const list=document.getElementById('cl-'+tid);if(!list)return;
    const empty=list.querySelector('.no-comments');if(empty)empty.remove();
    const div=document.createElement('div');div.innerHTML=buildCItem(c,false);
    const el=div.firstElementChild;
    // Also add an empty replies container after it
    const rcDiv = document.createElement('div');
    rcDiv.id = 'rc-'+c.id;
    rcDiv.className = 'replies-container hidden';
    list.appendChild(el);
    list.appendChild(rcDiv);
    if(scrollTo)el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  const cc=document.getElementById('cc-'+tid);if(cc)cc.textContent=parseInt(cc.textContent||0)+1;
}

// ═══════════════════════════════════════════════════════════════
// ★ FEATURE 2: EMOJI REACTIONS
// ═══════════════════════════════════════════════════════════════

async function loadReactionsForTargets(targetIds){
  if(!targetIds.length) return;
  const {data} = await db.from('reactions').select('*').in('target_id', targetIds);
  targetIds.forEach(tid=>{ reactionsCache[tid] = {__mine: null}; });
  (data||[]).forEach(r=>{
    if(!reactionsCache[r.target_id]) reactionsCache[r.target_id] = {__mine: null};
    reactionsCache[r.target_id][r.emoji] = (reactionsCache[r.target_id][r.emoji]||0)+1;
    if(r.user_id === UID) reactionsCache[r.target_id].__mine = r.emoji;
  });
}

function buildReactionsHTML(targetId, targetType){
  const cache = reactionsCache[targetId]||{};
  const mine = cache.__mine;

  // Only show emojis that have at least one reaction
  const activeEmojis = REACTION_EMOJIS.filter(e => (cache[e]||0) > 0);

  let html = `<div class="reactions-row" id="rxrow-${targetId}">`;

  // Render only active reactions
  activeEmojis.forEach(emoji=>{
    const count = cache[emoji]||0;
    const active = mine === emoji ? ' rx-active' : '';
    html += `<button class="rx-btn${active}" onclick="toggleReaction('${targetId}','${targetType}','${emoji}')" title="${emoji}">
      ${emoji}<span class="rx-count">${count}</span>
    </button>`;
  });

  // The "add reaction" button — shows picker on hover
  if(!viewingArchiveId){
    html += `<div class="rx-add-wrap">
      <button class="rx-add-btn" title="أضف تفاعلاً">😊 <span class="rx-add-plus">+</span></button>
      <div class="rx-picker" id="rxp-${targetId}">
        ${REACTION_EMOJIS.map(e=>`<button class="rx-pick-opt${mine===e?' rx-active':''}" onclick="toggleReaction('${targetId}','${targetType}','${e}')" title="${e}">${e}</button>`).join('')}
      </div>
    </div>`;
  }

  html += '</div>';
  return html;
}

async function toggleReaction(targetId, targetType, emoji){
  if(!dname()){toast('أدخل اسمك أولاً','error');return;}
  if(!reactionsCache[targetId]) reactionsCache[targetId]={__mine:null};
  const cache = reactionsCache[targetId];
  const mine = cache.__mine;
  if(mine === emoji){
    // Remove reaction
    await db.from('reactions').delete().eq('target_id',targetId).eq('user_id',UID);
    cache[emoji] = Math.max(0,(cache[emoji]||1)-1);
    cache.__mine = null;
  } else {
    if(mine){
      // Remove old reaction first
      await db.from('reactions').delete().eq('target_id',targetId).eq('user_id',UID);
      cache[mine] = Math.max(0,(cache[mine]||1)-1);
    }
    // Add new reaction
    const {error} = await db.from('reactions').upsert({target_id:targetId,target_type:targetType,user_id:UID,emoji});
    if(error){toast('خطأ في التفاعل','error');return;}
    cache[emoji] = (cache[emoji]||0)+1;
    cache.__mine = emoji;
  }
  // Re-render the reactions row
  const row = document.getElementById('rxrow-'+targetId);
  if(row){
    const div = document.createElement('div');
    div.innerHTML = buildReactionsHTML(targetId, targetType);
    row.replaceWith(div.firstChild);
  }
}

function refreshReactionsRow(targetId, targetType){
  const row = document.getElementById('rxrow-'+targetId);
  if(row){
    const div = document.createElement('div');
    div.innerHTML = buildReactionsHTML(targetId, targetType);
    row.replaceWith(div.firstChild);
  }
}

// ═══════════════════════════════════════════════════════════════
// ★ FEATURE 3: ATTENDANCE
// ═══════════════════════════════════════════════════════════════

function buildAttendanceWidget(tid){
  if(!isAdmin) return '';
  return `<!--<div class="attendance-widget" id="aw-${tid}">
    <div class="aw-inner">
      <div class="aw-text">
        <span class="aw-icon">👥</span>
        <div>
          <div class="aw-title">الحضور في هذه الجلسة</div>
          <div class="aw-sub" id="aw-count-${tid}">جارٍ التحميل…</div>
        </div>
      </div>
      <div class="aw-actions" id="aw-actions-${tid}">
        <div class="ldots"><span></span><span></span><span></span></div>
      </div>
    </div>
    <button class="btn btn-sm btn-ghost" style="margin-top:8px;font-size:11px" onclick="openAttendanceModal('${tid}')">👁 عرض قائمة الحضور</button>
  </div>-->`;
}

async function initAttendanceWidget(tid){
  const countEl = document.getElementById('aw-count-'+tid);
  const actionsEl = document.getElementById('aw-actions-'+tid);
  if(!countEl||!actionsEl) return;
  const {count} = await db.from('attendance').select('*',{count:'exact',head:true}).eq('session_id','live');
  countEl.textContent = `${count||0} مشارك مسجّل`;
  // Since presence is auto-registered on entry, just show status
  if(myAttendance){
    actionsEl.innerHTML = `<!--<span class="aw-checked-badge">✅ مسجّل الحضور</span>-->`;
  } else {
    // Fallback in case auto-register failed
    actionsEl.innerHTML = `<button class="btn btn-primary btn-sm" onclick="checkIn('${tid}')">✋ تسجيل حضوري</button>`;
  }
}

async function checkIn(tid){
  if(!dname()){toast('أدخل اسمك أولاً','error');return;}
  const {error} = await db.from('attendance').upsert({
    session_id:'live', user_id:UID, user_name:dname(), checked_in_at:new Date().toISOString()
  });
  if(error){toast('خطأ في تسجيل الحضور','error');return;}
  myAttendance = true;
  sessionStorage.setItem('b_attended','1');
  const actionsEl = document.getElementById('aw-actions-'+tid);
  if(actionsEl) actionsEl.innerHTML=`<!--<span class="aw-checked-badge">✅ مسجّل الحضور</span>-->`;
  // Update count
  const {count} = await db.from('attendance').select('*',{count:'exact',head:true}).eq('session_id','live');
  const countEl = document.getElementById('aw-count-'+tid);
  if(countEl) countEl.textContent = `${count||0} مشارك مسجّل الحضور`;
  loadAttendanceMeta(tid);
  toast('✅ تم تسجيل حضورك!','success');
}

// Attendance modal
async function openAttendanceModal(tid){
  // Build modal content dynamically
  let modal = document.getElementById('attendance-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'attendance-modal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `<div class="modal-card" style="max-width:480px;max-height:80vh;overflow-y:auto">
      <div class="modal-title">👥 الحضور</div>
      <div id="attendance-modal-body"></div>
      <div class="modal-btns">
        ${isAdmin?`<button class="btn btn-danger btn-sm" onclick="resetAttendance()">🗑 إعادة تعيين الحضور</button>`:''}
        <button class="btn btn-ghost" onclick="closeModal('attendance-modal')">إغلاق</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
  }
  openModal('attendance-modal');
  const body = document.getElementById('attendance-modal-body');
  body.innerHTML = '<div class="state-empty"><div class="ldots"><span></span><span></span><span></span></div></div>';
  const {data} = await db.from('attendance').select('*').eq('session_id','live').order('checked_in_at',{ascending:true});
  if(!data||!data.length){
    body.innerHTML='<div class="state-empty">لا يوجد حضور مسجّل بعد</div>';
    return;
  }
  let html = `<div class="att-count-banner">${data.length} مشارك مسجّل الحضور</div><div class="att-list">`;
  data.forEach((a,i)=>{
    const time = new Date(a.checked_in_at).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
    html+=`<div class="att-item">
      <div class="c-av ${avc(a.user_name)}" style="width:30px;height:30px;font-size:11px">${ini(a.user_name)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--text)">${esc(a.user_name)}</div>
        <div style="font-size:11px;color:var(--text3)">${time}</div>
      </div>
      <span style="font-size:11px;color:var(--text3)">#${i+1}</span>
    </div>`;
  });
  html+=`</div>`;
  body.innerHTML=html;
}

async function resetAttendance(){
  showConfirm('إعادة تعيين الحضور','سيُحذف جميع سجلات الحضور للجلسة الحالية.',async()=>{
    await db.from('attendance').delete().eq('session_id','live');
    myAttendance=false;sessionStorage.removeItem('b_attended');
    toast('تم إعادة تعيين الحضور','success');
    closeModal('attendance-modal');
    if(expandedId) renderBody(expandedId);
    topics.forEach(t=>loadAttendanceMeta(t.id));
    loadPresencePanel();
  },'إعادة التعيين','btn-danger');
}

async function loadPresencePanel(){
  const listEl = document.getElementById('presence-list');
  const countEl = document.getElementById('presence-count-banner');
  if(!listEl||!countEl) return;
  listEl.innerHTML='<div class="state-empty"><div class="ldots"><span></span><span></span><span></span></div></div>';
  const {data,count} = await db.from('attendance').select('*',{count:'exact'}).eq('session_id','live').order('checked_in_at',{ascending:true});
  countEl.textContent = `${count||0} مشارك في الجلسة`;
  if(!data||!data.length){
    listEl.innerHTML='<div style="font-size:12px;color:var(--text3);text-align:center;padding:12px 0">لا يوجد مشاركون بعد</div>';
    return;
  }
  let html='<div class="presence-list-inner">';
  data.forEach((a,i)=>{
    const time = new Date(a.checked_in_at).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
    html+=`<div class="presence-item">
      <div class="c-av ${avc(a.user_name)}" style="width:28px;height:28px;font-size:10px">${ini(a.user_name)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.user_name)}</div>
        <div style="font-size:10px;color:var(--text3)">دخل ${time}</div>
      </div>
      <span style="font-size:10px;color:var(--text3);flex-shrink:0">#${i+1}</span>
    </div>`;
  });
  html+='</div>';
  listEl.innerHTML=html;
}

// ═══════════════════════════════════════════════════════════════
// ★ FEATURE 4: SHARED LINKS
// ═══════════════════════════════════════════════════════════════

// OG Fetch via public proxy (allorigins)
async function fetchOGData(url){
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const json = await res.json();
    const html = json.contents||'';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html,'text/html');
    const getMeta = (prop)=>{
      const el = doc.querySelector(`meta[property="${prop}"]`) || doc.querySelector(`meta[name="${prop}"]`);
      return el ? el.getAttribute('content')||'' : '';
    };
    const title = getMeta('og:title')||doc.title||url;
    const desc  = getMeta('og:description')||getMeta('description')||'';
    const image = getMeta('og:image')||'';
    const site  = getMeta('og:site_name')||new URL(url).hostname;
    return {title:title.slice(0,120), desc:desc.slice(0,200), image:image.slice(0,500), site:site.slice(0,80)};
  } catch(e){
    try{return {title:new URL(url).hostname,desc:'',image:'',site:new URL(url).hostname};}
    catch{return {title:url,desc:'',image:'',site:''};}
  }
}

let pendingLinkFetch = {}; // { tid: url }

function toggleLinkForm(tid){
  const wrap = document.getElementById('lp-form-'+tid);
  if(!wrap) return;
  wrap.classList.toggle('hidden');
  if(!wrap.classList.contains('hidden')){
    const inp = document.getElementById('lp-url-'+tid);
    if(inp) inp.focus();
  }
}

function buildLinkFormHTML(tid){
  return `<div class="lp-form-wrap">
    <button class="lp-toggle-btn btn btn-ghost btn-sm" onclick="toggleLinkForm('${tid}')">🔗 مشاركة رابط</button>
    <div class="lp-form hidden" id="lp-form-${tid}">
      <input class="finput" id="lp-url-${tid}" type="url" placeholder="https://…" style="margin-bottom:8px" oninput="clearLPPreview('${tid}')" onkeydown="if(event.key==='Enter')submitLinkPost('${tid}')">
      <div id="lp-preview-${tid}" class="lp-preview hidden"></div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="btn btn-ghost btn-sm" onclick="previewLink('${tid}')">👁 معاينة</button>
        <button class="btn btn-primary btn-sm" id="lp-submit-${tid}" onclick="submitLinkPost('${tid}')">📤 نشر الرابط</button>
      </div>
    </div>
  </div>`;
}

function clearLPPreview(tid){
  const prev = document.getElementById('lp-preview-'+tid);
  if(prev){ prev.classList.add('hidden'); prev.innerHTML=''; }
}
async function previewLink(tid){
  const inp = document.getElementById('lp-url-'+tid);
  if(!inp) return;
  const url = inp.value.trim();
  if(!url){ toast('أدخل رابطاً أولاً','error'); return; }
  const prev = document.getElementById('lp-preview-'+tid);
  if(!prev) return;
  prev.innerHTML='<div class="ldots" style="padding:12px 0"><span></span><span></span><span></span></div>';
  prev.classList.remove('hidden');
  const og = await fetchOGData(url);
  pendingLinkFetch[tid] = {url, ...og};
  prev.innerHTML = buildLinkCardHTML({url, og_title:og.title, og_desc:og.desc, og_image:og.image, og_site:og.site});
}

async function submitLinkPost(tid){
  if(!dname()){toast('أدخل اسمك أولاً','error');return;}
  const inp = document.getElementById('lp-url-'+tid);
  if(!inp) return;
  const url = inp.value.trim();
  if(!url){toast('أدخل رابطاً صالحاً','error');return;}
  const btn = document.getElementById('lp-submit-'+tid);
  if(btn) btn.disabled = true;
  let og = pendingLinkFetch[tid];
  if(!og || og.url !== url){
    og = await fetchOGData(url);
    og.url = url;
  }
  const {data, error} = await db.from('link_posts').insert({
    topic_id:tid, user_id:UID, user_name:dname(), is_admin:isAdmin,
    url, og_title:og.title||'', og_desc:og.desc||'', og_image:og.image||'', og_site:og.site||''
  }).select().single();
  if(error){toast('خطأ في نشر الرابط','error');if(btn)btn.disabled=false;return;}
  inp.value='';
  delete pendingLinkFetch[tid];
  clearLPPreview(tid);
  document.getElementById('lp-form-'+tid)?.classList.add('hidden');
  // Append to DOM
  appendLinkPost(tid, data);
  toast('تم نشر الرابط ✓','success');
  if(btn) btn.disabled=false;
}

async function buildLinkPostHTML(lp){
  const isArchived = !!viewingArchiveId;
  const name = lp.user_name||lp.user_id;
  const time = new Date(lp.created_at).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
  const adminActs = isAdmin&&!isArchived ? `<div class="c-admin-acts">
    <button class="btn btn-danger btn-sm" onclick="deleteLinkPost('${lp.id}','${lp.topic_id}')">🗑 حذف</button>
  </div>` : '';
  return `<div class="link-post-item" id="lp-${lp.id}">
    <div class="lp-header">
      <div class="c-av ${avc(name)}" style="width:28px;height:28px;font-size:10px;flex-shrink:0">${ini(name)}</div>
      <div style="flex:1;min-width:0">
        <div class="c-name" style="font-size:12px">${esc(name)}${lp.is_admin?'<span class="c-admin-badge">مشرف</span>':''}<span class="c-time" style="margin-right:6px">${time}</span></div>
      </div>
      ${adminActs}
    </div>
    ${buildLinkCardHTML(lp)}
  </div>`;
}

function buildLinkCardHTML(lp){
  const hasImage = lp.og_image && lp.og_image.startsWith('http');
  return `<a class="link-card" href="${esc(lp.url)}" target="_blank" rel="noopener noreferrer">
    ${hasImage?`<div class="lc-image" style="background-image:url('${esc(lp.og_image)}')"></div>`:''}
    <div class="lc-body">
      ${lp.og_site?`<div class="lc-site">${esc(lp.og_site)}</div>`:''}
      <div class="lc-title">${esc(lp.og_title||lp.url)}</div>
      ${lp.og_desc?`<div class="lc-desc">${esc(lp.og_desc)}</div>`:''}
      <div class="lc-url">${esc(lp.url)}</div>
    </div>
  </a>`;
}

function appendLinkPost(tid, lp){
  // Insert before comments section
  const commSec = document.getElementById('tbi-'+tid)?.querySelector('.comments-section');
  if(!commSec) return;
  const div = document.createElement('div');
  div.innerHTML = buildLinkPostHTML(lp); // sync enough for append
  buildLinkPostHTML(lp).then ? buildLinkPostHTML(lp).then(html=>{div.innerHTML=html;commSec.insertAdjacentElement('beforebegin',div.firstChild);}) : commSec.insertAdjacentElement('beforebegin', div.firstChild);
}

function deleteLinkPost(lpId, tid){
  showConfirm('حذف الرابط','حذف هذا الرابط؟',async()=>{
    await db.from('link_posts').delete().eq('id',lpId);
    document.getElementById('lp-'+lpId)?.remove();
    toast('تم الحذف','success');
  });
}

// ── ARCHIVE ──
async function loadArchiveSessions(){
  const {data}=await db.from('archive_sessions').select('*').order('archived_at',{ascending:false});
  archiveSessions=data||[];
}
async function loadAdminArchiveList(){
  await loadArchiveSessions();
  const el=document.getElementById('admin-archive-list');if(!el)return;
  if(!archiveSessions.length){el.innerHTML='<div style="font-size:12px;color:var(--text3)">لا توجد جلسات مؤرشفة بعد</div>';return;}
  let html='';
  archiveSessions.forEach(s=>{
    const d=new Date(s.archived_at);
    const dateStr=d.toLocaleDateString('ar-DZ',{month:'short',day:'numeric',year:'numeric'});
    html+=`<div class="archive-list-item">
      <div>
        <div class="ali-name">${esc(s.name)}</div>
        <div class="ali-date">${dateStr} · ${s.topic_count||0} مواضيع · ${s.comment_count||0} تعليق</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="loadArchiveSession('${s.id}');closeModal&&closeModal()">👁</button>
        <button class="btn btn-danger btn-sm" onclick="deleteArchiveSession('${s.id}')">🗑</button>
      </div>
    </div>`;
  });
  el.innerHTML=html;
}
async function openArchiveView(){
  await loadArchiveSessions();
  const listEl=document.getElementById('archive-modal-list');
  if(!archiveSessions.length){
    listEl.innerHTML='<div class="state-empty"><span class="icon">📭</span>لا توجد جلسات مؤرشفة بعد</div>';
    openModal('view-archive-modal');return;
  }
  let html='';
  archiveSessions.forEach(s=>{
    const d=new Date(s.archived_at);
    const dateStr=d.toLocaleDateString('ar-DZ',{year:'numeric',month:'long',day:'numeric'});
    html+=`<div class="archive-list-item" style="margin-bottom:8px;cursor:pointer" onclick="loadArchiveSession('${s.id}');closeModal('view-archive-modal')">
      <div>
        <div class="ali-name">${esc(s.name)}</div>
        <div class="ali-date">${dateStr} · ${s.comment_count||0} تعليق · ${s.poll_count||0} استطلاع · ${s.vote_count||0} تصويت</div>
      </div>
      <span style="font-size:18px">›</span>
    </div>`;
  });
  listEl.innerHTML=html;
  openModal('view-archive-modal');
}
async function loadArchiveSession(archiveId){
  viewingArchiveId=archiveId;expandedId=null;
  const {data:arTopics}=await db.from('archive_topics').select('*').eq('session_id',archiveId).order('original_created_at',{ascending:true});
  const {data:arPolls}=await db.from('archive_polls').select('*').eq('session_id',archiveId);
  const {data:arComments}=await db.from('archive_comments').select('*').eq('session_id',archiveId).order('original_created_at',{ascending:true});
  const {data:arVotes}=await db.from('archive_votes').select('*').eq('session_id',archiveId);
  topics=(arTopics||[]).map(t=>({
    id:'arc_'+t.id,title:t.title,description:t.description,is_active:false,
    _archive_id:t.id,
    _polls:(arPolls||[]).filter(p=>p.topic_id===t.id).map(p=>({
      ...p,id:'arc_'+p.id,
      _votes:(arVotes||[]).filter(v=>v.poll_id===p.id)
    })),
    _comments:(arComments||[]).filter(c=>c.topic_id===t.id).map(c=>({...c,id:'arc_'+c.id,created_at:c.original_created_at}))
  }));
  const sess=archiveSessions.find(s=>s.id===archiveId);
  document.getElementById('st-topics').textContent=topics.length;
  document.getElementById('st-comments').textContent=(arComments||[]).length;
  document.getElementById('st-polls').textContent=(arPolls||[]).length;
  document.getElementById('st-votes').textContent=(arVotes||[]).length;
  document.getElementById('live-row-banner').style.display='none';
  document.getElementById('active-topic-banner').innerHTML='';
  document.getElementById('back-live-btn').style.display='flex';
  document.getElementById('brand-sub-txt').textContent='📦 عرض أرشيف: '+(sess?.name||'');
  document.getElementById('brand-sub-txt').className='brand-sub archived-mode';
  document.getElementById('stats-label').textContent='إحصائيات الأرشيف';
  document.getElementById('stats-note').textContent='هذه الجلسة مؤرشفة — للاطلاع فقط، لا يمكن التعليق أو التصويت.';
  if(sess){
    const d=new Date(sess.archived_at);
    const dateStr=d.toLocaleDateString('ar-DZ',{year:'numeric',month:'long',day:'numeric'});
    document.getElementById('archive-view-banner').innerHTML=`
      <div class="archive-view-banner">
        <div class="archive-view-banner-left">
          <div class="archive-view-icon">📦</div>
          <div>
            <div class="archive-view-name">${esc(sess.name)}</div>
            <div class="archive-view-date">أُرشفت بتاريخ ${dateStr}</div>
          </div>
        </div>
        <div class="archive-view-stats">
          <span class="archive-stat-chip">📝 ${sess.topic_count||0} موضوع</span>
          <span class="archive-stat-chip">💬 ${sess.comment_count||0} تعليق</span>
          <span class="archive-stat-chip">🗳 ${sess.vote_count||0} تصويت</span>
        </div>
      </div>`;
  }
  renderTopics(true);
}
function goBackToLive(){
  viewingArchiveId=null;expandedId=null;
  document.getElementById('live-row-banner').style.display='flex';
  document.getElementById('archive-view-banner').innerHTML='';
  document.getElementById('back-live-btn').style.display='none';
  document.getElementById('brand-sub-txt').textContent=boardConfig.header_sub;
  document.getElementById('brand-sub-txt').className='brand-sub';
  document.getElementById('stats-label').textContent='إحصائيات الجلسة';
  document.getElementById('stats-note').textContent='يمكنك التعليق مرة كل دقيقة، والتصويت مرة واحدة لكل استطلاع. يمكنك معاينة نتائج الاستطلاع قبل التصويت.';
  loadTopics();
}
async function renderArchiveBody(virtualId){
  const inner=document.getElementById('tbi-'+virtualId);if(!inner)return;
  const t=topics.find(x=>x.id===virtualId);
  if(!t){inner.innerHTML='<div class="state-empty">خطأ</div>';return;}
  let html='';
  for(const p of(t._polls||[])){
    const isMulti = p.poll_type === 'multi';
    const uniqueVoters = isMulti
      ? [...new Set(p._votes.map(v=>v.user_id))].length
      : p._votes.length;
    const counts=p.options.map((_,i)=>p._votes.filter(v=>v.option_index===i).length);
    html+=buildPollMarkup(p,p.options,counts,uniqueVoters,false,[],false);
  }
  html+=buildCommentsHTML(virtualId,t._comments||[]);
  inner.innerHTML=html;
}
async function doArchiveSession(){
  const name=document.getElementById('archive-session-name').value.trim();
  if(!name){shake('archive-session-name');toast('أدخل اسم الجلسة','error');return;}
  const [{data:liveTopics},{data:livePolls},{data:liveComments},{data:liveVotes}]=await Promise.all([
    db.from('topics').select('*').order('created_at',{ascending:true}),
    db.from('polls').select('*').order('created_at',{ascending:true}),
    db.from('comments').select('*').order('created_at',{ascending:true}),
    db.from('poll_votes').select('*')
  ]);
  const {data:sess,error:sessErr}=await db.from('archive_sessions').insert({
    name,
    topic_count:(liveTopics||[]).length,
    comment_count:(liveComments||[]).length,
    poll_count:(livePolls||[]).length,
    vote_count:(liveVotes||[]).length,
    archived_at:new Date().toISOString()
  }).select().single();
  if(sessErr){toast('خطأ في إنشاء الأرشيف','error');return;}
  const sid=sess.id;
  if(liveTopics?.length){
    await db.from('archive_topics').insert(liveTopics.map(t=>({
      session_id:sid,title:t.title,description:t.description||null,original_id:t.id,original_created_at:t.created_at
    })));
  }
  const {data:arTopics}=await db.from('archive_topics').select('id,original_id').eq('session_id',sid);
  const topicMap={};(arTopics||[]).forEach(t=>{topicMap[t.original_id]=t.id;});
  if(livePolls?.length){
    await db.from('archive_polls').insert(livePolls.map(p=>({
      session_id:sid,topic_id:topicMap[p.topic_id]||null,question:p.question,options:p.options,
      poll_type:p.poll_type||'single',
      original_id:p.id,original_created_at:p.created_at
    })));
  }
  const {data:arPolls}=await db.from('archive_polls').select('id,original_id').eq('session_id',sid);
  const pollMap={};(arPolls||[]).forEach(p=>{pollMap[p.original_id]=p.id;});
  if(liveComments?.length){
    await db.from('archive_comments').insert(liveComments.map(c=>({
      session_id:sid,topic_id:topicMap[c.topic_id]||null,user_id:c.user_id,user_name:c.user_name,content:c.content,is_admin:c.is_admin,original_id:c.id,original_created_at:c.created_at
    })));
  }
  if(liveVotes?.length){
    await db.from('archive_votes').insert(liveVotes.map(v=>({
      session_id:sid,poll_id:pollMap[v.poll_id]||null,user_id:v.user_id,option_index:v.option_index,original_id:v.id,original_created_at:v.created_at
    })));
  }
  await Promise.all([
    db.from('poll_votes').delete().neq('id','00000000-0000-0000-0000-000000000000'),
    db.from('comments').delete().neq('id','00000000-0000-0000-0000-000000000000')
  ]);
  await db.from('polls').delete().neq('id','00000000-0000-0000-0000-000000000000');
  await db.from('topics').delete().neq('id','00000000-0000-0000-0000-000000000000');
  closeModal('archive-modal');
  document.getElementById('archive-session-name').value='';
  toast('📦 تمت الأرشفة بنجاح! جلسة جديدة جاهزة','archive');
  await loadArchiveSessions();await loadTopics();loadAdminArchiveList();
}
async function deleteArchiveSession(sid){
  showConfirm('حذف الأرشيف','سيُحذف هذا الأرشيف نهائياً ولا يمكن التراجع.',async()=>{
    await Promise.all([
      db.from('archive_votes').delete().eq('session_id',sid),
      db.from('archive_comments').delete().eq('session_id',sid)
    ]);
    await db.from('archive_polls').delete().eq('session_id',sid);
    await db.from('archive_topics').delete().eq('session_id',sid);
    await db.from('archive_sessions').delete().eq('id',sid);
    toast('تم حذف الأرشيف','success');
    await loadArchiveSessions();loadAdminArchiveList();
    if(viewingArchiveId===sid)goBackToLive();
  },'حذف نهائياً','btn-danger');
}

// ── ADMIN CRUD ──
async function addTopic(){
  const title=document.getElementById('new-title').value.trim();
  const desc=document.getElementById('new-desc').value.trim();
  if(!title){toast('أدخل عنوان الموضوع','error');return;}
  const {error}=await db.from('topics').insert({title,description:desc||null,is_active:false});
  if(error){toast('خطأ في الإضافة','error');return;}
  document.getElementById('new-title').value='';document.getElementById('new-desc').value='';
  toast('تمت إضافة الموضوع ✓','success');
  await loadTopics();populatePollSel();
}
async function addPoll(){
  const tid=document.getElementById('poll-tsel').value;
  const q=document.getElementById('poll-q').value.trim();
  const opts=[...document.querySelectorAll('.pov')].map(i=>i.value.trim()).filter(Boolean);
  if(!tid){toast('اختر موضوعاً','error');return;}
  if(!q){toast('أدخل سؤال الاستطلاع','error');return;}
  if(opts.length<2){toast('أضف خيارين على الأقل','error');return;}
  const {error}=await db.from('polls').insert({topic_id:tid,question:q,options:opts,poll_type:newPollType});
  if(error){toast('خطأ في إنشاء الاستطلاع','error');return;}
  document.getElementById('poll-q').value='';
  document.querySelectorAll('.pov').forEach(i=>i.value='');
  setPollType('single');
  const typeLabel = newPollType === 'multi' ? 'متعدد الخيارات' : 'اختيار واحد';
  toast(`تم إنشاء الاستطلاع (${typeLabel}) ✓`,'success');
  loadMeta(tid);loadStats();if(expandedId===tid)renderBody(tid);
}
function addOpt(){const l=document.getElementById('poll-opts');const n=l.querySelectorAll('.popt-row').length+1;l.insertAdjacentHTML('beforeend',`<div class="popt-row"><input class="finput pov" type="text" placeholder="الخيار ${n}"><button class="btn-ropt" onclick="remOpt(this)">×</button></div>`);}
function remOpt(btn){const l=document.getElementById('poll-opts');if(l.querySelectorAll('.popt-row').length>2)btn.parentElement.remove();}
function editTopic(tid){
  const t=topics.find(x=>x.id===tid);if(!t)return;
  showEdit('تعديل الموضوع','العنوان',t.title,t.description,async()=>{
    const nt=document.getElementById('edit-val').value.trim();
    const nd=document.getElementById('edit-desc').value.trim();
    if(!nt){toast('أدخل عنواناً','error');return;}
    const {error}=await db.from('topics').update({title:nt,description:nd||null}).eq('id',tid);
    if(error){toast('خطأ','error');return;}
    closeModal('edit-modal');toast('تم التعديل ✓','success');
    await loadTopics();populatePollSel();
    if(expandedId===tid){expandedId=null;toggleTopic(tid);}
  });
}
function deleteTopic(tid){
  const t=topics.find(x=>x.id===tid);
  showConfirm('حذف الموضوع',`حذف الموضوع "${t?.title||''}"؟ سيُحذف كل ما يتعلق به.`,async()=>{
    const {error}=await db.from('topics').delete().eq('id',tid);
    if(error){toast('خطأ','error');return;}
    if(expandedId===tid)expandedId=null;
    if(activeTopicId===tid)activeTopicId=null;
    toast('تم الحذف','success');await loadTopics();populatePollSel();loadStats();
  });
}
function editPoll(pid){
  db.from('polls').select('*').eq('id',pid).single().then(({data:p})=>{
    if(!p)return;
    showEdit('تعديل السؤال','السؤال',p.question,undefined,async()=>{
      const nq=document.getElementById('edit-val').value.trim();
      if(!nq){toast('أدخل السؤال','error');return;}
      const {error}=await db.from('polls').update({question:nq}).eq('id',pid);
      if(error){toast('خطأ','error');return;}
      closeModal('edit-modal');toast('تم التعديل ✓','success');if(expandedId)renderBody(expandedId);
    });
  });
}
function deletePoll(pid){
  showConfirm('حذف الاستطلاع','حذف هذا الاستطلاع؟ ستُحذف جميع أصواته.',async()=>{
    const {data:p}=await db.from('polls').select('topic_id').eq('id',pid).single();
    const {error}=await db.from('polls').delete().eq('id',pid);
    if(error){toast('خطأ','error');return;}
    toast('تم الحذف','success');if(expandedId)renderBody(expandedId);if(p)loadMeta(p.topic_id);loadStats();
  });
}
function editComment(cid,tid){
  db.from('comments').select('content').eq('id',cid).single().then(({data:c})=>{
    if(!c)return;
    showEdit('تعديل التعليق','التعليق',c.content,undefined,async()=>{
      const nc=document.getElementById('edit-val').value.trim();
      if(!nc){toast('أدخل التعليق','error');return;}
      const {error}=await db.from('comments').update({content:nc}).eq('id',cid);
      if(error){toast('خطأ','error');return;}
      closeModal('edit-modal');toast('تم التعديل ✓','success');
      const el=document.getElementById('ci-'+cid);
      if(el){const t=el.querySelector('.c-text');if(t)t.textContent=nc;}
    });
  });
}
function deleteComment(cid,tid){
  showConfirm('حذف التعليق','حذف هذا التعليق؟',async()=>{
    const {error}=await db.from('comments').delete().eq('id',cid);
    if(error){toast('خطأ','error');return;}
    const el=document.getElementById('ci-'+cid);if(el)el.remove();
    // Also remove replies container
    const rc=document.getElementById('rc-'+cid);if(rc)rc.remove();
    const rt=document.getElementById('rt-'+cid);if(rt)rt.remove();
    const cc=document.getElementById('cc-'+tid);if(cc)cc.textContent=Math.max(0,parseInt(cc.textContent||1)-1);
    loadMeta(tid);loadStats();toast('تم الحذف','success');
  });
}

// ── UTILS ──
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function toast(msg,type=''){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+(type||'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='toast',2800);}

// ── REALTIME ──
db.channel('rt-comments')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'comments'},payload=>{
    if(viewingArchiveId)return;
    const c=payload.new;if(c.user_id===UID)return;
    loadMeta(c.topic_id);loadStats();
    if(expandedId===c.topic_id)appendComment(c.topic_id,c,false);
  })
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'comments'},payload=>{
    if(viewingArchiveId)return;
    const c=payload.new;
    const el=document.getElementById('ci-'+c.id);
    if(el){const t=el.querySelector('.c-text');if(t)t.textContent=c.content;}
  })
  .on('postgres_changes',{event:'DELETE',schema:'public',table:'comments'},payload=>{
    if(viewingArchiveId)return;
    const el=document.getElementById('ci-'+payload.old.id);
    if(el){
      const tid=payload.old.topic_id;el.remove();
      const rc=document.getElementById('rc-'+payload.old.id);if(rc)rc.remove();
      const cc=document.getElementById('cc-'+tid);if(cc)cc.textContent=Math.max(0,parseInt(cc.textContent||1)-1);
      loadMeta(tid);loadStats();
    }
  }).subscribe();

db.channel('rt-votes')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'poll_votes'},async payload=>{
    if(viewingArchiveId)return;
    const v=payload.new;if(v.user_id===UID)return;
    loadStats();
    const {data:poll}=await db.from('polls').select('poll_type').eq('id',v.poll_id).maybeSingle();
    const {data:votes}=await db.from('poll_votes').select('option_index,user_id').eq('poll_id',v.poll_id);
    if(votes){
      const isMulti=poll?.poll_type==='multi';
      const myVotes=votedPolls[v.poll_id];
      if(myVotes||pollPreviews.has(v.poll_id))updatePollBars(v.poll_id,votes,isMulti);
    }
    if(expandedId){const {data:p}=await db.from('polls').select('topic_id').eq('id',v.poll_id).maybeSingle();if(p)loadMeta(p.topic_id);}
  }).subscribe();

db.channel('rt-topics')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'topics'},async()=>{if(!viewingArchiveId){await loadTopics();populatePollSel();}})
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'topics'},async()=>{if(!viewingArchiveId){await loadTopics();populatePollSel();}})
  .on('postgres_changes',{event:'DELETE',schema:'public',table:'topics'},async()=>{if(!viewingArchiveId){await loadTopics();populatePollSel();}})
  .subscribe();

db.channel('rt-polls')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'polls'},async payload=>{
    if(viewingArchiveId)return;
    if(expandedId===payload.new.topic_id)renderBody(expandedId);
    loadMeta(payload.new.topic_id);loadStats();
  })
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'polls'},async payload=>{
    if(viewingArchiveId)return;
    if(expandedId===payload.new.topic_id)renderBody(expandedId);
  })
  .on('postgres_changes',{event:'DELETE',schema:'public',table:'polls'},async payload=>{
    if(viewingArchiveId)return;
    if(expandedId)renderBody(expandedId);loadStats();
  }).subscribe();

// Realtime for reactions
db.channel('rt-reactions')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'reactions'},payload=>{
    if(viewingArchiveId)return;
    const r=payload.new;if(r.user_id===UID)return;
    if(!reactionsCache[r.target_id])reactionsCache[r.target_id]={__mine:null};
    reactionsCache[r.target_id][r.emoji]=(reactionsCache[r.target_id][r.emoji]||0)+1;
    refreshReactionsRow(r.target_id, r.target_type);
  })
  .on('postgres_changes',{event:'DELETE',schema:'public',table:'reactions'},payload=>{
    if(viewingArchiveId)return;
    const r=payload.old;
    if(reactionsCache[r.target_id]&&reactionsCache[r.target_id][r.emoji]){
      reactionsCache[r.target_id][r.emoji]=Math.max(0,reactionsCache[r.target_id][r.emoji]-1);
    }
    refreshReactionsRow(r.target_id, r.target_type||'comment');
  }).subscribe();

// Realtime for attendance
db.channel('rt-attendance')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'attendance'},async()=>{
    if(viewingArchiveId)return;
    topics.forEach(t=>loadAttendanceMeta(t.id));
    // Update widget count if visible
    if(expandedId){
      const countEl=document.getElementById('aw-count-'+expandedId);
      if(countEl){
        const {count}=await db.from('attendance').select('*',{count:'exact',head:true}).eq('session_id','live');
        countEl.textContent=`${count||0} مشارك مسجّل`;
      }
    }
    // Refresh presence panel if open
    if(document.getElementById('f-presence')?.classList.contains('open')) loadPresencePanel();
  })
  .on('postgres_changes',{event:'DELETE',schema:'public',table:'attendance'},async()=>{
    if(viewingArchiveId)return;
    topics.forEach(t=>loadAttendanceMeta(t.id));
    if(document.getElementById('f-presence')?.classList.contains('open')) loadPresencePanel();
  }).subscribe();

// Realtime for link_posts
db.channel('rt-link-posts')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'link_posts'},async payload=>{
    if(viewingArchiveId)return;
    const lp=payload.new;if(lp.user_id===UID)return;
    if(expandedId===lp.topic_id){
      const commSec=document.getElementById('tbi-'+lp.topic_id)?.querySelector('.comments-section');
      if(commSec){
        const html = await buildLinkPostHTML(lp);
        const div=document.createElement('div');div.innerHTML=html;
        commSec.insertAdjacentElement('beforebegin',div.firstChild);
      }
    }
  })
  .on('postgres_changes',{event:'DELETE',schema:'public',table:'link_posts'},payload=>{
    if(viewingArchiveId)return;
    document.getElementById('lp-'+payload.old.id)?.remove();
  }).subscribe();

// ── POST-RENDER INIT (reactions + attendance) ──
// Called after renderBody so we can load reactions/attendance for visible items
const _origRenderBody = renderBody.bind(this);

renderBody = async function(tid){
  await _origRenderBody(tid);
  // Collect all comment IDs to preload reactions (NOT link posts — no reactions on links)
  const commentIds = [...document.querySelectorAll(`#tbi-${tid} .comment-item`)].map(el=>el.id.replace('ci-',''));
  await loadReactionsForTargets(commentIds);
  // Re-render reaction rows with counts
  commentIds.forEach(id=>refreshReactionsRow(id,'comment'));
  // Init attendance widget
  await initAttendanceWidget(tid);
  // Add link post form if user is logged in
  const linkFormZone = document.getElementById('tbi-'+tid)?.querySelector('.comments-section');
  if(linkFormZone && !viewingArchiveId){
    const formDiv=document.createElement('div');
    formDiv.innerHTML=buildLinkFormHTML(tid);
    linkFormZone.insertAdjacentElement('beforebegin',formDiv.firstChild);
  }
}

// ── INIT ──
updateHdr();initOnboard();
if(userName)loadTopics();