/* eslint-disable sonarjs/pseudo-random */
import { COUNTRIES } from '@/lib/const/countries.const';

export function getRandomCountryCode(): keyof typeof COUNTRIES {
  const countryCodes = Object.keys(COUNTRIES) as (keyof typeof COUNTRIES)[];
  const randomIndex = Math.floor(Math.random() * countryCodes.length);

  return countryCodes[randomIndex] ?? COUNTRIES.US;
}
