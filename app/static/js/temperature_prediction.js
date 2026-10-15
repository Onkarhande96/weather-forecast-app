// AtmosphereX Temperature Prediction Controller
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();

  let tempChart = null;
  let currentProjections = [];

  const baseTempInput = document.getElementById('baseTempInput');
  const horizonSelect = document.getElementById('horizonSelect');
  const uhiSlider = document.getElementById('uhiSlider');
  const uhiVal = document.getElementById('uhiVal');
  const humidityInput = document.getElementById('tempHumidityInput');
  const runBtn = document.getElementById('runTempPredictionBtn');
  const loadPuneBtn = document.getElementById('loadPuneTempBtn');
  const exportCsvBtn = document.getElementById('exportTempCsvBtn');

  // Stats
  const peakTempVal = document.getElementById('peakTempVal');
  const peakTempTime = document.getElementById('peakTempTime');
  const minTempVal = document.getElementById('minTempVal');
  const minTempTime = document.getElementById('minTempTime');
  const thermalSpreadVal = document.getElementById('thermalSpreadVal');
  const tableBody = document.getElementById('tempProjectionBody');

  // Slider listener
  if (uhiSlider && uhiVal) {
    uhiSlider.addEventListener('input', (e) => {
      uhiVal.textContent = `+${parseFloat(e.target.value).toFixed(1)}°C`;
    });
  }

  // Load Pune Ambient
  if (loadPuneBtn) {
    loadPuneBtn.addEventListener('click', async () => {
      loadPuneBtn.disabled = true;
      loadPuneBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      try {
        const res = await fetch('/api/weather?lat=18.5204&lon=73.8567&name=Pune');
        const data = await res.json();
        const cur = data.current || {};
        if (cur.temperature !== undefined) {
          baseTempInput.value = cur.temperature;
        }
        if (cur.relative_humidity !== undefined) {
          humidityInput.value = cur.relative_humidity;
        }
        triggerProjection();
      } catch (e) {
        console.error(e);
      } finally {
        loadPuneBtn.disabled = false;
        loadPuneBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Load Live Pune Ambient';
      }
    });
  }

  if (runBtn) {
    runBtn.addEventListener('click', triggerProjection);
  }

  // Initial trigger
  triggerProjection();

  async function triggerProjection() {
    const baseTemp = parseFloat(baseTempInput.value) || 28.4;
    const horizon = parseInt(horizonSelect.value) || 24;
    const uhi = parseFloat(uhiSlider.value) || 0.0;
    const hum = parseFloat(humidityInput.value) || 50.0;

    try {
      const url = `/api/predict/temperature?base_temp=${baseTemp}&horizon_hours=${horizon}&heat_island_delta=${uhi}&humidity_factor=${hum}`;
      const res = await fetch(url);
      const data = await res.json();
      currentProjections = data.projections || [];

      // Update Summary
      const summary = data.summary || {};
      peakTempVal.textContent = `${summary.max_predicted_temp}°C`;
      peakTempTime.textContent = summary.max_hour || '';
      minTempVal.textContent = `${summary.min_predicted_temp}°C`;
      minTempTime.textContent = summary.min_hour || '';
      thermalSpreadVal.textContent = `${summary.thermal_range}°C`;

      renderChart(currentProjections);
      renderTable(currentProjections);
    } catch (err) {
      console.error('Failed to project temperature', err);
    }
  }

  function renderChart(projections) {
    const ctx = document.getElementById('tempProjectionChart');
    if (!ctx) return;

    const labels = projections.map(p => p.hour_label);
    const temps = projections.map(p => p.predicted_temp);
    const feels = projections.map(p => p.feels_like);
    const upper = projections.map(p => p.ci_upper);
    const lower = projections.map(p => p.ci_lower);

    if (tempChart) {
      tempChart.destroy();
    }

    tempChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Predicted Ambient Temp (°C)',
            data: temps,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            fill: false,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Perceived "Feels-Like" Temp (°C)',
            data: feels,
            borderColor: '#a855f7',
            borderDash: [4, 4],
            fill: false,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3
          },
          {
            label: 'Upper 95% Confidence Bound',
            data: upper,
            borderColor: 'transparent',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            fill: '+1',
            pointRadius: 0
          },
          {
            label: 'Lower 95% Confidence Bound',
            data: lower,
            borderColor: 'transparent',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: getTextColor() }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: getTextColor() }
          },
          y: {
            title: { display: true, text: 'Temperature (°C)', color: getTextColor() },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: getTextColor() }
          }
        }
      }
    });
  }

  function renderTable(projections) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    projections.forEach(p => {
      const tr = document.createElement('tr');
      const trendIcon = p.trend === 'Rising' ? '<i class="fas fa-arrow-trend-up text-orange"></i> Heating' : '<i class="fas fa-arrow-trend-down text-cyan"></i> Cooling';
      tr.innerHTML = `
        <td><strong>${p.hour_label}</strong></td>
        <td><span class="badge-temp">${p.predicted_temp}°C</span></td>
        <td>${p.feels_like}°C</td>
        <td><code>[${p.ci_lower}°C – ${p.ci_upper}°C]</code></td>
        <td>${trendIcon}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Export CSV
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      let csv = 'Time Horizon,Predicted Temp (C),Feels-Like (C),CI Lower (C),CI Upper (C),Trend\r\n';
      currentProjections.forEach(p => {
        csv += `"${p.hour_label}",${p.predicted_temp},${p.feels_like},${p.ci_lower},${p.ci_upper},"${p.trend}"\r\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AtmosphereX_Temperature_Forecast_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function getTextColor() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return isLight ? '#475569' : '#94a3b8';
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
