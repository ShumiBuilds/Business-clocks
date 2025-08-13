// Simple world-click time map
// Uses: Leaflet, Natural Earth GeoJSON via geojson.xyz, Moment Timezone

const COUNTRY_GEOJSON =
  "https://geojson.xyz/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson";

let map;

// Initialize map
window.addEventListener("load", async () => {
  map = L.map("map", { worldCopyJump: true, minZoom: 2 }).setView([20, 0], 2);

  // Basemap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 5,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  // Load countries
  const geojson = await fetch(COUNTRY_GEOJSON).then((r) => r.json());

  // Style
  function style() {
    return {
      weight: 0.6,
      color: "#333",
      opacity: 0.6,
      fillColor: "#ffffff",
      fillOpacity: 0.6,
    };
  }

  function highlight(e) {
    const layer = e.target;
    layer.setStyle({ weight: 1.2, color: "#2563eb", fillOpacity: 0.8 });
    layer.bringToFront();
  }
  function reset(e) {
    countries.resetStyle(e.target);
  }

  // Click handler: show current time(s)
  function onCountryClick(e) {
    const layer = e.target;
    const p = layer.feature.properties || {};
    const name = p.NAME || p.ADMIN || "Unknown country";
    const iso2 = (p.ISO_A2 || "").toUpperCase();

    let html = `<strong>${name}</strong><br/>`;

    // Use Moment Timezone's country → zones mapping
    let zones = [];
    try {
      zones = moment.tz.zonesForCountry(iso2, true) || [];
    } catch (_) {
      zones = [];
    }

    if (!zones.length) {
      // Fallback: use centroid timezone (best-effort)
      const center = layer.getBounds().getCenter();
      html += `<em>No country timezone map available. Showing approximate local time.</em><br/>`;
      const guessed = guessTimezoneFromOffset(center.lng);
      html += `<div>~ ${formatNow(guessed)} <small>(${guessed})</small></div>`;
    } else {
      // Show up to first 4 zones (most countries have 1)
      zones.slice(0, 4).forEach((z) => {
        const zoneName = typeof z === "string" ? z : z.name; // API may return objects
        html += `<div>${formatNow(zoneName)} <small>(${zoneName})</small></div>`;
      });
      if (zones.length > 4) {
        html += `<small>+${zones.length - 4} more time zone(s)</small>`;
      }
    }

    L.popup({ maxWidth: 260 })
      .setLatLng(e.latlng)
      .setContent(html)
      .openOn(map);
  }

  // Layer
  const countries = L.geoJSON(geojson, {
    style,
    onEachFeature: (feature, layer) => {
      layer.on({
        mouseover: highlight,
        mouseout: reset,
        click: onCountryClick,
      });
    },
  }).addTo(map);

  // Fit world nicely
  map.fitBounds(countries.getBounds(), { padding: [10, 10] });
});

// Helpers
function formatNow(timeZone) {
  try {
    const fmt = new Intl.DateTimeFormat([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone,
    });
    return fmt.format(new Date());
  } catch {
    // If invalid TZ, fallback to UTC
    const fmt = new Intl.DateTimeFormat([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
    return fmt.format(new Date()) + " UTC";
  }
}

// Very rough fallback if we have no IANA zone for the country.
// Guess by longitude (15° per hour). Returns an IANA-like label for display only.
function guessTimezoneFromOffset(lng) {
  const offset = Math.round(lng / 15);
  const sign = offset >= 0 ? "+" : "-";
  const pad = Math.abs(offset).toString().padStart(2, "0");
  // This is only a label; we still need a real tz for formatting:
  // Use Etc/GMT±X which follows reverse sign convention.
  const etc = `Etc/GMT${offset <= 0 ? "+" + Math.abs(offset) : "-" + Math.abs(offset)}`;
  return etc;
}
