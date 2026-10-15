// AtmosphereX Advanced Data Visualization Studio Controller
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();

  let multiParamChart = null;
  let pollutantRadarChart = null;
  let windPolarChart = null;
  let thermalRangeChart = null;
  let solarUvChart = null;

  const stationSelect = document.getElementById('vizStationSelect');
  const refreshBtn = document.getElementById('refreshVizBtn');

  // Station dataset presets
  const stationDatasets = {
    'Pune': {
      temp: [22, 21, 21, 23, 26, 29, 32, 33, 31, 28, 25, 23],
      hum: [82, 85, 84, 76, 62, 51, 44, 42, 50, 65, 74, 80],
      dew: [19, 18, 18, 19, 18, 18, 18, 18, 19, 21, 20, 19],
      aqi: [34, 48, 28, 38, 12, 0.4],
      wind: [12, 16, 14, 8, 10, 15, 22, 18],
      rangeMin: [20, 21, 20, 22, 21, 20, 21],
      rangeMax: [32, 33, 34, 33, 31, 32, 33],
      solar: [0, 0, 120, 380, 680, 890, 940, 820, 540, 210, 0, 0],
      uv: [0, 0, 1.2, 3.8, 6.5, 8.9, 9.4, 7.8, 4.9, 1.8, 0, 0]
    },
    'Mumbai': {
      temp: [26, 26, 27, 28, 31, 33, 33, 32, 30, 29, 28, 27],
      hum: [88, 89, 87, 82, 74, 69, 71, 75, 82, 85, 86, 88],
      dew: [24, 24, 25, 25, 26, 27, 27, 27, 27, 26, 25, 25],
      aqi: [46, 62, 35, 42, 18, 0.6],
      wind: [18, 22, 20, 14, 16, 24, 28, 22],
      rangeMin: [25, 26, 25, 26, 25, 25, 26],
      rangeMax: [33, 34, 33, 34, 33, 33, 34],
      solar: [0, 0, 110, 360, 640, 850, 910, 780, 510, 190, 0, 0],
      uv: [0, 0, 1.1, 3.5, 6.2, 8.4, 8.9, 7.4, 4.6, 1.6, 0, 0]
    },
    'New Delhi': {
      temp: [20, 19, 19, 22, 27, 31, 34, 35, 33, 29, 25, 22],
      hum: [72, 75, 74, 62, 48, 38, 32, 30, 38, 52, 64, 70],
      dew: [15, 14, 14, 14, 15, 15, 14, 14, 16, 18, 17, 16],
      aqi: [82, 110, 48, 65, 24, 1.1],
      wind: [8, 10, 9, 6, 7, 11, 14, 10],
      rangeMin: [18, 19, 18, 19, 20, 19, 18],
      rangeMax: [34, 35, 35, 36, 35, 34, 35],
      solar: [0, 0, 95, 320, 590, 810, 880, 740, 480, 170, 0, 0],
      uv: [0, 0, 0.9, 3.1, 5.8, 7.9, 8.5, 7.0, 4.2, 1.4, 0, 0]
    },
    'Bengaluru': {
      temp: [18, 18, 19, 21, 24, 27, 28, 28, 26, 23, 21, 19],
      hum: [84, 86, 85, 78, 65, 54, 48, 46, 55, 68, 79, 82],
      dew: [15, 15, 16, 17, 17, 17, 16, 16, 17, 17, 17, 16],
      aqi: [24, 36, 22, 28, 9, 0.3],
      wind: [14, 18, 16, 12, 15, 19, 24, 18],
      rangeMin: [17, 18, 18, 18, 19, 18, 17],
      rangeMax: [28, 29, 29, 28, 27, 28, 29],
      solar: [0, 0, 130, 410, 710, 930, 980, 860, 570, 230, 0, 0],
      uv: [0, 0, 1.3, 4.1, 7.0, 9.3, 9.8, 8.2, 5.3, 2.0, 0, 0]
    },
    'London': {
      temp: [9, 8, 8, 10, 13, 16, 18, 17, 15, 13, 11, 10],
      hum: [89, 91, 90, 84, 76, 68, 64, 66, 74, 82, 87, 88],
      dew: [7, 7, 6, 7, 8, 10, 11, 11, 10, 10, 9, 8],
      aqi: [18, 24, 20, 22, 8, 0.2],
      wind: [20, 24, 22, 18, 22, 26, 30, 25],
      rangeMin: [7, 8, 8, 9, 8, 7, 8],
      rangeMax: [17, 18, 17, 18, 16, 17, 18],
      solar: [0, 0, 60, 210, 420, 620, 680, 560, 340, 110, 0, 0],
      uv: [0, 0, 0.5, 1.8, 3.6, 5.2, 5.7, 4.5, 2.7, 0.8, 0, 0]
    },
    'Tokyo': {
      temp: [14, 13, 13, 15, 19, 22, 24, 23, 21, 18, 16, 15],
      hum: [78, 81, 80, 72, 60, 52, 48, 50, 60, 70, 75, 78],
      dew: [10, 10, 9, 10, 11, 12, 12, 12, 13, 13, 12, 11],
      aqi: [22, 32, 25, 26, 10, 0.3],
      wind: [15, 18, 17, 13, 16, 21, 25, 19],
      rangeMin: [12, 13, 13, 14, 13, 12, 13],
      rangeMax: [23, 24, 25, 24, 23, 24, 24],
      solar: [0, 0, 85, 290, 550, 760, 830, 690, 440, 150, 0, 0],
      uv: [0, 0, 0.8, 2.7, 5.1, 7.2, 7.8, 6.3, 3.9, 1.2, 0, 0]
    }
  };

  renderAllCharts('Pune');

  if (stationSelect) {
    stationSelect.addEventListener('change', (e) => {
      renderAllCharts(e.target.value);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const city = stationSelect ? stationSelect.value : 'Pune';
      renderAllCharts(city);
    });
  }

  function renderAllCharts(city) {
    const data = stationDatasets[city] || stationDatasets['Pune'];
    renderMultiParamChart(data);
    renderPollutantRadar(data);
    renderWindPolar(data);
    renderThermalRange(data);
    renderSolarUv(data);
  }

  // 1. Multi-Parameter Chart (Dual Y-Axis)
  function renderMultiParamChart(data) {
    const ctx = document.getElementById('multiParamChart');
    if (!ctx) return;
    if (multiParamChart) multiParamChart.destroy();

    const hours = ['02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'];

    multiParamChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: data.temp,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            yAxisID: 'yTemp',
            tension: 0.35,
            borderWidth: 2.5
          },
          {
            label: 'Relative Humidity (%)',
            data: data.hum,
            borderColor: '#6366f1',
            backgroundColor: 'transparent',
            yAxisID: 'yHum',
            borderDash: [4, 4],
            tension: 0.35,
            borderWidth: 2
          },
          {
            label: 'Dew Point (°C)',
            data: data.dew,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            yAxisID: 'yTemp',
            tension: 0.35,
            borderWidth: 1.5,
            pointRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: getTextColor() } }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: getTextColor() }
          },
          yTemp: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Temp / Dew Point (°C)', color: '#38bdf8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: getTextColor() }
          },
          yHum: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Humidity (%)', color: '#6366f1' },
            grid: { drawOnChartArea: false },
            ticks: { color: getTextColor() }
          }
        }
      }
    });
  }

  // 2. Pollutant Radar Chart
  function renderPollutantRadar(data) {
    const ctx = document.getElementById('pollutantRadarChart');
    if (!ctx) return;
    if (pollutantRadarChart) pollutantRadarChart.destroy();

    pollutantRadarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['PM2.5 (µg)', 'PM10 (µg)', 'O3 (µg)', 'NO2 (µg)', 'SO2 (µg)', 'CO (mg)'],
        datasets: [
          {
            label: 'Observed Pollutants',
            data: data.aqi,
            backgroundColor: 'rgba(56, 189, 248, 0.3)',
            borderColor: '#38bdf8',
            pointBackgroundColor: '#38bdf8',
            borderWidth: 2
          },
          {
            label: 'WHO Safety Limit',
            data: [15, 45, 60, 40, 20, 4.0],
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444',
            borderDash: [3, 3],
            pointRadius: 2,
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: getTextColor() } }
        },
        scales: {
          r: {
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: { color: getTextColor() },
            ticks: { display: false }
          }
        }
      }
    });
  }

  // 3. Wind Polar Rose
  function renderWindPolar(data) {
    const ctx = document.getElementById('windPolarChart');
    if (!ctx) return;
    if (windPolarChart) windPolarChart.destroy();

    windPolarChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['North (N)', 'North-East (NE)', 'East (E)', 'South-East (SE)', 'South (S)', 'South-West (SW)', 'West (W)', 'North-West (NW)'],
        datasets: [{
          data: data.wind,
          backgroundColor: [
            'rgba(56, 189, 248, 0.5)',
            'rgba(14, 165, 233, 0.5)',
            'rgba(99, 102, 241, 0.5)',
            'rgba(139, 92, 246, 0.5)',
            'rgba(168, 85, 247, 0.5)',
            'rgba(217, 70, 239, 0.5)',
            'rgba(244, 63, 94, 0.5)',
            'rgba(6, 182, 212, 0.5)'
          ],
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: getTextColor() } }
        },
        scales: {
          r: {
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: { display: false }
          }
        }
      }
    });
  }

  // 4. 7-Day Thermal Range
  function renderThermalRange(data) {
    const ctx = document.getElementById('thermalRangeChart');
    if (!ctx) return;
    if (thermalRangeChart) thermalRangeChart.destroy();

    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

    thermalRangeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Maximum Temp (°C)',
            data: data.rangeMax,
            backgroundColor: 'rgba(244, 63, 94, 0.6)',
            borderColor: '#f43f5e',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Minimum Temp (°C)',
            data: data.rangeMin,
            backgroundColor: 'rgba(56, 189, 248, 0.6)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: getTextColor() } }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: getTextColor() }
          },
          y: {
            title: { display: true, text: 'Temperature (°C)', color: getTextColor() },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: getTextColor() }
          }
        }
      }
    });
  }

  // 5. Solar Insolation & UV Flux
  function renderSolarUv(data) {
    const ctx = document.getElementById('solarUvChart');
    if (!ctx) return;
    if (solarUvChart) solarUvChart.destroy();

    const hours = ['02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'];

    solarUvChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          {
            label: 'Global Horizontal Solar Insolation (W/m²)',
            data: data.solar,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            fill: true,
            yAxisID: 'ySolar',
            tension: 0.4,
            borderWidth: 2.5
          },
          {
            label: 'Solar UV Index (Rating)',
            data: data.uv,
            borderColor: '#a855f7',
            backgroundColor: 'transparent',
            yAxisID: 'yUv',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: getTextColor() } }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: getTextColor() }
          },
          ySolar: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Solar Flux (Watts/m²)', color: '#f59e0b' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: getTextColor() }
          },
          yUv: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'UV Index Scale', color: '#a855f7' },
            grid: { drawOnChartArea: false },
            ticks: { color: getTextColor() }
          }
        }
      }
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
        renderAllCharts(stationSelect ? stationSelect.value : 'Pune');
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
