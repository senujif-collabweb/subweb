/* =========================================================
   1. THEME TOGGLE (light/dark, remembered via localStorage)
   ========================================================= */
const root = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        themeBtn.textContent = '☀️ Light mode';
    } else {
        root.removeAttribute('data-theme');
        themeBtn.textContent = '🌙 Dark mode';
    }
}

const savedTheme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

themeBtn.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
});

/* =========================================================
   2. SCROLL-REVEAL ANIMATION
   ========================================================= */
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });
revealEls.forEach(el => observer.observe(el));

/* =========================================================
   3. FIREBASE — LOGIN + LOYALTY POINTS
   -----------------------------------------------------------
   Fill in YOUR_FIREBASE_CONFIG below with the values from:
   Firebase Console > Project settings > General > Your apps > SDK setup
   ========================================================= */
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Tab switching between Login / Sign up ---
const loginTabBtn = document.getElementById('tab-login');
const signupTabBtn = document.getElementById('tab-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

loginTabBtn.addEventListener('click', () => {
    loginTabBtn.classList.add('active');
    signupTabBtn.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
});
signupTabBtn.addEventListener('click', () => {
    signupTabBtn.classList.add('active');
    loginTabBtn.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
});

const authMsg = document.getElementById('auth-msg');
function showMsg(text, type) {
    authMsg.textContent = text;
    authMsg.className = 'auth-msg ' + (type || '');
}

// --- Sign up ---
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => {
            return db.collection('customers').doc(cred.user.uid).set({
                name: name,
                email: email,
                points: 0,
                visits: 0,
                joined: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => showMsg('Account created! Welcome to the club.', 'success'))
        .catch((err) => showMsg(err.message, 'error'));
});

// --- Log in ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .catch((err) => showMsg(err.message, 'error'));
});

// --- Log out ---
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// --- Log a visit (+10 points) ---
document.getElementById('checkin-btn').addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = db.collection('customers').doc(user.uid);
    ref.update({
        points: firebase.firestore.FieldValue.increment(10),
        visits: firebase.firestore.FieldValue.increment(1)
    });
});

// --- Show the right panel depending on login state ---
const authPanel = document.getElementById('auth-panel');
const memberPanel = document.getElementById('member-panel');
const pointsDisplay = document.getElementById('points-display');
const memberName = document.getElementById('member-name');

auth.onAuthStateChanged((user) => {
    if (user) {
        authPanel.style.display = 'none';
        memberPanel.style.display = 'block';
        db.collection('customers').doc(user.uid).onSnapshot((doc) => {
            const data = doc.data() || {};
            memberName.textContent = data.name || user.email;
            pointsDisplay.textContent = data.points || 0;
        });
    } else {
        authPanel.style.display = 'block';
        memberPanel.style.display = 'none';
    }
});
