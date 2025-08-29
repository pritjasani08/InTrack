// Simple SPA Router and UI for Smart Attendance & Feedback (Vanilla JS)
// Note: No backend. Uses in-memory/localStorage for demo navigation.

(function(){
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');

  const state = {
    currentUser: null,
    role: null, // 'student' | 'admin'
    events: JSON.parse(localStorage.getItem('events')||'[]')
  };

  function saveEvents(){ localStorage.setItem('events', JSON.stringify(state.events)); }

  function navigate(hash){
    if(location.hash !== hash){ location.hash = hash; }
    render();
  }

  function showToast(msg){
    const el = document.createElement('div');
    el.className = 'toast show';
    el.textContent = msg;
    toastRoot.appendChild(el);
    setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(), 200); }, 2000);
  }

  function openModal(title, bodyHTML, actionsHTML){
    modalRoot.innerHTML = `
      <div class="modal-overlay open" data-modal>
        <div class="modal open card">
          <div class="modal-header">
            <strong>${title}</strong>
            <button class="btn btn-outline" data-close>✕</button>
          </div>
          <div class="modal-body">
            ${bodyHTML}
            ${actionsHTML?`<div style="margin-top:14px; display:flex; gap:10px; justify-content:flex-end">${actionsHTML}</div>`:''}
          </div>
        </div>
      </div>`;
    modalRoot.querySelector('[data-close]').onclick = closeModal;
    modalRoot.querySelector('[data-modal]').onclick = (e)=>{ if(e.target.dataset.modal!==undefined) closeModal(); };
  }
  function closeModal(){ modalRoot.innerHTML=''; }

  function requiredFields(form){
    const inputs = form.querySelectorAll('[data-required]');
    for(const input of inputs){
      if(!input.value.trim()){
        alert('Please fill this field');
        input.focus();
        return false;
      }
    }
    return true;
  }

  function appBar(){
    return `
      <div class="appbar card glass">
        <div class="brand"><span class="dot"></span> Smart Attendance</div>
        <div class="dropdown">
          <button class="avatar" id="profileBtn">${(state.currentUser?.firstName||'U')[0]}</button>
          <div class="menu" id="profileMenu">
            <button id="editProfile">Edit Profile</button>
            <button id="logoutBtn">Logout</button>
          </div>
        </div>
      </div>`;
  }

  function wireProfileMenu(){
    const btn = document.getElementById('profileBtn');
    const menu = document.getElementById('profileMenu');
    if(!btn||!menu) return;
    btn.onclick = ()=>{ menu.classList.toggle('open'); };
    document.addEventListener('click', (e)=>{
      if(!menu.contains(e.target) && e.target!==btn){ menu.classList.remove('open'); }
    });
    const edit = document.getElementById('editProfile');
    if(edit){ edit.onclick = ()=>{ showToast('Edit Profile (demo)'); menu.classList.remove('open'); }}
    const logout = document.getElementById('logoutBtn');
    if(logout){ logout.onclick = ()=>{ state.currentUser=null; state.role=null; navigate('#/'); showToast('Logged out'); }}
  }

  // VIEWS
  function Landing(){
    return `
      <div class="container">
        <div class="card glass hero">
          <h1 class="title">Smart Attendance & Feedback</h1>
          <p class="subtitle">Fast QR attendance, seamless event management, and feedback collection.</p>
          <div class="cta">
            <button class="btn btn-primary" id="goStudent">Continue as Student</button>
            <button class="btn btn-outline" id="goAdmin">Continue as Admin</button>
          </div>
        </div>
      </div>`;
  }

  function Signup(role){
    const isStudent = role==='student';
    return `
      <div class="container">
        <div class="card glass section" style="max-width:680px; margin:0 auto;">
          <h2 style="margin:0 0 12px">${isStudent?'Student':'Admin'} Signup</h2>
          <form id="signupForm">
            <div class="row row-2">
              <div class="field"><label class="label">First Name</label><input class="input" data-required name="firstName" placeholder="John"></div>
              <div class="field"><label class="label">Last Name</label><input class="input" data-required name="lastName" placeholder="Doe"></div>
            </div>
            <div class="row">
              <div class="field"><label class="label">Mobile</label><input class="input" data-required name="mobile" placeholder="9876543210"></div>
              <div class="field"><label class="label">Email</label><input class="input" data-required name="email" placeholder="you@example.com"></div>
            </div>
            <div class="row ${isStudent?'row-2':''}">
              <div class="field"><label class="label">Password</label><input type="password" class="input" data-required name="password" placeholder="••••••••"></div>
              ${isStudent?`<div class="field"><label class="label">Confirm Password</label><input type="password" class="input" data-required name="confirm" placeholder="••••••••"></div>`:''}
            </div>
            <button class="btn btn-primary" type="submit">Create account</button>
            <div class="help">Already have an account? <a href="#/login/${role}">Login</a></div>
          </form>
        </div>
      </div>`;
  }

  function Login(role){
    return `
      <div class="container">
        <div class="card glass section" style="max-width:520px; margin:0 auto;">
          <h2 style="margin:0 0 12px">${role==='student'?'Student':'Admin'} Login</h2>
          <form id="loginForm">
            <div class="field"><label class="label">Email</label><input class="input" data-required name="email" placeholder="you@example.com"></div>
            <div class="field"><label class="label">Password</label><input type="password" class="input" data-required name="password" placeholder="••••••••"></div>
            <button class="btn btn-primary" type="submit">Login</button>
            <div class="help">No account? <a href="#/signup/${role}">Sign up</a></div>
          </form>
        </div>
      </div>`;
  }

  function DashboardLayout(content){
    return `
      ${appBar()}
      <div class="container section">
        <div class="grid grid-cols-2">
          <div>
            ${content}
            <div class="section">
              <h3 style="margin:0 0 8px">Notifications & Alerts</h3>
              <div class="cards">
                <div class="note">Event "Tech Talk" starts in 30 mins.</div>
                <div class="note">New feedback received for "AI Workshop".</div>
              </div>
            </div>
          </div>
          <div>
            <div class="calendar card" style="margin-bottom:12px;">Google Calendar (placeholder)</div>
            <div class="clock card">Clock: <span id="clock"></span></div>
          </div>
        </div>
      </div>`;
  }

  function tickClock(){
    const el = document.getElementById('clock');
    if(!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString();
  }

  function StudentDashboard(){
    const content = `
      <div class="card section">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
          <div>
            <h2 style="margin:0">Welcome, ${state.currentUser?.firstName||'Student'}</h2>
            <div class="help">Mark your attendance via QR</div>
          </div>
          <button class="btn btn-primary" id="markBtn">Mark Attendance</button>
        </div>
      </div>`;
    return DashboardLayout(content);
  }

  function AdminDashboard(){
    const content = `
      <div class="card section">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap">
          <h2 style="margin:0">Admin Panel</h2>
          <div class="tabs">
            <a class="chip" href="#/admin/create">Create Event</a>
            <a class="chip" href="#/admin/past">See Past Events</a>
            <a class="chip" href="#/admin/feedback">See Feedback</a>
          </div>
        </div>
        <div class="help">Choose an option above or create a new event.</div>
      </div>`;
    return DashboardLayout(content);
  }

  function AdminCreateEvent(){
    const content = `
      <div class="card section">
        <h2 style="margin:0 0 12px">Create Event</h2>
        <form id="eventForm">
          <div class="row row-2">
            <div class="field"><label class="label">Event Name</label><input class="input" data-required name="name" placeholder="Orientation Day"></div>
            <div class="field"><label class="label">Event Date</label><input type="date" class="input" data-required name="date"></div>
          </div>
          <div class="row row-2">
            <div class="field"><label class="label">Location</label><input class="input" data-required name="location" placeholder="Auditorium"></div>
            <div class="field"><label class="label">Attendance Radius (m)</label><input type="number" class="input" data-required name="radius" placeholder="50"></div>
          </div>
          <label style="display:flex; gap:10px; align-items:center"><input type="checkbox" name="withFeedback"> Create Feedback Form</label>
          <button class="btn btn-primary" type="submit">Generate QR</button>
        </form>
        <div id="qrWrap" style="margin-top:16px; display:none">
          <div class="help">Show this QR at entrance</div>
          <div class="qr card" style="display:flex; align-items:center; justify-content:center; margin:10px 0">QR Placeholder</div>
          <div id="qrMeta" class="help"></div>
        </div>
      </div>`;
    return DashboardLayout(content);
  }

  function AdminPast(){
    const list = state.events.length? state.events : [
      {name:'AI Workshop', date:'2025-01-10', location:'Lab 2'},
      {name:'Tech Talk', date:'2025-01-20', location:'Auditorium'}
    ];
    const content = `
      <div class="card section">
        <h2 style="margin:0 0 12px">Past Events</h2>
        <div class="cards">
          ${list.map(e=>`<div class="note"><strong>${e.name}</strong><div class="help">${e.date} • ${e.location}</div></div>`).join('')}
        </div>
      </div>`;
    return DashboardLayout(content);
  }

  function AdminFeedback(){
    const content = `
      <div class="card section">
        <h2 style="margin:0 0 12px">Feedback</h2>
        <div class="cards">
          <div class="note"><strong>AI Workshop</strong><div class="help">Rating: ⭐⭐⭐⭐☆</div><div>Great session, loved the demos.</div></div>
          <div class="note"><strong>Tech Talk</strong><div class="help">Rating: ⭐⭐⭐⭐⭐</div><div>Insightful and well-paced.</div></div>
        </div>
      </div>`;
    return DashboardLayout(content);
  }

  function FeedbackForm(){
    return `
      ${appBar()}
      <div class="container section">
        <div class="card section" style="max-width:760px; margin:0 auto;">
          <h2 style="margin:0 0 12px">Event Feedback</h2>
          <form id="fbForm">
            <div class="note">
              <div class="label">Your Name</div>
              <input class="input" data-required name="name" placeholder="John Doe">
            </div>
            <div class="note">
              <div class="label">How was the event? (MCQ)</div>
              <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:8px">
                <label><input type="radio" name="q1" value="Excellent"> Excellent</label>
                <label><input type="radio" name="q1" value="Good"> Good</label>
                <label><input type="radio" name="q1" value="Average"> Average</label>
                <label><input type="radio" name="q1" value="Poor"> Poor</label>
              </div>
            </div>
            <div class="note">
              <div class="label">What did you like the most? (Short Answer)</div>
              <input class="input" name="q2" placeholder="Your answer">
            </div>
            <div class="note">
              <div class="label">Rate the overall experience</div>
              <input type="range" min="1" max="5" value="4" name="q3">
            </div>
            <button class="btn btn-primary" type="submit">Submit Feedback</button>
          </form>
        </div>
      </div>`;
  }

  // EVENTS / WIRING for Pages
  function afterRender(){
    // Landing
    const goS = document.getElementById('goStudent');
    const goA = document.getElementById('goAdmin');
    if(goS) goS.onclick = ()=> navigate('#/signup/student');
    if(goA) goA.onclick = ()=> navigate('#/signup/admin');

    // Signup
    const signupForm = document.getElementById('signupForm');
    if(signupForm){
      signupForm.onsubmit = (e)=>{
        e.preventDefault();
        if(!requiredFields(signupForm)) return;
        const data = Object.fromEntries(new FormData(signupForm).entries());
        if('confirm' in data && data.password !== data.confirm){ alert('Please fill this field'); signupForm.querySelector('[name="confirm"]').focus(); return; }
        state.currentUser = { firstName:data.firstName, lastName:data.lastName, email:data.email };
        const role = location.hash.includes('student')?'student':'admin';
        state.role = role;
        showToast('Signup successful');
        navigate(`#/login/${role}`);
      };
    }

    // Login
    const loginForm = document.getElementById('loginForm');
    if(loginForm){
      loginForm.onsubmit = (e)=>{
        e.preventDefault();
        if(!requiredFields(loginForm)) return;
        const role = location.hash.includes('student')?'student':'admin';
        state.role = role;
        state.currentUser = state.currentUser || {firstName:'User'};
        showToast('Logged in');
        navigate(role==='student'?'#/student':'#/admin');
      };
    }

    // Student Dashboard
    const markBtn = document.getElementById('markBtn');
    if(markBtn){
      markBtn.onclick = ()=>{
        openModal('QR Scanner', `
          <div style="display:flex; gap:12px; align-items:center; justify-content:center; flex-wrap:wrap">
            <button class="btn btn-outline" id="uploadQR">Upload from Gallery</button>
            <button class="btn btn-outline" id="openCam">Open Camera</button>
          </div>
        `);
        const proceed = ()=>{
          // Fake scan → open attendance form
          openModal('Attendance Form', `
            <form id="attForm">
              <div class="field"><label class="label">Name</label><input class="input" data-required name="name" value="${state.currentUser?.firstName||''}"></div>
              <div class="field"><label class="label">Mobile</label><input class="input" data-required name="mobile" placeholder="9876543210"></div>
              <div class="field"><label class="label">Email</label><input class="input" data-required name="email" value="${state.currentUser?.email||''}"></div>
              <div class="field">
                <label class="label">Take Selfie</label>
                <div style="display:flex; align-items:center; gap:12px">
                  <div id="faceCircle" style="width:72px; height:72px; border-radius:50%; border:4px solid #ff6b6b; background:rgba(255,255,255,.06)"></div>
                  <button class="btn btn-outline" type="button" id="toggleFace">Toggle Face Detect</button>
                </div>
              </div>
              <button class="btn btn-primary" type="submit">Submit Attendance</button>
            </form>
          `);
          const fc = document.getElementById('faceCircle');
          const tog = document.getElementById('toggleFace');
          if(tog) tog.onclick = ()=>{
            const red = '#ff6b6b', green = '#7ef0c1';
            fc.style.borderColor = fc.style.borderColor.includes('255, 107, 107')||fc.style.borderColor===''? green : red;
          };
          const af = document.getElementById('attForm');
          if(af) af.onsubmit = (e)=>{
            e.preventDefault();
            if(!requiredFields(af)) return;
            closeModal();
            const ok = Math.random() > 0.2; // 80% success
            alert(ok?'Attendance Submitted Successfully':'You are not in range');
            if(ok && state.role==='student') navigate('#/feedback');
          };
        };
        const u = document.getElementById('uploadQR');
        const c = document.getElementById('openCam');
        if(u) u.onclick = proceed;
        if(c) c.onclick = proceed;
      };
    }

    // Admin Create Event
    const eventForm = document.getElementById('eventForm');
    if(eventForm){
      eventForm.onsubmit = (e)=>{
        e.preventDefault();
        if(!requiredFields(eventForm)) return;
        const data = Object.fromEntries(new FormData(eventForm).entries());
        const evt = {name:data.name, date:data.date, location:data.location, radius:data.radius, withFeedback: !!data.withFeedback};
        state.events.unshift(evt); saveEvents();
        const wrap = document.getElementById('qrWrap');
        const meta = document.getElementById('qrMeta');
        if(wrap && meta){ wrap.style.display='block'; meta.textContent = `${evt.name} • ${evt.location} • ${evt.date}`; }
        showToast('QR generated');
      };
    }

    // Clock
    tickClock();
    setTimeout(tickClock, 1000);

    // Profile dropdown & common
    wireProfileMenu();
  }

  function render(){
    const hash = location.hash.replace('#','');
    // Routes
    if(hash==='' || hash==='/' || hash==='/'){
      app.innerHTML = Landing();
    } else if(hash.startsWith('/signup/student')){
      app.innerHTML = Signup('student');
    } else if(hash.startsWith('/signup/admin')){
      app.innerHTML = Signup('admin');
    } else if(hash.startsWith('/login/student')){
      app.innerHTML = Login('student');
    } else if(hash.startsWith('/login/admin')){
      app.innerHTML = Login('admin');
    } else if(hash.startsWith('/student')){
      app.innerHTML = StudentDashboard();
    } else if(hash.startsWith('/admin/create')){
      app.innerHTML = AdminCreateEvent();
    } else if(hash.startsWith('/admin/past')){
      app.innerHTML = AdminPast();
    } else if(hash.startsWith('/admin/feedback')){
      app.innerHTML = AdminFeedback();
    } else if(hash.startsWith('/admin')){
      app.innerHTML = AdminDashboard();
    } else if(hash.startsWith('/feedback')){
      app.innerHTML = FeedbackForm();
    } else {
      app.innerHTML = Landing();
    }
    afterRender();
  }

  window.addEventListener('hashchange', render);
  document.addEventListener('DOMContentLoaded', ()=>{
    if(!location.hash) navigate('#/'); else render();
  });
})();


