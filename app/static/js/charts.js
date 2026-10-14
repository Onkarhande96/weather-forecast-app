// AtmosphereX Chart.js Integration

class WeatherCharts {
  constructor() {
    this.chartInstance = null;
    this.currentData = null;
    this.activeType = 'temp'; // 'temp', 'rain', 'wind'
    this.initEventListeners();
  }

  initEventListeners() {
    const tabs = document.querySelectorAll('.chart-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.activeType = e.target.dataset.chart;
        this.render();
      });
    });
  }

  updateData(weatherData) {
    this.currentData = weatherData;
    this.render();
  }

  render() {
    if (!this.currentData || !this.currentData.hourly) return;

    const ctx = document.getElementById('weatherTrendsChart');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const hourly = this.currentData.hourly.slice(0, 24); // Next 24 hours
    const labels = hourly.map(item => {
      const dt = new Date(item.time);
      return dt.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    });

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDarkMode ? '#94a3b8' : '#475569';
    const unitTemp = this.currentData.units.temperature || '°C';
    const unitWind = this.currentData.units.wind_speed || 'km/h';

    let config = {};

    if (this.activeType === 'temp') {
      const temps = hourly.map(h => h.temperature);
      const feels = hourly.map(h => h.feels_like);

      config = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: `Temperature (${unitTemp})`,
              data: temps,
              borderColor: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#38bdf8',
              pointRadius: 3,
              pointHoverRadius: 6
            },
            {
              label: `Feels Like (${unitTemp})`,
              data: feels,
              borderColor: '#f59e0b',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 5],
              tension: 0.4,
              pointBackgroundColor: '#f59e0b',
              pointRadius: 2,
              pointHoverRadius: 5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor, font: { family: 'Inter', size: 12 } }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: '#fff',
              bodyColor: '#e2e8f0',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              padding: 10
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { family: 'Inter', size: 11 },
                callback: (val) => `${val}${unitTemp}`
              }
            }
          }
        }
      };

    } else if (this.activeType === 'rain') {
      const rainChances = hourly.map(h => h.precipitation_probability);
      const rainSums = hourly.map(h => h.precipitation);

      config = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              type: 'bar',
              label: 'Precipitation Probability (%)',
              data: rainChances,
              backgroundColor: 'rgba(56, 189, 248, 0.65)',
              borderRadius: 6,
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: 'Precipitation Amount (mm)',
              data: rainSums,
              borderColor: '#6366f1',
              backgroundColor: 'transparent',
              borderWidth: 2,
              pointBackgroundColor: '#6366f1',
              tension: 0.3,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { family: 'Inter', size: 12 } } },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(15, 23, 42, 0.9)'
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
            },
            y: {
              type: 'linear',
              position: 'left',
              min: 0,
              max: 100,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { family: 'Inter', size: 11 },
                callback: (val) => `${val}%`
              }
            },
            y1: {
              type: 'linear',
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: {
                color: textColor,
                font: { family: 'Inter', size: 11 },
                callback: (val) => `${val}mm`
              }
            }
          }
        }
      };

    } else if (this.activeType === 'wind') {
      const winds = hourly.map(h => h.wind_speed);

      config = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: `Wind Speed (${unitWind})`,
              data: winds,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderWidth: 3,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#10b981',
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { family: 'Inter', size: 12 } } }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { family: 'Inter', size: 11 },
                callback: (val) => `${val} ${unitWind}`
              }
            }
          }
        }
      };
    }

    this.chartInstance = new Chart(ctx, config);
  }
}

window.WeatherCharts = WeatherCharts;
