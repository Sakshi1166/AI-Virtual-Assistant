export async function getWeatherForCity(cityName) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY || '';
  if (!apiKey || apiKey.length < 20) {
    throw new Error('Weather service is not configured. Add OPENWEATHERMAP_API_KEY to server .env and restart the server.');
  }

  const cityForApi = cityName.trim();
  const INDIAN_CITIES = ['lucknow', 'delhi', 'mumbai', 'bangalore', 'mussoorie', 'shimla', 'goa', 'manali', 'dehradun', 'ooty', 'darjeeling', 'mussorie'];
  const isLikelyIndian = INDIAN_CITIES.some((c) => cityForApi.toLowerCase().includes(c));

  const tryFetch = (q) => {
    const u = new URL('https://api.openweathermap.org/data/2.5/weather');
    u.searchParams.set('q', q);
    u.searchParams.set('appid', apiKey);
    u.searchParams.set('units', 'metric');
    return fetch(u.toString());
  };

  let res = await tryFetch(cityForApi);
  if (!res.ok && isLikelyIndian) {
    res = await tryFetch(`${cityForApi},IN`);
  }
  if (!res.ok && !cityForApi.includes(',')) {
    res = await tryFetch(cityForApi);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Weather for "${cityForApi}" not found. Try another city.`);
  }

  const data = await res.json();
  const temp = Math.round(data.main?.temp ?? 0);
  const feelsLike = Math.round(data.main?.feels_like ?? temp);
  const desc = data.weather?.[0]?.description ?? 'unknown';
  const humidity = data.main?.humidity ?? 0;
  const city = data.name ?? cityName;

  return {
    city,
    temp,
    feelsLike,
    description: desc,
    humidity,
  };
}

const KNOWN_CITIES = [
  'lucknow', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'pune',
  'hyderabad', 'jaipur', 'ahmedabad', 'noida', 'gurgaon', 'london', 'new york',
  'los angeles', 'tokyo', 'paris', 'dubai', 'singapore', 'goa', 'shimla', 'manali',
  'rishikesh', 'haridwar', 'agra', 'varanasi', 'udaipur', 'kochi', 'mangalore',
  'indore', 'bhopal', 'chandigarh', 'dehradun', 'ooty', 'darjeeling', 'gangtok',
  'srinagar', 'leh', 'amritsar', 'jodhpur', 'mysore', 'madurai', 'coimbatore',
  'visakhapatnam', 'guwahati', 'bhubaneswar', 'raipur', 'patna', 'ranchi',
];

const CITY_ALIASES = {
  mussorie: 'Mussoorie',
  mussoorie: 'Mussoorie',
  masuri: 'Mussoorie',
  mussourie: 'Mussoorie',
  bangalore: 'Bangalore',
  bengaluru: 'Bangalore',
  bombay: 'Mumbai',
  calcutta: 'Kolkata',
  madras: 'Chennai',
};

function cleanCityName(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw
    .replace(/^(?:tell|get|show|what is|what's|give me)\s+/i, '')
    .replace(/\s+(?:weather|temp|temperature|current|right now|currently|please).*$/i, '')
    .replace(/'s$/, '')
    .trim();
  if (s.length >= 2) return s;
  return null;
}

export function extractCityFromWeatherQuery(text) {
  const lower = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!/\b(weather|temperature|temp|how hot|cold)\b/i.test(text)) return null;

  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }

  for (const city of KNOWN_CITIES) {
    if (lower.includes(city)) return city.charAt(0).toUpperCase() + city.slice(1);
  }

  const patterns = [
    /(?:in|at|for)\s+([A-Za-z\u0900-\u097F\s-]{2,40}?)(?:\s+(?:current\s+)?(?:weather|temp)|$|\?|\.)/i,
    /(?:weather|temp)\s+(?:in|at|for)\s+([A-Za-z\u0900-\u097F\s-]{2,40}?)(?:\s+right now|$|\?|\.)/i,
    /([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s-]{2,30}?)\s+(?:current\s+)?weather/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const city = cleanCityName(m[1] || m[0]);
      if (city) return city;
    }
  }

  return null;
}
