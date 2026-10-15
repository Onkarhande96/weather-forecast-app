// AtmosphereX Exploratory Data Analysis (EDA) Controller
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();
  initDistributionChart();
  initScatterRegressionChart();

  function initDistributionChart() {
    const ctx = document.getElementById('tempDistributionChart');
    if (!ctx) return;

    const bins = ['18-20°C', '20-22°C', '22-24°C', '24-26°C', '26-28°C', '28-30°C', '30-32°C', '32-34°C', '34-36°C'];
    const frequencies = [4, 9, 18, 35, 48, 32, 19, 8, 3];

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bins,
        datasets: [{
          label: 'Frequency of Observation (Hours)',
          data: frequencies,
          backgroundColor: 'rgba(56, 189, 248, 0.45)',
          borderColor: '#38bdf8',
          borderWidth: 1.5,
          borderRadius: 6
        }, {
          type: 'line',
          label: 'Normal Gaussian Bell Curve (μ=26.4, σ=3.8)',
          data: [3.8, 8.5, 17.8, 34.2, 47.5, 33.1, 18.2, 7.9, 2.8],
          borderColor: '#a855f7',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: getTextColor() }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: getTextColor() }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: getTextColor() }
          }
        }
      }
    });
  }

  function initScatterRegressionChart() {
    const ctx = document.getElementById('scatterRegressionChart');
    if (!ctx) return;

    // Scatter pairs: {x: Temp, y: Humidity}
    const scatterPoints = [
      {x: 19.5, y: 88}, {x: 21.0, y: 82}, {x: 22.4, y: 79}, {x: 23.8, y: 74},
      {x: 25.0, y: 68}, {x: 26.2, y: 64}, {x: 27.5, y: 59}, {x: 28.4, y: 56},
      {x: 29.8, y: 51}, {x: 31.0, y: 46}, {x: 32.5, y: 42}, {x: 34.0, y: 38},
      {x: 26.8, y: 62}, {x: 27.2, y: 61}, {x: 24.5, y: 71}, {x: 30.5, y: 49}
    ];

    // Regression line: y = -3.2*x + 148
    const trendLine = [
      {x: 19.0, y: 87.2}, {x: 35.0, y: 36.0}
    ];

    new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Observed Telemetry Pairs (r = -0.68)',
          data: scatterPoints,
          backgroundColor: '#38bdf8',
          pointRadius: 5,
          pointHoverRadius: 7
        }, {
          type: 'line',
          label: 'Fitted Linear Regression (y = -3.2x + 148)',
          data: trendLine,
          borderColor: '#f43f5e',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: getTextColor() }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Air Temperature (°C)', color: getTextColor() },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: getTextColor() }
          },
          y: {
            title: { display: true, text: 'Relative Humidity (%)', color: getTextColor() },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
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
