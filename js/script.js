const AUDIO_FILE = "Cuma Temen (Sped Up).mp3";
const START_OFFSET = 13.0;
const OUT_JSON = "out.json";
const container = document.getElementById("chat-container");

const profiles = {
  left: {
    name: "Mahiru",
    avatar: "https://i.ibb.co.com/BVQ37LP3/2a31a19ca3e8a2287fbb1752f02f696b.jpg",
    online: true
  },
  right: {
    name: "renn",
    avatar: "https://i.ibb.co.com/yFmYHr36/f15b7fb63f2340c3fb38d5e59fa25f75.jpg",
    online: true
  }
};

function createMessageNode(text, side) {
  const msg = document.createElement("div");
  msg.className = `message ${side}`;
  const profile = profiles[side];
  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  if (side === "left") {
    const avatarContainer = document.createElement("div");
    avatarContainer.className = "avatar-container";
    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = profile.avatar;
    avatar.alt = profile.name;
    if (profile.online) {
      const onlineDot = document.createElement("div");
      onlineDot.className = "online-dot";
      avatarContainer.appendChild(onlineDot);
    }
    avatarContainer.appendChild(avatar);
    msg.appendChild(avatarContainer);
  }
  const messageHeader = document.createElement("div");
  messageHeader.className = "message-header";
  const username = document.createElement("span");
  username.className = "username";
  username.textContent = profile.name;
  messageHeader.appendChild(username);
  const textElement = document.createElement("div");
  textElement.className = "text";
  textElement.textContent = text;
  const timestamp = document.createElement("div");
  timestamp.className = "timestamp";
  messageContent.appendChild(messageHeader);
  messageContent.appendChild(textElement);
  messageContent.appendChild(timestamp);
  if (side === "right") {
    const avatarContainer = document.createElement("div");
    avatarContainer.className = "avatar-container";
    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = profile.avatar;
    avatar.alt = profile.name;
    if (profile.online) {
      const onlineDot = document.createElement("div");
      onlineDot.className = "online-dot";
      avatarContainer.appendChild(onlineDot);
    }
    avatarContainer.appendChild(avatar);
    msg.appendChild(messageContent);
    msg.appendChild(avatarContainer);
  } else {
    msg.appendChild(messageContent);
  }
  return msg;
}

function setTimestampNode(node, sec) {
  const timeEl = node.querySelector(".timestamp");
  if (!timeEl) return;
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  timeEl.textContent = `${hours}:${minutes}`;
}

function clearMessages() {
  container.innerHTML = "";
}

let mapped = null;
let shown = [];
let audioCtx = null;
let audioBuffer = null;
let sourceNode = null;
let startedAt = null;
let isPlaying = false;
let rafId = null;

async function loadMapping() {
  try {
    const resp = await fetch(OUT_JSON, { cache: "no-store" });
    if (!resp.ok) throw new Error("no out.json");
    const j = await resp.json();
    mapped = j.mapped.map(x => ({ text: x.text, time: x.time }));
  } catch (e) {
    const lines = [
      "Udah lama kenal kita jadi teman","Lama kelamaan jadi tumbuh rasa","Aku tahu kamu udah ada dia","Aku harus apa kita nggak sejalan","","Belum sampai pagi kita masih chatan","Curhat hari-hari sampai ketiduran","Maafin aku nggak bermaksud kelewatan","Mau baper nggak bisa kita cuma teman","","Apa aku tunggu aja sampai kamu putus cinta","Atau aku rebut aja kamu dari si dia","Tapi nggak mau ah aku macam-macam","Biarin aja aku suka diam-diam","","Cuma teman kita cuman teman","Tapi kebawa perasaan","Cuma teman kita cuman teman","Tapi kebawa perasaan","","Kemarin tiba-tiba cerita dia","Bilang lagi marahan aku harus gimana","Mau semangatin tapi nanti kamu baikan","Mau diam begitu tapi kamunya kesepian","","Apa aku tunggu aja sampai kamu putus cinta","Atau aku rebut aja kamu dari si dia","Tapi nggak mau ah aku macam-macam","Biarin aja aku suka diam-diam","","Cuma teman kita cuman teman","Tapi kebawa perasaan","Cuma teman kita cuman teman","Tapi kebawa perasaan"
    ];
    const avail = Math.max(0, 131 - START_OFFSET);
    const nonEmpty = lines.filter(l => l.trim() !== "").length;
    const per = avail / nonEmpty;
    let cursor = START_OFFSET + per/2;
    mapped = lines.map(l => {
      if (l.trim() === "") return { text: "", time: null };
      const t = Math.min(130.5, cursor);
      cursor += per;
      return { text: l, time: t };
    });
  }
}

async function loadAudioBuffer() {
  const resp = await fetch(AUDIO_FILE, { cache: "no-store" });
  const ab = await resp.arrayBuffer();
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioBuffer = await audioCtx.decodeAudioData(ab);
}

function createControls() {
  const ctrl = document.createElement("div");
  ctrl.className = "controls";
  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.textContent = "▶ PUTAR MUSIK";
  btn.onclick = async () => {
    if (!audioCtx) {
      await loadAudioBuffer();
    }
    if (!isPlaying) {
      if (!sourceNode) {
        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(audioCtx.destination);
        const startAt = audioCtx.currentTime + 0.05;
        sourceNode.start(startAt, START_OFFSET);
        startedAt = startAt;
        isPlaying = true;
        btn.textContent = "⏸ JEDA";
        runLoop();
      } else {
        await audioCtx.resume();
        isPlaying = true;
        btn.textContent = "⏸ JEDA";
        runLoop();
      }
    } else {
      await audioCtx.suspend();
      isPlaying = false;
      btn.textContent = "▶ PUTAR MUSIK";
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
  ctrl.appendChild(btn);
  document.body.appendChild(ctrl);
}

function audioTimeNow() {
  if (!audioCtx || startedAt === null) return 0;
  return audioCtx.currentTime - startedAt + START_OFFSET;
}

function runLoop() {
  function step() {
    const t = audioTimeNow();
    if (t < START_OFFSET) {
      removeFuture(t);
      rafId = requestAnimationFrame(step);
      return;
    }
    showDue(t);
    rafId = requestAnimationFrame(step);
  }
  if (!rafId) rafId = requestAnimationFrame(step);
}

function showDue(t) {
  for (let i = 0; i < mapped.length; i++) {
    const m = mapped[i];
    if (!m || m.time === null) continue;
    if (t + 0.02 >= m.time && !shown[i] && t + 0.02 >= START_OFFSET) {
      const side = i % 2 === 0 ? "left" : "right";
      const node = createMessageNode(m.text, side);
      setTimestampNode(node, m.time);
      container.appendChild(node);
      setTimeout(() => {
        node.classList.add("enter-pulse");
      }, 30);
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      shown[i] = true;
    }
  }
}

function removeFuture(t) {
  const nodes = Array.from(container.querySelectorAll(".message"));
  for (let i = 0; i < mapped.length; i++) {
    if (!shown[i]) continue;
    const ts = mapped[i].time;
    if (ts !== null && ts > t + 0.05) {
      const node = nodes.find(n => n.textContent && n.textContent.includes(mapped[i].text));
      if (node) node.remove();
      shown[i] = false;
    }
  }
}

(async function init() {
  await loadMapping();
  shown = new Array(mapped.length).fill(false);
  createControls();
  clearMessages();
})();