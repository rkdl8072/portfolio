// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ADMIN_ID = 'admin'; // ← 원하는 관리자 아이디로 변경하세요

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let works    = JSON.parse(localStorage.getItem('portfolio-works')    || '[]');
let users    = JSON.parse(localStorage.getItem('portfolio-users')    || '{}');
let comments = JSON.parse(localStorage.getItem('portfolio-comments') || '{}');
let currentUser = JSON.parse(localStorage.getItem('portfolio-session') || 'null');
let isAdminMode = false;
let currentMode = 'full';
let currentGrid = 3;
let fileData    = null;
let editIndex   = -1;
let editFileData = null;
let lbCurrentWorkId = null;

// Slider state
let slideIndex = 0;
let slideTimer = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCROLL REVEAL — 섹션 진입 애니메이션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function initScrollReveal() {
  const sections = document.querySelectorAll('.reveal-section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 각 섹션 내부 자식들에 stagger 딜레이 적용
        const children = entry.target.querySelectorAll('.reveal-child');
        children.forEach((child, i) => {
          child.style.transitionDelay = `${i * 80}ms`;
        });
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // 한 번 나타나면 관찰 중단
      }
    });
  }, {
    threshold: 0.08,       // 8% 보이면 트리거
    rootMargin: '0px 0px -40px 0px'
  });

  sections.forEach(sec => observer.observe(sec));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function init() {
  updateNavUI();
  render();
  renderSlider();
  initScrollReveal();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function openAuth(tab) {
  switchTab(tab || 'login');
  document.getElementById('auth-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    if (tab === 'login') document.getElementById('login-id').focus();
    else document.getElementById('signup-id').focus();
  }, 150);
}

function closeAuth(e, force) {
  if (!force && e && e.target !== document.getElementById('auth-modal')) return;
  document.getElementById('auth-modal').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('login-error').textContent = '';
  document.getElementById('signup-error').textContent = '';
}

function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('form-login').style.display  = tab === 'login'  ? '' : 'none';
  document.getElementById('form-signup').style.display = tab === 'signup' ? '' : 'none';
}

function doLogin() {
  const id    = document.getElementById('login-id').value.trim();
  const pw    = document.getElementById('login-pw').value;
  const errEl = document.getElementById('login-error');
  if (!id || !pw) { errEl.textContent = '아이디와 비밀번호를 입력해주세요.'; return; }
  const user  = users[id];
  if (!user || user.pw !== simpleHash(pw)) { errEl.textContent = '아이디 또는 비밀번호가 틀렸습니다.'; return; }
  currentUser = { id, name: user.name };
  localStorage.setItem('portfolio-session', JSON.stringify(currentUser));
  closeAuth(null, true);
  updateNavUI();
  render();
}

function doSignup() {
  const id    = document.getElementById('signup-id').value.trim();
  const name  = document.getElementById('signup-name').value.trim();
  const pw    = document.getElementById('signup-pw').value;
  const pw2   = document.getElementById('signup-pw2').value;
  const errEl = document.getElementById('signup-error');
  if (!id || !name || !pw) { errEl.textContent = '모든 항목을 입력해주세요.'; return; }
  if (pw.length < 6)       { errEl.textContent = '비밀번호는 6자 이상이어야 합니다.'; return; }
  if (pw !== pw2)           { errEl.textContent = '비밀번호가 일치하지 않습니다.'; return; }
  if (users[id])            { errEl.textContent = '이미 사용 중인 아이디입니다.'; return; }
  if (id === ADMIN_ID)      { errEl.textContent = '사용할 수 없는 아이디입니다.'; return; }
  users[id] = { name, pw: simpleHash(pw) };
  localStorage.setItem('portfolio-users', JSON.stringify(users));
  currentUser = { id, name };
  localStorage.setItem('portfolio-session', JSON.stringify(currentUser));
  closeAuth(null, true);
  updateNavUI();
  render();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('portfolio-session');
  isAdminMode = false;
  document.body.classList.remove('admin-mode', 'is-admin');
  document.getElementById('admin-btn').classList.remove('active');
  updateNavUI();
  render();
}

function isAdmin() {
  return currentUser && currentUser.id === ADMIN_ID;
}

function updateNavUI() {
  const loggedIn = !!currentUser;
  document.getElementById('nav-login-btn').style.display  = loggedIn ? 'none' : '';
  document.getElementById('nav-signup-btn').style.display = loggedIn ? 'none' : '';
  document.getElementById('nav-logout-btn').style.display = loggedIn ? '' : 'none';
  const nameEl = document.getElementById('nav-username');
  if (loggedIn) {
    nameEl.textContent = currentUser.name + (isAdmin() ? ' ★' : '');
    nameEl.style.display = '';
  } else {
    nameEl.style.display = 'none';
  }
  if (isAdmin()) {
    document.body.classList.add('is-admin');
  } else {
    document.body.classList.remove('is-admin', 'admin-mode');
    isAdminMode = false;
  }
}

function toggleAdminMode() {
  if (!isAdmin()) return;
  isAdminMode = !isAdminMode;
  document.body.classList.toggle('admin-mode', isAdminMode);
  document.getElementById('admin-btn').classList.toggle('active', isAdminMode);
  document.getElementById('admin-btn').textContent = isAdminMode ? '관리 중' : '관리';
}

// Simple hash (for demo; not cryptographically secure)
function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GALLERY RENDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function render() {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '';
  if (works.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">◻</div>
      <p>아직 업로드된 작품이 없습니다.<br>${isAdmin() ? '관리 버튼을 켜고 작품을 올려보세요.' : '곧 새 작품이 올라올 예정입니다.'}</p>
    </div>`;
    return;
  }
  works.forEach((w, i) => {
    const card = document.createElement('div');
    card.className = 'card reveal-child';
    const commentCount = (comments[w.id] || []).length;
    card.innerHTML = `
      <div class="card-img-wrap" style="position:relative">
        <img src="${w.img}" alt="${w.title}" loading="lazy">
        <div class="card-admin-btns">
          <button class="card-edit"   onclick="openEdit(event,${i})" title="수정">✏</button>
          <button class="card-delete" onclick="deleteWork(event,${i})" title="삭제">×</button>
        </div>
      </div>
      <div class="card-body">
        <p class="card-date">${w.date}${commentCount > 0 ? ` · 댓글 ${commentCount}` : ''}</p>
        <h3 class="card-title">${w.title}</h3>
        <p class="card-desc">${w.desc || ''}</p>
      </div>`;
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-edit') || e.target.classList.contains('card-delete')) return;
      openLightbox(w);
    });
    // 카드 초기 상태 (섹션 reveal과 별개로 stagger)
    card.style.opacity   = '0';
    card.style.transform = 'translateY(14px)';
    grid.appendChild(card);
    setTimeout(() => {
      card.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      card.style.opacity    = '1';
      card.style.transform  = 'translateY(0)';
    }, i * 55);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderSlider() {
  const track   = document.getElementById('slider-track');
  const dotsEl  = document.getElementById('slider-dots');
  const countEl = document.getElementById('slider-count');
  track.innerHTML = '';
  dotsEl.innerHTML = '';
  clearInterval(slideTimer);

  const recent = works.slice(0, 6);
  if (recent.length === 0) {
    track.innerHTML = '<div class="slider-empty">아직 등록된 작품이 없습니다</div>';
    document.getElementById('slider-prev').style.display = 'none';
    document.getElementById('slider-next').style.display = 'none';
    return;
  }

  document.getElementById('slider-prev').style.display = '';
  document.getElementById('slider-next').style.display = '';
  countEl.textContent = `01 / ${String(recent.length).padStart(2,'0')}`;

  recent.forEach((w, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.innerHTML = `
      <img class="slide-img" src="${w.img}" alt="${w.title}">
      <div class="slide-overlay"></div>
      <div class="slide-info">
        <p class="slide-date">${w.date}</p>
        <p class="slide-title">${w.title}</p>
      </div>`;
    slide.addEventListener('click', () => openLightbox(w));
    track.appendChild(slide);

    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goSlide(i));
    dotsEl.appendChild(dot);
  });

  slideIndex = 0;
  updateSlider(recent.length);
  slideTimer = setInterval(() => {
    slideIndex = (slideIndex + 1) % recent.length;
    updateSlider(recent.length);
  }, 1500);
}

function updateSlider(total) {
  const track = document.getElementById('slider-track');
  track.style.transform = `translateX(-${slideIndex * 100}%)`;
  document.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === slideIndex));
  document.getElementById('slider-count').textContent =
    `${String(slideIndex+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
}

function slidePrev() {
  const total = works.slice(0,6).length;
  if (!total) return;
  slideIndex = (slideIndex - 1 + total) % total;
  updateSlider(total);
  resetSliderTimer();
}

function slideNext() {
  const total = works.slice(0,6).length;
  if (!total) return;
  slideIndex = (slideIndex + 1) % total;
  updateSlider(total);
  resetSliderTimer();
}

function goSlide(i) {
  slideIndex = i;
  updateSlider(works.slice(0,6).length);
  resetSliderTimer();
}

function resetSliderTimer() {
  clearInterval(slideTimer);
  const total = works.slice(0,6).length;
  if (total > 1) {
    slideTimer = setInterval(() => {
      slideIndex = (slideIndex + 1) % total;
      updateSlider(total);
    }, 1500);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIGHTBOX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function openLightbox(w) {
  lbCurrentWorkId = w.id;
  document.getElementById('lb-img-el').src   = w.img;
  document.getElementById('lb-title').textContent = w.title;
  document.getElementById('lb-date').textContent  = w.date;
  document.getElementById('lb-desc').textContent  = w.desc || '';
  renderComments(w.id);
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(e, force) {
  if (!force && e && e.target !== document.getElementById('lightbox')) return;
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
  lbCurrentWorkId = null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderComments(workId) {
  const list     = document.getElementById('comment-list');
  const formWrap = document.getElementById('comment-form-wrap');
  const wComments = comments[workId] || [];

  list.innerHTML = wComments.length === 0
    ? '<p style="font-size:12px;color:var(--gray-500);padding:0.3rem 0">아직 댓글이 없습니다.</p>'
    : '';

  wComments.forEach(c => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
      <button class="c-delete" onclick="deleteComment('${workId}','${c.id}')" title="삭제">×</button>
      <p class="c-author">${escHtml(c.author)}</p>
      <p class="c-text">${escHtml(c.text)}</p>
      <p class="c-date">${c.date}</p>`;
    list.appendChild(item);
  });

  if (currentUser) {
    formWrap.innerHTML = `
      <div class="comment-form">
        <textarea class="comment-input" id="comment-text" placeholder="댓글을 입력하세요..." rows="2"></textarea>
        <button class="comment-submit" onclick="submitComment('${workId}')">등록</button>
      </div>`;
  } else {
    formWrap.innerHTML = `<p class="comment-login-msg"><button onclick="closeLightbox(null,true);openAuth('login')" style="background:none;border:none;cursor:pointer;text-decoration:underline;font-size:12px;color:var(--gray-500)">로그인</button> 후 댓글을 달 수 있습니다.</p>`;
  }
}

function submitComment(workId) {
  if (!currentUser) return;
  const text = document.getElementById('comment-text').value.trim();
  if (!text) return;
  if (!comments[workId]) comments[workId] = [];
  comments[workId].push({ id: Date.now().toString(), author: currentUser.name, text, date: formatDate() });
  localStorage.setItem('portfolio-comments', JSON.stringify(comments));
  renderComments(workId);
  render();
}

function deleteComment(workId, commentId) {
  if (!isAdmin()) return;
  if (!confirm('댓글을 삭제할까요?')) return;
  comments[workId] = (comments[workId] || []).filter(c => c.id !== commentId);
  localStorage.setItem('portfolio-comments', JSON.stringify(comments));
  renderComments(workId);
  render();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYOUT CONTROLS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setMode(mode) {
  currentMode = mode;
  const grid = document.getElementById('gallery-grid');
  grid.classList.remove('mode-full','mode-photo');
  grid.classList.add('mode-' + mode);
  document.getElementById('btn-mode-full').classList.toggle('active', mode === 'full');
  document.getElementById('btn-mode-photo').classList.toggle('active', mode === 'photo');
}

function setGrid(n) {
  currentGrid = n;
  const grid  = document.getElementById('gallery-grid');
  grid.classList.remove('layout-grid-1','layout-grid-2','layout-grid-3');
  grid.classList.add('layout-grid-' + n);
  [1,2,3].forEach(x => document.getElementById('btn-size-'+x).classList.toggle('active', x === n));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPLOAD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function openUpload() {
  document.getElementById('upload-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeUpload(e, force) {
  if (!force && e && e.target !== document.getElementById('upload-modal')) return;
  document.getElementById('upload-modal').classList.remove('open');
  document.body.style.overflow = '';
  fileData = null;
  document.getElementById('file-input').value = '';
  document.getElementById('input-title').value = '';
  document.getElementById('input-desc').value  = '';
  document.getElementById('preview-img').style.display = 'none';
}

function previewFile(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    fileData = e.target.result;
    const img = document.getElementById('preview-img');
    img.src = fileData;
    img.style.display = 'block';
  };
  reader.readAsDataURL(input.files[0]);
}

function submitWork() {
  const title = document.getElementById('input-title').value.trim();
  if (!fileData) { alert('이미지를 선택해주세요.'); return; }
  if (!title)    { alert('제목을 입력해주세요.'); return; }
  works.unshift({ id: Date.now().toString(), img: fileData, title, desc: document.getElementById('input-desc').value.trim(), date: formatDate() });
  save();
  render();
  renderSlider();
  closeUpload(null, true);
}

function deleteWork(e, i) {
  e.stopPropagation();
  if (!confirm('이 작품을 삭제할까요?')) return;
  const id = works[i].id;
  delete comments[id];
  works.splice(i, 1);
  save();
  render();
  renderSlider();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EDIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function openEdit(e, i) {
  e.stopPropagation();
  editIndex    = i;
  editFileData = null;
  const w = works[i];
  document.getElementById('edit-title').value = w.title;
  document.getElementById('edit-desc').value  = w.desc || '';
  document.getElementById('edit-file-input').value = '';
  const prev = document.getElementById('edit-preview-img');
  prev.src = w.img;
  prev.style.display = 'block';
  document.getElementById('edit-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEdit(e, force) {
  if (!force && e && e.target !== document.getElementById('edit-modal')) return;
  document.getElementById('edit-modal').classList.remove('open');
  document.body.style.overflow = '';
  editIndex    = -1;
  editFileData = null;
}

function previewEditFile(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    editFileData = e.target.result;
    const img = document.getElementById('edit-preview-img');
    img.src = editFileData;
    img.style.display = 'block';
  };
  reader.readAsDataURL(input.files[0]);
}

function submitEdit() {
  if (editIndex < 0) return;
  const title = document.getElementById('edit-title').value.trim();
  if (!title) { alert('제목을 입력해주세요.'); return; }
  works[editIndex].title = title;
  works[editIndex].desc  = document.getElementById('edit-desc').value.trim();
  if (editFileData) works[editIndex].img = editFileData;
  save();
  render();
  renderSlider();
  closeEdit(null, true);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function save() {
  try { localStorage.setItem('portfolio-works',    JSON.stringify(works));    } catch(e) {}
  try { localStorage.setItem('portfolio-comments', JSON.stringify(comments)); } catch(e) {}
}

function formatDate() {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DRAG & DROP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const dz = document.getElementById('drop-zone');
dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('dragover'); });
dz.addEventListener('dragleave', ()  => dz.classList.remove('dragover'));
dz.addEventListener('drop',      e  => {
  e.preventDefault(); dz.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = ev => { fileData = ev.target.result; const img = document.getElementById('preview-img'); img.src = fileData; img.style.display = 'block'; };
    reader.readAsDataURL(file);
  }
});

const edz = document.getElementById('edit-drop-zone');
edz.addEventListener('dragover',  e => { e.preventDefault(); edz.classList.add('dragover'); });
edz.addEventListener('dragleave', ()  => edz.classList.remove('dragover'));
edz.addEventListener('drop',      e  => {
  e.preventDefault(); edz.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = ev => { editFileData = ev.target.result; const img = document.getElementById('edit-preview-img'); img.src = editFileData; img.style.display = 'block'; };
    reader.readAsDataURL(file);
  }
});

// ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeLightbox(null, true);
    closeUpload(null, true);
    closeEdit(null, true);
    closeAuth(null, true);
  }
});

init();