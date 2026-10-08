import {
  fetchForecastByCity,
  fetchForecastByCoords,
  fetchWeatherByCity,
  fetchWeatherByCoords,
  isApiConfigured,
} from './weatherApi.js';

const cityInput = document.querySelector('#cityInput');
const searchForm = document.querySelector('#searchForm');
const locationButton = document.querySelector('#locationButton');
const loadingIndicator = document.querySelector('#loadingIndicator');
const alertMessage = document.querySelector('#alertMessage');
const forecastGrid = document.querySelector('#forecastGrid');
const lastUpdatedLabel = document.querySelector('#lastUpdatedLabel');
const unitButtons = document.querySelectorAll('.unit-button');
const cityName = document.querySelector('#cityName');
const weatherIconMain = document.querySelector('#weatherIconMain');
const temperatureValue = document.querySelector('#temperatureValue');
const weatherCondition = document.querySelector('#weatherCondition');
const weatherDescription = document.querySelector('#weatherDescription');
const feelsLikeValue = document.querySelector('#feelsLikeValue');
const humidityValue = document.querySelector('#humidityValue');
const windValue = document.querySelector('#windValue');
const pressureValue = document.querySelector('#pressureValue');
const visibilityValue = document.querySelector('#visibilityValue');
const sunriseValue = document.querySelector('#sunriseValue');
const sunsetValue = document.querySelector('#sunsetValue');
const cloudValue = document.querySelector('#cloudValue');
const localTimeValue = document.querySelector('#localTimeValue');
const travelSuggestion = document.querySelector('#travelSuggestion');
const travelSuitability = document.querySelector('#travelSuitability');
const travelReason = document.querySelector('#travelReason');

const defaultCity = 'Chennai';
const state = {
  unit: 'C',
  weather: null,
  forecast: null,
};

function updateAlert(message = '') {
  alertMessage.textContent = message;
}

function setLoading(isLoading) {
  loadingIndicator.classList.toggle('hidden', !isLoading);
}

function getUnitSymbol() {
  return state.unit === 'F' ? '°F' : '°C';
}

function convertTemperature(value) {
  if (state.unit === 'F') {
    return (value * 9) / 5 + 32;
  }
  return value;
}

function formatTemperature(value) {
  const converted = convertTemperature(value);
  return `${Math.round(converted)}${getUnitSymbol()}`;
}

function formatWind(speed) {
  return `${Math.round(speed)} km/h`;
}

function formatVisibility(visibilityMeters) {
  const km = visibilityMeters / 1000;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

function formatHour(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getWeatherIcon(code) {
  const iconMap = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '❄️',
    '13n': '❄️',
    '50d': '🌫️',
    '50n': '🌫️',
  };

  return iconMap[code] || '🌤️';
}

function getThemeName(weatherCode, isNight) {
  if (weatherCode >= 200 && weatherCode < 600) {
    return 'rainy';
  }

  if (weatherCode >= 600 && weatherCode < 700) {
    return 'snowy';
  }

  if (weatherCode === 800) {
    return isNight ? 'night' : 'sunny';
  }

  if (weatherCode >= 801 && weatherCode < 900) {
    return 'cloudy';
  }

  return isNight ? 'night' : 'sunny';
}

function updateBodyTheme(weather) {
  const code = weather?.weather?.[0]?.id ?? 800;
  const isNight = weather?.dt && weather?.sys?.sunset ? weather.dt > weather.sys.sunset : false;
  document.body.dataset.theme = getThemeName(code, isNight);
}

function setUnit(unit) {
  state.unit = unit;
  unitButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.unit === unit);
  });

  if (state.weather) {
    renderCurrentWeather(state.weather);
  }

  if (state.forecast) {
    renderForecast(state.forecast);
  }
}

function extractDailyForecast(items) {
  const grouped = new Map();

  items.forEach((item) => {
    const dateKey = item.dt_txt.slice(0, 10);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, item);
      return;
    }

    const existing = grouped.get(dateKey);
    if (Math.abs(item.dt - existing.dt) < Math.abs(item.dt - existing.dt)) {
      grouped.set(dateKey, item);
    }
  });

  return Array.from(grouped.values()).slice(0, 5);
}

function buildTravelSuggestion(weather, forecastList) {
  const temp = weather.main.temp;
  const condition = weather.weather[0].main.toLowerCase();
  const rainChance = forecastList?.reduce((acc, item) => {
    const pop = item.pop ?? 0;
    return Math.max(acc, pop * 100);
  }, 0) ?? 0;

  if (condition.includes('thunderstorm')) {
    return 'Thunderstorms are expected. Avoid outdoor activities, stay informed about local travel conditions, and plan indoor alternatives.';
  }

  if (condition.includes('rain') || rainChance > 60) {
    return 'Rain is expected. Carry an umbrella or rain jacket and favor indoor attractions, museums, and covered venues.';
  }

  if (temp >= 31) {
    return 'It is quite hot today. Stay hydrated, carry sun protection, and schedule outdoor plans for early morning or evening hours.';
  }

  if (temp <= 10) {
    return 'Cold weather is expected. Pack warm layers and plan a mix of indoor and outdoor attractions with a comfortable pace.';
  }

  if (temp >= 18 && temp <= 28) {
    return 'Great weather for outdoor activities. Explore tourist attractions, parks, beaches, and scenic trails while the conditions remain comfortable.';
  }

  return 'Conditions are mild and flexible. This is a good time for walking tours, local food experiences, and sightseeing across the city.';
}

function buildTravelSuitability(weather, forecastList) {
  const temp = weather.main.temp;
  const wind = weather.wind.speed;
  const rainChance = forecastList?.reduce((acc, item) => {
    const pop = item.pop ?? 0;
    return Math.max(acc, pop * 100);
  }, 0) ?? 0;
  const visibility = weather.visibility;
  const condition = weather.weather[0].main;

  let score = 100;

  if (temp > 32 || temp < 0) score -= 20;
  if (temp >= 28 && temp <= 32) score -= 8;
  if (rainChance > 60) score -= 24;
  if (wind > 30) score -= 12;
  if (visibility < 4000) score -= 10;
  if (condition.includes('Thunderstorm')) score -= 25;
  if (condition.includes('Snow')) score -= 18;

  if (score >= 80) {
    return {
      label: 'Excellent',
      className: 'excellent',
      reason: 'Comfortable temperature, low rain risk, and stable visibility make this ideal for exploration.',
    };
  }

  if (score >= 65) {
    return {
      label: 'Good',
      className: 'good',
      reason: 'Comfortable temperature with low chance of rain and moderate wind supports a pleasant trip.',
    };
  }

  if (score >= 45) {
    return {
      label: 'Moderate',
      className: 'moderate',
      reason: 'Conditions are manageable, but weather changes or heavier wind may require some flexibility in plans.',
    };
  }

  return {
    label: 'Poor',
    className: 'poor',
    reason: 'Weather conditions are less favorable for travel due to heavy rain, strong wind, or extreme temperatures.',
  };
}

function renderCurrentWeather(data) {
  if (!data) return;

  const timezoneOffset = data.timezone || 0;
  const localDate = new Date((data.dt + timezoneOffset) * 1000);
  const sunriseDate = new Date((data.sys.sunrise + timezoneOffset) * 1000);
  const sunsetDate = new Date((data.sys.sunset + timezoneOffset) * 1000);
  const weatherInfo = data.weather[0];

  cityName.textContent = `${data.name}, ${data.sys.country}`;
  weatherIconMain.textContent = getWeatherIcon(weatherInfo.icon);
  temperatureValue.textContent = formatTemperature(data.main.temp);
  weatherCondition.textContent = weatherInfo.main;
  weatherDescription.textContent = weatherInfo.description;
  feelsLikeValue.textContent = formatTemperature(data.main.feels_like);
  humidityValue.textContent = `${data.main.humidity}%`;
  windValue.textContent = formatWind(data.wind.speed);
  pressureValue.textContent = `${data.main.pressure} hPa`;
  visibilityValue.textContent = formatVisibility(data.visibility);
  sunriseValue.textContent = formatHour(sunriseDate);
  sunsetValue.textContent = formatHour(sunsetDate);
  cloudValue.textContent = `${data.clouds.all}%`;
  localTimeValue.textContent = formatHour(localDate);

  lastUpdatedLabel.textContent = `Updated ${formatDate(localDate)}`;
  updateBodyTheme(data);
}

function renderForecast(forecastData) {
  const items = extractDailyForecast(forecastData.list || []);

  forecastGrid.innerHTML = items
    .map((entry) => {
      const temps = entry.main;
      const description = entry.weather?.[0]?.description || 'Weather';
      const icon = getWeatherIcon(entry.weather?.[0]?.icon || '01d');
      const date = new Date((entry.dt + (forecastData.city?.timezone || 0)) * 1000);
      const rainChance = Math.round((entry.pop || 0) * 100);

      return `
        <article class="forecast-card">
          <div class="day-name">${formatDate(date)}</div>
          <div class="forecast-icon" aria-label="${description}">${icon}</div>
          <div class="forecast-cond">${description}</div>
          <div class="temps">
            <span>Min: ${formatTemperature(temps.temp_min)}</span>
            <span>Max: ${formatTemperature(temps.temp_max)}</span>
          </div>
          <div class="rain">Rain: ${rainChance}%</div>
          <div class="rain">Wind: ${formatWind(entry.wind?.speed || 0)}</div>
        </article>
      `;
    })
    .join('');
}

function renderTravelInsights(weather, forecastData) {
  const forecastList = forecastData?.list || [];
  travelSuggestion.textContent = buildTravelSuggestion(weather, forecastList);

  const suitability = buildTravelSuitability(weather, forecastList);
  const ratingElement = document.createElement('span');
  ratingElement.className = `rating-tag ${suitability.className}`;
  ratingElement.textContent = `🟢 ${suitability.label}`;

  const existingTag = travelSuitability.querySelector('.rating-tag');
  if (existingTag) existingTag.remove();

  travelSuitability.prepend(ratingElement);
  travelReason.textContent = `Reason: ${suitability.reason}`;
}

async function loadWeatherForCity(cityNameValue) {
  const city = cityNameValue.trim();
  if (!city) {
    updateAlert('Please enter a city name before searching.');
    return;
  }

  if (!isApiConfigured()) {
    updateAlert('API is not configured. Add VITE_WEATHER_API_KEY to your .env file to fetch live weather data.');
    return;
  }

  setLoading(true);
  updateAlert('');

  try {
    const [weather, forecast] = await Promise.all([
      fetchWeatherByCity(city),
      fetchForecastByCity(city),
    ]);

    state.weather = weather;
    state.forecast = forecast;
    renderCurrentWeather(weather);
    renderForecast(forecast);
    renderTravelInsights(weather, forecast);
  } catch (error) {
    updateAlert(error.message || 'Unable to fetch weather right now. Please try another city.');
  } finally {
    setLoading(false);
  }
}

async function loadWeatherForCurrentLocation() {
  if (!navigator.geolocation) {
    updateAlert('Geolocation is not supported in this browser.');
    return;
  }

  if (!isApiConfigured()) {
    updateAlert('API is not configured. Add VITE_WEATHER_API_KEY to your .env file to fetch live weather data.');
    return;
  }

  setLoading(true);
  updateAlert('');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const [weather, forecast] = await Promise.all([
          fetchWeatherByCoords(latitude, longitude),
          fetchForecastByCoords(latitude, longitude),
        ]);

        state.weather = weather;
        state.forecast = forecast;
        renderCurrentWeather(weather);
        renderForecast(forecast);
        renderTravelInsights(weather, forecast);
      } catch (error) {
        updateAlert(error.message || 'Unable to load weather for your location.');
      } finally {
        setLoading(false);
      }
    },
    () => {
      setLoading(false);
      updateAlert('Location access was denied. Please search by city instead.');
    }
  );
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadWeatherForCity(cityInput.value);
});

locationButton.addEventListener('click', loadWeatherForCurrentLocation);

unitButtons.forEach((button) => {
  button.addEventListener('click', () => setUnit(button.dataset.unit));
});

cityInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    loadWeatherForCity(cityInput.value);
  }
});

window.addEventListener('load', () => {
  cityInput.value = defaultCity;
  loadWeatherForCity(defaultCity);
});
