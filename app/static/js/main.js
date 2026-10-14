// AtmosphereX Main Controller

document.addEventListener('DOMContentLoaded', () => {
  // App State - Default to Pune, Maharashtra, India
  const state = {
    lat: 18.5204,
    lon: 73.8567,
    name: 'Pune',
    country: 'India',
    admin1: 'Maharashtra',
    tempUnit: localStorage.getItem('atmos_temp_unit') || 'celsius',
    windUnit: localStorage.getItem('atmos_temp_unit') === 'fahrenheit' ? 'mph' : 'kmh',
    theme: localStorage.getItem('atmos_theme') || 'dark',
    provider: localStorage.getItem('atmos_provider') || 'open-meteo',
    owmApiKey: localStorage.getItem('atmos_owm_key') || '',
    recentSearches: JSON.parse(localStorage.getItem('atmos_recent') || '[]'),
    weatherData: null
  };

  // DOM Elements
  const elements = {
    // Clock
    clockTime: document.getElementById('clockTime'),
    // Theme & Units
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    unitToggle: document.getElementById('unitToggle'),
    // Search & Geolocation
    citySearchInput: document.getElementById('citySearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchSpinner: document.getElementById('searchSpinner'),
    autocompleteDropdown: document.getElementById('autocompleteDropdown'),
    gpsLocationBtn: document.getElementById('gpsLocationBtn'),
    recentChipsWrapper: document.getElementById('recentChipsWrapper'),
    // States
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    weatherContent: document.getElementById('weatherContent'),
    alertsWrapper: document.getElementById('alertsWrapper'),
    // Hero Card
    heroLocation: document.getElementById('heroLocation'),
    heroSubtitle: document.getElementById('heroSubtitle'),
    heroProviderBadge: document.getElementById('heroProviderBadge'),
    heroProviderText: document.getElementById('heroProviderText'),
    heroTemp: document.getElementById('heroTemp'),
    heroTempUnit: document.getElementById('heroTempUnit'),
    heroFeelsLike: document.getElementById('heroFeelsLike'),
    heroTempMax: document.getElementById('heroTempMax'),
    heroTempMin: document.getElementById('heroTempMin'),
    heroWeatherIcon: document.getElementById('heroWeatherIcon'),
    heroCondition: document.getElementById('heroCondition'),
    heroHumidity: document.getElementById('heroHumidity'),
    heroWind: document.getElementById('heroWind'),
    heroPressure: document.getElementById('heroPressure'),
    heroUV: document.getElementById('heroUV'),
    // Highlights
    aqiScore: document.getElementById('aqiScore'),
    aqiBadge: document.getElementById('aqiBadge'),
    aqiProgressFill: document.getElementById('aqiProgressFill'),
    aqiAdvice: document.getElementById('aqiAdvice'),
    heroSunrise: document.getElementById('heroSunrise'),
    heroSunset: document.getElementById('heroSunset'),
    sunTrackPosition: document.getElementById('sunTrackPosition'),
    compassNeedle: document.getElementById('compassNeedle'),
    windSpeedDetail: document.getElementById('windSpeedDetail'),
    windGustDetail: document.getElementById('windGustDetail'),
    windDirDetail: document.getElementById('windDirDetail'),
    heroPrecipChance: document.getElementById('heroPrecipChance'),
    heroPrecipSum: document.getElementById('heroPrecipSum'),
    heroCloudCover: document.getElementById('heroCloudCover'),
    // Sections
    hourlyCarousel: document.getElementById('hourlyCarousel'),
    dailyList: document.getElementById('dailyList'),
    pollutantGrid: document.getElementById('pollutantGrid'),
    // Export Dropdown
    exportBtn: document.getElementById('exportBtn'),
    exportDropdown: document.getElementById('exportDropdown'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    printReportBtn: document.getElementById('printReportBtn'),
    // Settings Modal
    settingsModalBtn: document.getElementById('settingsModalBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    providerSelect: document.getElementById('providerSelect'),
    owmKeyGroup: document.getElementById('owmKeyGroup'),
    owmApiKeyInput: document.getElementById('owmApiKeyInput'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    resetDefaultsBtn: document.getElementById('resetDefaultsBtn'),
    toastContainer: document.getElementById('toastContainer')
  };

  // Initialize Charts
  let weatherCharts = null;

  try {
    weatherCharts = new WeatherCharts();
  } catch (e) {
    console.error('Initialization error for Charts:', e);
  }

  // Live Clock
  function updateClock() {
    const now = new Date();
    elements.clockTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Theme Management
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('atmos_theme', theme);
    elements.themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    if (weatherCharts && state.weatherData) {
      weatherCharts.render();
    }
  }

  elements.themeToggleBtn.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });
  applyTheme(state.theme);

  // Unit Management
  function setUnit(unit) {
    state.tempUnit = unit;
    state.windUnit = unit === 'fahrenheit' ? 'mph' : 'kmh';
    localStorage.setItem('atmos_temp_unit', unit);

    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.unit === unit);
    });

    if (state.lat && state.lon) {
      loadWeather(state.lat, state.lon, state.name, state.country, state.admin1);
    }
  }

  elements.unitToggle.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  // Recent Searches
  function renderRecentChips() {
    elements.recentChipsWrapper.innerHTML = '';
    state.recentSearches.slice(0, 4).forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'chip-btn recent-chip';
      btn.textContent = `🕒 ${item.name}`;
      btn.title = `${item.name}, ${item.country || ''}`;
      btn.addEventListener('click', () => {
        loadWeather(item.lat, item.lon, item.name, item.country, item.admin1);
      });
      elements.recentChipsWrapper.appendChild(btn);
    });
  }

  function addRecentSearch(location) {
    if (!location.name) return;
    state.recentSearches = state.recentSearches.filter(s => s.name.toLowerCase() !== location.name.toLowerCase());
    state.recentSearches.unshift({
      name: location.name,
      country: location.country,
      admin1: location.admin1,
      lat: location.latitude,
      lon: location.longitude
    });
    if (state.recentSearches.length > 8) state.recentSearches.pop();
    localStorage.setItem('atmos_recent', JSON.stringify(state.recentSearches));
    renderRecentChips();
  }

  renderRecentChips();

  // Quick Chips Buttons
  document.querySelectorAll('.chip-btn:not(.recent-chip)').forEach(chip => {
    chip.addEventListener('click', () => {
      const city = chip.dataset.city;
      const lat = parseFloat(chip.dataset.lat);
      const lon = parseFloat(chip.dataset.lon);
      const country = chip.dataset.country;
      loadWeather(lat, lon, city, country);
    });
  });

  // Autocomplete Search
  let searchDebounceTimer = null;

  elements.citySearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    elements.clearSearchBtn.classList.toggle('hidden', query.length === 0);

    if (query.length < 2) {
      elements.autocompleteDropdown.classList.add('hidden');
      elements.autocompleteDropdown.innerHTML = '';
      return;
    }

    clearTimeout(searchDebounceTimer);
    elements.searchSpinner.classList.remove('hidden');

    searchDebounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&count=6`);
        elements.searchSpinner.classList.add('hidden');
        if (res.ok) {
          const data = await res.json();
          renderAutocomplete(data.results || []);
        }
      } catch (err) {
        elements.searchSpinner.classList.add('hidden');
        console.error('Geocode search failed:', err);
      }
    }, 300);
  });

  elements.citySearchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = elements.citySearchInput.value.trim();
      if (query.length >= 2) {
        clearTimeout(searchDebounceTimer);
        elements.autocompleteDropdown.classList.add('hidden');
        elements.searchSpinner.classList.remove('hidden');
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&count=1`);
          elements.searchSpinner.classList.add('hidden');
          if (res.ok) {
            const data = await res.json();
            const results = data.results || [];
            if (results.length > 0) {
              const item = results[0];
              loadWeather(item.latitude, item.longitude, item.name, item.country, item.admin1);
            } else {
              showToast(`Location '${query}' not found.`, 'error');
            }
          }
        } catch (err) {
          elements.searchSpinner.classList.add('hidden');
        }
      }
    }
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.citySearchInput.value = '';
    elements.clearSearchBtn.classList.add('hidden');
    elements.autocompleteDropdown.classList.add('hidden');
    elements.citySearchInput.focus();
  });

  function renderAutocomplete(items) {
    if (items.length === 0) {
      elements.autocompleteDropdown.innerHTML = '<div class="autocomplete-item"><span class="autocomplete-sub">No locations found.</span></div>';
      elements.autocompleteDropdown.classList.remove('hidden');
      return;
    }

    elements.autocompleteDropdown.innerHTML = '';
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      const sub = [item.admin1, item.country].filter(Boolean).join(', ');
      div.innerHTML = `
        <div>
          <div class="autocomplete-main"><i class="fas fa-location-dot" style="color: #38bdf8; margin-right: 6px;"></i> ${item.name}</div>
          <div class="autocomplete-sub">${sub}</div>
        </div>
        <span class="autocomplete-sub" style="font-size: 0.75rem;">${item.latitude.toFixed(2)}°, ${item.longitude.toFixed(2)}°</span>
      `;
      div.addEventListener('click', () => {
        elements.citySearchInput.value = item.name;
        elements.autocompleteDropdown.classList.add('hidden');
        loadWeather(item.latitude, item.longitude, item.name, item.country, item.admin1);
      });
      elements.autocompleteDropdown.appendChild(div);
    });
    elements.autocompleteDropdown.classList.remove('hidden');
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.citySearchInput.contains(e.target) && !elements.autocompleteDropdown.contains(e.target)) {
      elements.autocompleteDropdown.classList.add('hidden');
    }
  });

  // GPS Locate Me
  elements.gpsLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    elements.gpsLocationBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Locating...</span>';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        elements.gpsLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> <span>Locate Me</span>';
        showToast('Located successfully!', 'success');
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        elements.gpsLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> <span>Locate Me</span>';
        showToast(`GPS Error: ${err.message}`, 'error');
      },
      { timeout: 10000 }
    );
  });

  async function fetchWeatherByCoords(lat, lon) {
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const info = await res.json();
        loadWeather(lat, lon, info.name, info.country, info.admin1);
      } else {
        loadWeather(lat, lon);
      }
    } catch {
      loadWeather(lat, lon);
    }
  }

  // Weather Fetching Engine
  async function loadWeather(lat, lon, name = '', country = '', admin1 = '') {
    elements.loadingState.classList.remove('hidden');
    elements.errorState.classList.add('hidden');
    elements.weatherContent.classList.add('hidden');

    state.lat = lat;
    state.lon = lon;

    try {
      const params = new URLSearchParams({
        lat: lat,
        lon: lon,
        temp_unit: state.tempUnit,
        wind_unit: state.windUnit,
        provider: state.provider
      });

      if (name) params.append('name', name);
      if (country) params.append('country', country);
      if (admin1) params.append('admin1', admin1);
      if (state.provider === 'openweathermap' && state.owmApiKey) {
        params.append('api_key', state.owmApiKey);
      }

      const response = await fetch(`/api/weather?${params.toString()}`);
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned ${response.status}`);
      }

      const data = await response.json();
      state.weatherData = data;
      state.name = data.location.name;
      state.country = data.location.country;
      state.admin1 = data.location.admin1;

      // Update UI components
      renderWeatherData(data);
      addRecentSearch(data.location);

      if (weatherCharts) {
        weatherCharts.updateData(data);
      }

      elements.loadingState.classList.add('hidden');
      elements.weatherContent.classList.remove('hidden');

    } catch (err) {
      elements.loadingState.classList.add('hidden');
      elements.errorMessage.textContent = err.message || 'Could not fetch weather data. Please try again.';
      elements.errorState.classList.remove('hidden');
    }
  }

  elements.retryBtn.addEventListener('click', () => {
    loadWeather(state.lat, state.lon, state.name, state.country, state.admin1);
  });

  // Render Weather Data to DOM
  function renderWeatherData(data) {
    const loc = data.location;
    const curr = data.current;
    const aqi = data.air_quality;
    const units = data.units;
    const daily = data.daily || [];

    // Hero
    elements.heroLocation.textContent = loc.name;
    const subParts = [loc.admin1, loc.country].filter(Boolean);
    elements.heroSubtitle.textContent = subParts.length > 0 ? subParts.join(', ') : `${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°`;
    elements.heroProviderText.textContent = data.provider;
    elements.heroTemp.textContent = Math.round(curr.temperature);
    elements.heroTempUnit.textContent = units.temperature;
    elements.heroFeelsLike.textContent = `${Math.round(curr.feels_like)}${units.temperature}`;
    
    if (daily.length > 0) {
      elements.heroTempMax.textContent = `${Math.round(daily[0].temp_max)}${units.temperature}`;
      elements.heroTempMin.textContent = `${Math.round(daily[0].temp_min)}${units.temperature}`;
    }

    elements.heroCondition.textContent = curr.condition;
    elements.heroWeatherIcon.innerHTML = `<i class="${curr.icon}"></i>`;
    elements.heroHumidity.textContent = `${curr.humidity}%`;
    elements.heroWind.textContent = `${curr.wind_speed} ${units.wind_speed}`;
    elements.heroPressure.textContent = `${curr.pressure} ${units.pressure}`;
    elements.heroUV.textContent = curr.uv_index;

    // Highlights
    elements.aqiScore.textContent = aqi.us_aqi !== null ? aqi.us_aqi : '--';
    elements.aqiBadge.textContent = aqi.aqi_category;
    elements.aqiBadge.style.backgroundColor = aqi.aqi_color;
    elements.aqiProgressFill.style.backgroundColor = aqi.aqi_color;
    const aqiPct = Math.min(100, Math.round(((aqi.us_aqi || 20) / 300) * 100));
    elements.aqiProgressFill.style.width = `${aqiPct}%`;
    elements.aqiAdvice.textContent = aqi.health_advice;

    // Sunrise / Sunset
    if (daily.length > 0 && daily[0].sunrise) {
      const sunriseTime = daily[0].sunrise.includes('T') ? daily[0].sunrise.split('T')[1].slice(0, 5) : daily[0].sunrise;
      const sunsetTime = daily[0].sunset.includes('T') ? daily[0].sunset.split('T')[1].slice(0, 5) : daily[0].sunset;
      elements.heroSunrise.textContent = sunriseTime;
      elements.heroSunset.textContent = sunsetTime;
    }

    // Wind Compass
    elements.compassNeedle.style.transform = `rotate(${curr.wind_direction}deg)`;
    elements.windSpeedDetail.textContent = `${curr.wind_speed} ${units.wind_speed}`;
    elements.windGustDetail.textContent = `${curr.wind_gusts} ${units.wind_speed}`;
    elements.windDirDetail.textContent = `${curr.wind_direction}°`;

    // Rain & Cloud
    if (daily.length > 0) {
      elements.heroPrecipChance.textContent = `${daily[0].precipitation_probability_max}%`;
      elements.heroPrecipSum.textContent = `${daily[0].precipitation_sum} mm`;
    }
    elements.heroCloudCover.textContent = `${curr.cloud_cover}%`;

    // Alerts
    renderAlerts(data.alerts || []);

    // Hourly Carousel
    renderHourlyCarousel(data.hourly || [], units);

    // 7-Day List
    renderDailyList(data.daily || [], units);

    // Air Quality Breakdown
    renderPollutants(aqi);
  }

  function renderAlerts(alerts) {
    if (alerts.length === 0) {
      elements.alertsWrapper.classList.add('hidden');
      elements.alertsWrapper.innerHTML = '';
      return;
    }

    elements.alertsWrapper.innerHTML = '';
    alerts.forEach(alert => {
      const div = document.createElement('div');
      div.className = `alert-banner ${alert.severity}`;
      div.innerHTML = `
        <div class="alert-icon"><i class="${alert.icon}"></i></div>
        <div class="alert-content">
          <strong>${alert.title}</strong>
          <span>${alert.description}</span>
        </div>
      `;
      elements.alertsWrapper.appendChild(div);
    });
    elements.alertsWrapper.classList.remove('hidden');
  }

  function renderHourlyCarousel(hourly, units) {
    elements.hourlyCarousel.innerHTML = '';
    hourly.slice(0, 30).forEach(item => {
      const dt = new Date(item.time);
      const timeStr = dt.toLocaleTimeString([], { hour: 'numeric', hour12: true });

      const card = document.createElement('div');
      card.className = 'hourly-card';
      card.innerHTML = `
        <span class="hourly-time">${timeStr}</span>
        <div class="hourly-icon"><i class="${item.icon}"></i></div>
        <span class="hourly-temp">${Math.round(item.temperature)}${units.temperature}</span>
        <span class="hourly-rain"><i class="fas fa-droplet"></i> ${item.precipitation_probability}%</span>
        <span class="hourly-wind">${item.wind_speed}${units.wind_speed}</span>
      `;
      elements.hourlyCarousel.appendChild(card);
    });
  }

  function renderDailyList(daily, units) {
    elements.dailyList.innerHTML = '';

    // Calculate overall min/max for scale
    const allMins = daily.map(d => d.temp_min);
    const allMaxs = daily.map(d => d.temp_max);
    const globalMin = Math.min(...allMins);
    const globalMax = Math.max(...allMaxs);
    const range = Math.max(1, globalMax - globalMin);

    daily.forEach((day, idx) => {
      const dt = new Date(day.date);
      const dayName = idx === 0 ? 'Today' : dt.toLocaleDateString([], { weekday: 'short' });
      const leftPct = Math.round(((day.temp_min - globalMin) / range) * 100);
      const widthPct = Math.max(15, Math.round(((day.temp_max - day.temp_min) / range) * 100));

      const row = document.createElement('div');
      row.className = 'daily-row';
      row.innerHTML = `
        <span class="daily-day">${dayName}</span>
        <div class="daily-icon"><i class="${day.icon}"></i></div>
        <div class="daily-rain"><i class="fas fa-droplet"></i> ${day.precipitation_probability_max}%</div>
        <div class="daily-temp-bar-wrap">
          <div class="daily-temp-bar" style="left: ${leftPct}%; width: ${widthPct}%;"></div>
        </div>
        <div class="daily-temp-text">
          <span>${Math.round(day.temp_max)}${units.temperature}</span>
          <span class="min">${Math.round(day.temp_min)}${units.temperature}</span>
        </div>
      `;
      elements.dailyList.appendChild(row);
    });
  }

  function renderPollutants(aqi) {
    const list = [
      { name: 'PM2.5 (Fine Particles)', val: aqi.pm2_5, unit: 'µg/m³', max: 50, good: 15 },
      { name: 'PM10 (Coarse Particles)', val: aqi.pm10, unit: 'µg/m³', max: 100, good: 45 },
      { name: 'Ozone (O₃)', val: aqi.ozone, unit: 'µg/m³', max: 180, good: 100 },
      { name: 'Nitrogen Dioxide (NO₂)', val: aqi.nitrogen_dioxide, unit: 'µg/m³', max: 200, good: 40 },
      { name: 'Sulphur Dioxide (SO₂)', val: aqi.sulphur_dioxide, unit: 'µg/m³', max: 350, good: 40 },
      { name: 'Carbon Monoxide (CO)', val: aqi.carbon_monoxide, unit: 'µg/m³', max: 10000, good: 4000 }
    ];

    elements.pollutantGrid.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'pollutant-card';
      const valStr = p.val !== null && p.val !== undefined ? p.val.toFixed(1) : '--';
      const pct = p.val ? Math.min(100, Math.round((p.val / p.max) * 100)) : 10;
      const isGood = p.val ? p.val <= p.good : true;
      const statusText = isGood ? 'WHO Target Met' : 'Above WHO Guide';
      const statusColor = isGood ? '#10b981' : '#f59e0b';

      card.innerHTML = `
        <span class="pollutant-name">${p.name}</span>
        <div class="pollutant-val">${valStr} <small style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">${p.unit}</small></div>
        <div class="pollutant-bar">
          <div class="pollutant-bar-fill" style="width: ${pct}%; background: ${statusColor};"></div>
        </div>
        <span class="pollutant-status" style="color: ${statusColor};">${statusText}</span>
      `;
      elements.pollutantGrid.appendChild(card);
    });
  }

  // Export Menu & Actions
  elements.exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.exportDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    elements.exportDropdown.classList.remove('show');
  });

  async function downloadExport(format) {
    if (!state.weatherData) {
      showToast('No weather data loaded to export', 'error');
      return;
    }

    try {
      showToast(`Generating ${format.toUpperCase()} export...`, 'info');
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: format,
          weather_data: state.weatherData
        })
      });

      if (!response.ok) throw new Error('Failed to generate export file');

      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `forecast.${format}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`, 'success');
    } catch (err) {
      showToast(`Export error: ${err.message}`, 'error');
    }
  }

  elements.exportCsvBtn.addEventListener('click', () => downloadExport('csv'));
  elements.exportJsonBtn.addEventListener('click', () => downloadExport('json'));
  elements.printReportBtn.addEventListener('click', () => window.print());

  // Settings Modal Handlers
  elements.settingsModalBtn.addEventListener('click', () => {
    elements.providerSelect.value = state.provider;
    elements.owmApiKeyInput.value = state.owmApiKey;
    elements.owmKeyGroup.classList.toggle('hidden', state.provider !== 'openweathermap');
    
    const radio = document.querySelector(`input[name="defaultUnitRadio"][value="${state.tempUnit}"]`);
    if (radio) radio.checked = true;

    elements.settingsModal.classList.remove('hidden');
  });

  elements.closeSettingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });

  elements.providerSelect.addEventListener('change', (e) => {
    elements.owmKeyGroup.classList.toggle('hidden', e.target.value !== 'openweathermap');
  });

  elements.saveSettingsBtn.addEventListener('click', () => {
    state.provider = elements.providerSelect.value;
    state.owmApiKey = elements.owmApiKeyInput.value.trim();
    localStorage.setItem('atmos_provider', state.provider);
    localStorage.setItem('atmos_owm_key', state.owmApiKey);

    const selectedUnitRadio = document.querySelector('input[name="defaultUnitRadio"]:checked');
    if (selectedUnitRadio) {
      setUnit(selectedUnitRadio.value);
    } else {
      loadWeather(state.lat, state.lon, state.name, state.country, state.admin1);
    }

    elements.settingsModal.classList.add('hidden');
    showToast('Settings saved & applied!', 'success');
  });

  elements.resetDefaultsBtn.addEventListener('click', () => {
    state.provider = 'open-meteo';
    state.owmApiKey = '';
    localStorage.removeItem('atmos_provider');
    localStorage.removeItem('atmos_owm_key');
    elements.providerSelect.value = 'open-meteo';
    elements.owmApiKeyInput.value = '';
    elements.owmKeyGroup.classList.add('hidden');
    setUnit('celsius');
    elements.settingsModal.classList.add('hidden');
    showToast('Reset to default Open-Meteo settings', 'info');
  });

  // Toast Notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info';
    const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#38bdf8';
    toast.innerHTML = `<i class="fas ${icon}" style="color: ${color};"></i> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Initial Boot - Starts with Pune, Maharashtra, India
  loadWeather(state.lat, state.lon, state.name, state.country, state.admin1);
});
