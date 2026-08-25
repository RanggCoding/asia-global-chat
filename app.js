// ===============================
// ASIA GLOBAL CHAT
// Replace FIREBASE_CONFIG with your Firebase Web App config.
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getDatabase, ref, push, onChildAdded, query, limitToLast,
  serverTimestamp, onValue, onDisconnect, set, remove
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// 1) Paste your Firebase Web App config here.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDagDhX_gJ79lbkbCAYDxp98IWV1tifcjk",
  authDomain: "web-app-a7407.firebaseapp.com",
  databaseURL: "https://web-app-a7407-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "web-app-a7407",
  storageBucket: "web-app-a7407.firebasestorage.app",
  messagingSenderId: "786169238703",
  appId: "1:786169238703:web:4a9fc5c5f9595b87a7305a",
  measurementId: "G-2K65DFDF47"
};

const ROOM = "asia-global";
const MAX_MESSAGE = 500;

const loginView = document.querySelector("#loginView");
const chatView = document.querySelector("#chatView");
const joinForm = document.querySelector("#joinForm");
const nameInput = document.querySelector("#nameInput");
const countryInput = document.querySelector("#countryInput");
const messageForm = document.querySelector("#messageForm");
const messageInput = document.querySelector("#messageInput");
const messages = document.querySelector("#messages");
const onlineCount = document.querySelector("#onlineCount");
const leaveBtn = document.querySelector("#leaveBtn");
const connectionBanner = document.querySelector("#connectionBanner");
const emojiBtn = document.querySelector("#emojiBtn");
const emojiPanel = document.querySelector("#emojiPanel");

let app, db;
let me = null;
let presenceRef = null;
let messagesLoaded = false;

function configured() {
  return !Object.values(FIREBASE_CONFIG).some(v => String(v).includes("PASTE_") || String(v).includes("YOUR_PROJECT"));
}

function showConnection(text) {
  connectionBanner.textContent = text;
  connectionBanner.classList.remove("hidden");
}
function hideConnection(){ connectionBanner.classList.add("hidden"); }

function safeName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0,24);
}
function escapeText(value) {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function formatTime(ts) {
  if (!ts) return "now";
  return new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit"}).format(new Date(ts));
}
function initials(name) {
  return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
}
function scrollBottom() {
  requestAnimationFrame(() => messages.scrollTop = messages.scrollHeight);
}
function renderMessage(data) {
  const m = data.val();
  if (!m || typeof m.text !== "string" || !m.name) return;
  const mine = me && m.uid === me.uid;
  const el = document.createElement("article");
  el.className = "message" + (mine ? " mine" : "");
  el.innerHTML = `
    <div class="avatar">${escapeText(initials(m.name))}</div>
    <div class="bubble">
      <div class="meta">
        <span class="name">${escapeText(m.name)}</span>
        <span class="country">${escapeText(m.country || "🌏 Asia")}</span>
        <span class="time">${formatTime(m.createdAt)}</span>
      </div>
      <div class="text">${escapeText(m.text)}</div>
    </div>`;
  messages.appendChild(el);
  scrollBottom();
}

function makeUid() {
  return crypto.randomUUID ? crypto.randomUUID() :
    "u_" + Date.now() + "_" + Math.random().toString(36).slice(2);
}

async function enterChat(name, country) {
  if (!configured()) {
    alert("Firebase belum dikonfigurasi. Buka app.js lalu isi FIREBASE_CONFIG dari Firebase Console.");
    return;
  }
  app = initializeApp(FIREBASE_CONFIG);
  db = getDatabase(app);

  me = { uid: makeUid(), name, country };
  sessionStorage.setItem("agc_name", name);
  sessionStorage.setItem("agc_country", country);

  loginView.classList.add("hidden");
  chatView.classList.remove("hidden");
  showConnection("Connecting…");

  const connected = ref(db, ".info/connected");
  onValue(connected, async snap => {
    if (snap.val() === true) {
      hideConnection();
      presenceRef = ref(db, `rooms/${ROOM}/presence/${me.uid}`);
      await onDisconnect(presenceRef).remove();
      await set(presenceRef, {
        name: me.name, country: me.country, connectedAt: serverTimestamp()
      });
    } else {
      showConnection("Connection lost. Reconnecting…");
    }
  });

  onValue(ref(db, `rooms/${ROOM}/presence`), snap => {
    onlineCount.textContent = snap.size;
  });

  const messagesQuery = query(ref(db, `rooms/${ROOM}/messages`), limitToLast(150));
  onChildAdded(messagesQuery, data => {
    renderMessage(data);
    messagesLoaded = true;
  });

  messageInput.focus();
}

joinForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = safeName(nameInput.value);
  if (name.length < 2) return alert("Please enter a name with at least 2 characters.");
  enterChat(name, countryInput.value);
});

messageForm.addEventListener("submit", async e => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !db || !me) return;
  if (text.length > MAX_MESSAGE) return alert(`Message too long. Maximum ${MAX_MESSAGE} characters.`);
  messageInput.value = "";
  messageInput.style.height = "auto";
  try {
    await push(ref(db, `rooms/${ROOM}/messages`), {
      uid: me.uid, name: me.name, country: me.country,
      text, createdAt: serverTimestamp()
    });
  } catch (err) {
    messageInput.value = text;
    showConnection("Could not send. Check your connection.");
    console.error(err);
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight,120) + "px";
});
messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    messageForm.requestSubmit();
  }
});

emojiBtn.addEventListener("click", () => emojiPanel.classList.toggle("hidden"));
emojiPanel.addEventListener("click", e => {
  if (e.target.tagName !== "BUTTON") return;
  const emoji = e.target.textContent;
  const start = messageInput.selectionStart, end = messageInput.selectionEnd;
  messageInput.value = messageInput.value.slice(0,start) + emoji + messageInput.value.slice(end);
  messageInput.focus();
  messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
  emojiPanel.classList.add("hidden");
});

leaveBtn.addEventListener("click", async () => {
  if (presenceRef) {
    try { await remove(presenceRef); } catch {}
  }
  location.reload();
});

// Restore the last local name for convenience.
const savedName = sessionStorage.getItem("agc_name");
const savedCountry = sessionStorage.getItem("agc_country");
if (savedName) nameInput.value = savedName;
if (savedCountry) countryInput.value = savedCountry;
