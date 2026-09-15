import {
  WELLINGTON_LAT,
  WELLINGTON_LON,
  DEMO_MONTH,
  DEMO_DAY,
  DEMO_YEAR,
  DEMO_TZ,
} from "../constants";

function fractionalYear(year: number, month: number, day: number, hour: number, tz: number): number {
  const utcDay =
    Date.UTC(year, month - 1, day, hour - tz) / 86400000 -
    Math.floor(Date.UTC(year, 0, 1) / 86400000);
  return (2 * Math.PI) / 365 * utcDay;
}

function equationOfTime(fracYear: number): number {
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(fracYear) -
      0.032077 * Math.sin(fracYear) -
      0.014615 * Math.cos(2 * fracYear) -
      0.040849 * Math.sin(2 * fracYear))
  );
}

function solarDeclination(fracYear: number): number {
  return (
    0.006918 -
    0.399912 * Math.cos(fracYear) +
    0.070257 * Math.sin(fracYear) -
    0.006758 * Math.cos(2 * fracYear) +
    0.000907 * Math.sin(2 * fracYear) -
    0.002697 * Math.cos(3 * fracYear) +
    0.00148 * Math.sin(3 * fracYear)
  );
}

export interface SunPosition {
  elevation: number;
  azimuth: number;
  declination: number;
}

export function getSunPosition(hour: number, year = DEMO_YEAR, month = DEMO_MONTH, day = DEMO_DAY): SunPosition {
  const fracYear = fractionalYear(year, month, day, hour, DEMO_TZ);
  const eotMin = equationOfTime(fracYear);
  const standardMeridian = DEMO_TZ * 15;
  const timeOffset = (standardMeridian - WELLINGTON_LON) * 4 + eotMin;
  const solarTime =
    hour + timeOffset / 60;
  const hourAngle = (solarTime - 12) * 15;
  const declination = solarDeclination(fracYear);
  const latRad = (WELLINGTON_LAT * Math.PI) / 180;
  const cosHourAngle = Math.cos((hourAngle * Math.PI) / 180);
  const sinElevation =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * cosHourAngle;
  const elevation = (Math.asin(Math.max(-1, Math.min(1, sinElevation))) * 180) / Math.PI;

  const cosAzimuth =
    (Math.sin(declination) - sinElevation * Math.sin(latRad)) /
    (Math.cos(elevation * 0.0174532925) * Math.cos(latRad) || 0.0001);
  let azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;
  if (hourAngle > 0) azimuth = 360 - azimuth;
  azimuth = (azimuth + 180) % 360;

  return { elevation, azimuth, declination: declination * 57.2957795 };
}

export function sunElevationAt(hour: number): number {
  const pos = getSunPosition(hour);
  return pos.elevation;
}

export function sunAzimuthAt(hour: number): number {
  const pos = getSunPosition(hour);
  return pos.azimuth;
}

export function dayLengthHours(): number {
  return 14;
}