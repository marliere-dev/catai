import { BadRequestException, Injectable } from '@nestjs/common';

const EARTH_RADIUS_KM = 6371;

@Injectable()
export class LocationService {
  validateCoordinates(latitude: number, longitude: number): void {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new BadRequestException('latitude must be a finite number in [-90, 90]');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new BadRequestException('longitude must be a finite number in [-180, 180]');
    }
  }

  calculateDistanceKm(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number,
  ): number {
    this.validateCoordinates(latitude1, longitude1);
    this.validateCoordinates(latitude2, longitude2);

    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRadians(latitude2 - latitude1);
    const dLon = toRadians(longitude2 - longitude1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(latitude1)) * Math.cos(toRadians(latitude2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }
}
