const conditions: Record<number, [string, string]> = {
  0: ['Clear sky', 'Céu limpo'], 1: ['Mainly clear', 'Predominantemente limpo'], 2: ['Partly cloudy', 'Parcialmente nublado'], 3: ['Overcast', 'Nublado'],
  45: ['Fog', 'Nevoeiro'], 48: ['Freezing fog', 'Nevoeiro gelado'],
  51: ['Light drizzle', 'Garoa leve'], 53: ['Drizzle', 'Garoa'], 55: ['Heavy drizzle', 'Garoa forte'],
  56: ['Light freezing drizzle', 'Garoa gelada leve'], 57: ['Freezing drizzle', 'Garoa gelada'],
  61: ['Light rain', 'Chuva leve'], 63: ['Rain', 'Chuva'], 65: ['Heavy rain', 'Chuva forte'],
  66: ['Light freezing rain', 'Chuva gelada leve'], 67: ['Freezing rain', 'Chuva gelada'],
  71: ['Light snow', 'Neve leve'], 73: ['Snow', 'Neve'], 75: ['Heavy snow', 'Neve forte'], 77: ['Snow grains', 'Grãos de neve'],
  80: ['Light showers', 'Pancadas leves'], 81: ['Showers', 'Pancadas de chuva'], 82: ['Heavy showers', 'Pancadas fortes'],
  85: ['Light snow showers', 'Pancadas de neve leves'], 86: ['Snow showers', 'Pancadas de neve'],
  95: ['Thunderstorm', 'Trovoada'], 96: ['Thunderstorm with hail', 'Trovoada com granizo'], 99: ['Thunderstorm with heavy hail', 'Trovoada com granizo forte'],
};
export function weatherCondition(code: number, locale: 'en' | 'pt') { return conditions[code]?.[locale === 'pt' ? 1 : 0] || (locale === 'pt' ? 'Condição desconhecida' : 'Unknown conditions'); }

