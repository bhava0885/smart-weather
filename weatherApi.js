const API_BASE = 'https://api.openweathermap.org/data/2.5';

function getApiKey() {
  return import.meta.env.VITE_WEATHER_API_KEY?.trim();
}

async function parseApiError(response) {
  const text = await response.text();

  try {
    const payload = JSON.parse(text);
    return payload.message || 'Weather data unavailable right now.';
  } catch {
    return text || 'Weather data unavailable right now.';
  }
}

export function isApiConfigured() {
  return Boolean(getApiKey());
}

export async function fetchWeatherByCity(city, apiKey = getApiKey()) {
  if (!city || !apiKey) {
    throw new Error('OpenWeatherMap API key is missing. Add VITE_WEATHER_API_KEY to your .env file.');
  }

  const response = await fetch(
    `${API_BASE}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

export async function fetchWeatherByCoords(latitude, longitude, apiKey = getApiKey()) {
  if ((latitude === undefined || latitude === null) || (longitude === undefined || longitude === null)) {
    throw new Error('Location coordinates are missing.');
  }

  if (!apiKey) {
    throw new Error('OpenWeatherMap API key is missing. Add VITE_WEATHER_API_KEY to your .env file.');
  }

  const response = await fetch(
    `${API_BASE}/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

export async function fetchForecastByCity(city, apiKey = getApiKey()) {
  if (!city || !apiKey) {
    throw new Error('OpenWeatherMap API key is missing. Add VITE_WEATHER_API_KEY to your .env file.');
  }

  const response = await fetch(
    `${API_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

export async function fetchForecastByCoords(latitude, longitude, apiKey = getApiKey()) {
  if ((latitude === undefined || latitude === null) || (longitude === undefined || longitude === null)) {
    throw new Error('Location coordinates are missing.');
  }

  if (!apiKey) {
    throw new Error('OpenWeatherMap API key is missing. Add VITE_WEATHER_API_KEY to your .env file.');
  }

  const response = await fetch(
    `${API_BASE}/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}
