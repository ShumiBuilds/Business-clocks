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
    <div class="clock-face" id="face-${i}">
      <div class="center-dot"></div>
      <div class="hour-hand" id="hour-${i}"></div>
      <div class="minute-hand" id="minute-${i}"></div>
      <div class="second-hand" id="second-${i}"></div>
    </div>
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
    const isDigital = face.classList.contains("digital-mode");
    if (isDigital) {
      // Switch back to analog mode
      face.classList.remove("digital-mode");
      // Restore the clock elements
      face.innerHTML = `
        <div class="center-dot"></div>
        <div class="hour-hand" id="hour-${i}"></div>
        <div class="minute-hand" id="minute-${i}"></div>
        <div class="second-hand" id="second-${i}"></div>
      `;
      // Re-add hour marks
      for (let h = 1; h <= 12; h++) {
        const mark = document.createElement("div");
        mark.className = "hour-mark";
        const angle = (h * 30) - 90;
        const radius = 85;
        const x = radius * Math.cos(angle * Math.PI / 180);
        const y = radius * Math.sin(angle * Math.PI / 180);
        mark.style.left = `calc(50% + ${x}px)`;
        mark.style.top = `calc(50% + ${y}px)`;
        mark.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;
        face.appendChild(mark);
      }
    } else {
      // Switch to digital mode
      face.classList.add("digital-mode");
    }
  });
});

function fmtTime(d, tz) {
  return new Intl.DateTimeFormat([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: use12h, timeZone: tz
  }).format(d);
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
    
    // Update digital mode display if active
    const clockFace = document.getElementById(`face-${i}`);
    if (clockFace.classList.contains("digital-mode")) {
      // Show simple digital time
      clockFace.textContent = fmtTime(now, c.tz);
    } else {
      // Make sure analog clock hands exist before updating them
      const hourHand = document.getElementById(`hour-${i}`);
      const minuteHand = document.getElementById(`minute-${i}`);
      const secondHand = document.getElementById(`second-${i}`);
      
      if (hourHand && minuteHand && secondHand) {
        hourHand.style.transform = `rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
        secondHand.style.transform = `rotate(${secondAngle}deg)`;
      }
    }
  });
}

// Buttons
btn24.addEventListener("click", () => { use12h = false; btn24.classList.add("active"); btn12.classList.remove("active"); tick(); });
btn12.addEventListener("click", () => { use12h = true;  btn12.classList.add("active"); btn24.classList.remove("active"); tick(); });

// Start
tick();
setInterval(tick, 1000);