// --- Edit your city list here (name + IANA time zone) ---
const CITIES = [
  { name: "New York",     tz: "America/New_York",     note: "US East" },
  { name: "London",       tz: "Europe/London",        note: "UK" },
  { name: "Tel Aviv",     tz: "Asia/Jerusalem",       note: "IL" },
  { name: "Sydney",       tz: "Australia/Sydney",     note: "AU" },
];

// --- Rendering ---
const container = document.getElementById("clocks");
const utcBadge = document.getElementById("utcNow");
const btn24 = document.getElementById("fmt24");
const btn12 = document.getElementById("fmt12");

let use12h = false;

// Create tiles
CITIES.forEach((c, i) => {
  const card = document.createElement("div");
  card.className = "clock";
  card.innerHTML = `
    <div class="city">${c.name}</div>
    <div class="meta">${c.tz}${c.note ? " • " + c.note : ""}</div>
    <div class="clock-face" id="face-${i}">
      <div class="center-dot"></div>
      <div class="hour-hand" id="hour-${i}"></div>
      <div class="minute-hand" id="minute-${i}"></div>
      <div class="second-hand" id="second-${i}"></div>
    </div>
    <div class="digital-time" id="digital-${i}">--:--:--</div>
    <div class="date" id="date-${i}">—</div>
    <div class="badge" id="offset-${i}"></div>
  `;
  container.appendChild(card);
  
  // Add hour marks
  const face = document.getElementById(`face-${i}`);
  for (let h = 1; h <= 12; h++) {
    const mark = document.createElement("div");
    mark.className = "hour-mark";
    const angle = (h * 30) - 90; // 30 degrees per hour, start at 12 o'clock (-90)
    const radius = 85;
    const x = radius * Math.cos(angle * Math.PI / 180);
    const y = radius * Math.sin(angle * Math.PI / 180);
    mark.style.left = `calc(50% + ${x}px)`;
    mark.style.top = `calc(50% + ${y}px)`;
    mark.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;
    face.appendChild(mark);
  }
  
  // Add click functionality to toggle between analog and digital
  face.addEventListener("click", () => {
    face.classList.toggle("digital-mode");
  });
});

function fmtTime(d, tz) {
  return new Intl.DateTimeFormat([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: use12h, timeZone: tz
  }).format(d);
}

function fmtDate(d, tz) {
  return new Intl.DateTimeFormat([], {
    weekday: "short", year: "numeric", month: "short", day: "2-digit",
    timeZone: tz
  }).format(d);
}

// Compute UTC offset label like UTC+2 / UTC-5:30
function tzOffsetLabel(tz) {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit"
  });
  const partsLocal = fmt.formatToParts(d);
  const hmLocal = partsLocal.reduce((a,p)=> (p.type==="hour"||p.type==="minute")? a+p.value.padStart(2,"0")+ (p.type==="hour"?":":"") : a, "");
  const [hStr, mStr] = hmLocal.split(":");
  const now = Date.now();
  const utc = new Date(now);
  const asUTC = new Intl.DateTimeFormat([], { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false }).format(utc);
  const asTZ  = new Intl.DateTimeFormat([], { timeZone: tz,     hour: "2-digit", minute: "2-digit", hour12: false }).format(utc);
  const [uh, um] = asUTC.split(":").map(Number);
  const [th, tm] = asTZ.split(":").map(Number);
  let minutes = (th*60 + tm) - (uh*60 + um);
  if (minutes <= -720) minutes += 1440;
  if (minutes >   720) minutes -= 1440;
  const sign = minutes >= 0 ? "+" : "−";
  minutes = Math.abs(minutes);
  const hh = Math.floor(minutes/60).toString();
  const mm = (minutes%60).toString().padStart(2,"0");
  return `UTC${sign}${hh}${mm==="00" ? "" : ":"+mm}`;
}

function tick() {
  const now = new Date();
  
  // Update UTC badge
  utcBadge.textContent = "UTC " + new Intl.DateTimeFormat([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "UTC"
  }).format(now);

  // Update all city cards
  CITIES.forEach((c, i) => {
    // Get time in this timezone
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: c.tz }));
    
    // Calculate angles for clock hands
    const hours = localTime.getHours() % 12;
    const minutes = localTime.getMinutes();
    const seconds = localTime.getSeconds();
    
    const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + 0.5 degrees per minute
    const minuteAngle = minutes * 6; // 6 degrees per minute
    const secondAngle = seconds * 6; // 6 degrees per minute
    
    // Update clock hands
    document.getElementById(`hour-${i}`).style.transform = `rotate(${hourAngle}deg)`;
    document.getElementById(`minute-${i}`).style.transform = `rotate(${minuteAngle}deg)`;
    document.getElementById(`second-${i}`).style.transform = `rotate(${secondAngle}deg)`;
    
    // Update digital time and date
    document.getElementById(`digital-${i}`).textContent = fmtTime(now, c.tz);
    document.getElementById(`date-${i}`).textContent = fmtDate(now, c.tz);
    document.getElementById(`offset-${i}`).textContent = tzOffsetLabel(c.tz);
    
    // Update digital mode display if active
    const clockFace = document.getElementById(`face-${i}`);
    if (clockFace.classList.contains("digital-mode")) {
      clockFace.textContent = fmtTime(now, c.tz);
    }
  });
}

// Buttons
btn24.addEventListener("click", () => { use12h = false; btn24.classList.add("active"); btn12.classList.remove("active"); tick(); });
btn12.addEventListener("click", () => { use12h = true;  btn12.classList.add("active"); btn24.classList.remove("active"); tick(); });

// Start
tick();
setInterval(tick, 1000);