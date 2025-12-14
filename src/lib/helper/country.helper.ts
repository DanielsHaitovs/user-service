/* eslint-disable sonarjs/pseudo-random */
import { COUNTRIES } from '@/libConst/countries.const';

export function getRandomCountryCode(): COUNTRIES {
  const countryCodes = Object.keys(COUNTRIES) as COUNTRIES[];
  const randomIndex = Math.floor(Math.random() * countryCodes.length);

  return countryCodes[randomIndex] ?? COUNTRIES.US;
}
