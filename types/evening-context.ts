export type EveningLocation =
  | { mode: 'none' }
  | { mode: 'coordinates'; latitude: number; longitude: number }
  | { mode: 'city'; placeId: number };

export type WeatherContext =
  | { status: 'skipped' | 'unavailable' }
  | {
    status: 'available'; place: string | null; condition: string; weatherCode: number;
    temperatureC: number; feelsLikeC: number; precipitationMm: number; windKmh: number;
    isDay: boolean; localTime: string; timezone: string; validAt: string; checkedAt: string;
    source: 'Open-Meteo';
  };

export type EveningContext = { occasion: string; scene: string; weather: WeatherContext; localTime: string | null };
export type WeatherPlace = { id: number; label: string };
