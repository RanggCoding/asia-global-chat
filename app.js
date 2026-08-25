import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {getDatabase,ref,push,onChildAdded,query,limitToLast,serverTimestamp,onValue,onDisconnect,set,remove} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const FIREBASE_CONFIG={
  apiKey:"AIzaSyDagDhX_gJ79lbkbCAYDxp98IWV1tifcjk",
  authDomain:"web-app-a7407.firebaseapp.com",
  databaseURL:"https://web-app-a7407-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:"web-app-a7407",
  storageBucket:"web-app-a7407.firebasestorage.app",
  messagingSenderId:"786169238703",
  appId:"1:786169238703:web:4a9fc5c5f9595b87a7305a",
  measurementId:"G-2K65DFDF47"
};
const ROOM="asia-global",MAX_MESSAGE=500,$=s=>document.querySelector(s);
const loginView=$("#loginView"),chatView=$("#chatView"),joinForm=$("#joinForm"),nameInput=$("#nameInput"),countryInput=$("#countryInput");
const messageForm=$("#messageForm"),messageInput=$("#messageInput"),messages=$("#messages"),onlineCount=$("#onlineCount"),leaveBtn=$("#leaveBtn"),connectionBanner=$("#connectionBanner"),emojiBtn=$("#emojiBtn"),emojiPanel=$("#emojiPanel");
let db=null,me=null,presenceRef=null;
const esc=v=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const clean=v=>v.trim().replace(/\s+/g," ").slice(0,24), initials=v=>v.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
const getTime=v=>v?new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit"}).format(new Date(v)):"now";
const uid=()=>crypto.randomUUID?crypto.randomUUID():"u_"+Date.now()+"_"+Math.random().toString(36).slice(2);
const showBanner=v=>{connectionBanner.textContent=v;connectionBanner.classList.remove("hidden")},hideBanner=()=>connectionBanner.classList.add("hidden");
function bottom(){requestAnimationFrame(()=>messages.scrollTop=messages.scrollHeight)}
function addMessage(data){
 const m=data.val(); if(!m||typeof m.text!=="string"||typeof m.name!=="string")return;
 const mine=me&&m.uid===me.uid, a=document.createElement("article"); a.className="message"+(mine?" mine":"");
 a.innerHTML=`<div class="avatar">${esc(initials(m.name))}</div><div class="message-wrap"><div class="meta"><span class="name">${esc(m.name)}</span><span class="country">${esc(m.country||"🌏 Asia")}</span><span class="time">${getTime(m.createdAt)}</span></div><div class="bubble">${esc(m.text)}</div></div>`;
 messages.appendChild(a);bottom();
}
async function enter(name,country){
 db=getDatabase(initializeApp(FIREBASE_CONFIG));me={uid:uid(),name,country};
 sessionStorage.setItem("agc_name",name);sessionStorage.setItem("agc_country",country);
 loginView.classList.add("hidden");chatView.classList.remove("hidden");showBanner("Connecting…");
 onValue(ref(db,".info/connected"),async snap=>{
   if(snap.val()===true){hideBanner();presenceRef=ref(db,`rooms/${ROOM}/presence/${me.uid}`);await onDisconnect(presenceRef).remove();await set(presenceRef,{name:me.name,country:me.country,connectedAt:serverTimestamp()})}
   else showBanner("Reconnecting…");
 });
 onValue(ref(db,`rooms/${ROOM}/presence`),snap=>onlineCount.textContent=snap.size);
 onChildAdded(query(ref(db,`rooms/${ROOM}/messages`),limitToLast(150)),addMessage);messageInput.focus();
}
joinForm.addEventListener("submit",e=>{e.preventDefault();const name=clean(nameInput.value);if(name.length<2)return alert("Please enter at least 2 characters.");enter(name,countryInput.value)});
messageForm.addEventListener("submit",async e=>{
 e.preventDefault();const text=messageInput.value.trim();if(!text||!db||!me)return;if(text.length>MAX_MESSAGE)return alert(`Maximum ${MAX_MESSAGE} characters.`);
 messageInput.value="";messageInput.style.height="auto";
 try{await push(ref(db,`rooms/${ROOM}/messages`),{uid:me.uid,name:me.name,country:me.country,text,createdAt:serverTimestamp()})}
 catch(err){messageInput.value=text;showBanner("Message failed. Check your connection.");console.error(err)}
});
messageInput.addEventListener("input",()=>{messageInput.style.height="auto";messageInput.style.height=Math.min(messageInput.scrollHeight,120)+"px"});
messageInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();messageForm.requestSubmit()}});
emojiBtn.addEventListener("click",()=>emojiPanel.classList.toggle("hidden"));
emojiPanel.addEventListener("click",e=>{if(e.target.tagName!=="BUTTON")return;const emoji=e.target.textContent,start=messageInput.selectionStart,end=messageInput.selectionEnd;messageInput.value=messageInput.value.slice(0,start)+emoji+messageInput.value.slice(end);messageInput.focus();messageInput.selectionStart=messageInput.selectionEnd=start+emoji.length;emojiPanel.classList.add("hidden")});
document.addEventListener("click",e=>{if(!emojiPanel.contains(e.target)&&e.target!==emojiBtn)emojiPanel.classList.add("hidden")});
leaveBtn.addEventListener("click",async()=>{if(presenceRef){try{await remove(presenceRef)}catch{}}sessionStorage.removeItem("agc_name");sessionStorage.removeItem("agc_country");location.reload()});
const savedName=sessionStorage.getItem("agc_name"),savedCountry=sessionStorage.getItem("agc_country");if(savedName)nameInput.value=savedName;if(savedCountry)countryInput.value=savedCountry;
