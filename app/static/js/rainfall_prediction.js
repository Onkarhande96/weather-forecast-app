// AtmosphereX Rainfall Prediction Controller
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();

  const form = document.getElementById('rainfallForm');
  const loadPuneBtn = document.getElementById('loadCurrentPuneBtn');

  // Outputs
  const probNumber = document.getElementById('probNumber');
  const probCircle = document.getElementById('probCircle');
  const intensityBadge = document.getElementById('intensityBadge');
  const intensityIcon = document.getElementById('intensityIcon');
  const intensityText = document.getElementById('intensityText');
  const expectedVolume = document.getElementById('expectedVolume');
  const dewDepression = document.getElementById('dewDepression');
  const riskLevelText = document.getElementById('riskLevelText');
  const advisoryText = document.getElementById('advisoryText');
  const driversList = document.getElementById('driversList');
  const confidenceBadge = document.getElementById('rfModelConfidenceBadge');

  // Load Pune Station live values
  if (loadPuneBtn) {
    loadPuneBtn.addEventListener('click', async () => {
      loadPuneBtn.disabled = true;
      loadPuneBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      try {
        const res = await fetch('/api/weather?lat=18.5204&lon=73.8567&name=Pune');
        const data = await res.json();
        const cur = data.current || {};

        document.getElementById('rfTemp').value = cur.temperature !== undefined ? cur.temperature : 28.5;
        document.getElementById('rfHumidity').value = cur.relative_humidity !== undefined ? cur.relative_humidity : 68;
        document.getElementById('rfPressure').value = cur.surface_pressure !== undefined ? cur.surface_pressure : 1012.0;
        document.getElementById('rfCloud').value = cur.cloud_cover !== undefined ? cur.cloud_cover : 45;
        document.getElementById('rfWind').value = cur.wind_speed !== undefined ? cur.wind_speed : 12.0;

        // Approx dew point
        const t = parseFloat(document.getElementById('rfTemp').value);
        const rh = parseFloat(document.getElementById('rfHumidity').value);
        const a = 17.27, b = 237.7;
        const alpha = ((a * t) / (b + t)) + Math.log(Math.max(rh, 1) / 100);
        const dp = (b * alpha) / (a - alpha);
        document.getElementById('rfDew').value = dp.toFixed(1);

        // Run prediction automatically
        triggerPrediction();
      } catch (err) {
        console.error('Failed to load Pune data', err);
      } finally {
        loadPuneBtn.disabled = false;
        loadPuneBtn.innerHTML = '<i class="fas fa-rotate"></i> Load Pune Station Data';
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      triggerPrediction();
    });
  }

  async function triggerPrediction() {
    const temp = parseFloat(document.getElementById('rfTemp').value);
    const humidity = parseFloat(document.getElementById('rfHumidity').value);
    const pressure = parseFloat(document.getElementById('rfPressure').value);
    const cloudCover = parseFloat(document.getElementById('rfCloud').value);
    const windSpeed = parseFloat(document.getElementById('rfWind').value);
    const dewPoint = parseFloat(document.getElementById('rfDew').value);

    try {
      const url = `/api/predict/rainfall?temp=${temp}&humidity=${humidity}&pressure=${pressure}&cloud_cover=${cloudCover}&wind_speed=${windSpeed}&dew_point=${dewPoint}`;
      const res = await fetch(url);
      const data = await res.json();
      renderPrediction(data);
    } catch (e) {
      console.warn('Local calculation fallback', e);
    }
  }

  function renderPrediction(data) {
    const prob = data.probability_percent;
    probNumber.textContent = `${prob}%`;

    // Dynamic color circle based on probability
    if (prob > 70) {
      probCircle.style.borderColor = '#ef4444';
      probCircle.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.35)';
    } else if (prob > 40) {
      probCircle.style.borderColor = '#f59e0b';
      probCircle.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.35)';
    } else {
      probCircle.style.borderColor = '#10b981';
      probCircle.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.35)';
    }

    // Badge styling
    intensityBadge.className = `intensity-badge ${data.badge_class}`;
    intensityText.textContent = data.intensity;

    if (data.risk_level === 'High') {
      intensityIcon.className = 'fas fa-cloud-bolt text-red';
    } else if (data.risk_level === 'Moderate') {
      intensityIcon.className = 'fas fa-cloud-rain text-orange';
    } else if (data.risk_level === 'Low') {
      intensityIcon.className = 'fas fa-cloud-sun-rain text-blue';
    } else {
      intensityIcon.className = 'fas fa-sun text-green';
    }

    expectedVolume.textContent = `${data.volume_mm} mm/hr`;
    dewDepression.textContent = `${data.depression}°C`;
    riskLevelText.textContent = `${data.risk_level} Risk`;
    advisoryText.textContent = data.advisory;
    confidenceBadge.textContent = `Confidence: ${data.model_confidence}%`;

    // Drivers
    driversList.innerHTML = '';
    (data.primary_drivers || []).forEach(d => {
      const li = document.createElement('li');
      li.textContent = d;
      driversList.appendChild(li);
    });
  }

  function initTheme() {
    const saved = localStorage.getItem('atmospherex_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.className = saved === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    }
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('atmospherex_theme', next);
        if (themeIcon) {
          themeIcon.className = next === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
      });
    }
  }

  function initClock() {
    const clockEl = document.getElementById('clockTime');
    function tick() {
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    }
    tick();
    setInterval(tick, 1000);
  }
});
