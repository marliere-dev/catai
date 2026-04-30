import { BadRequestException } from '@nestjs/common';

import { LocationService } from './location.service';

describe('LocationService', () => {
  const service = new LocationService();

  describe('validateCoordinates', () => {
    it.each([
      [-91, 0],
      [91, 0],
      [0, -181],
      [0, 181],
      [Number.NaN, 0],
      [0, Number.POSITIVE_INFINITY],
    ])('rejects out-of-range coordinates lat=%p lng=%p', (lat, lng) => {
      expect(() => service.validateCoordinates(lat, lng)).toThrow(BadRequestException);
    });

    it('accepts boundary coordinates', () => {
      expect(() => service.validateCoordinates(-90, -180)).not.toThrow();
      expect(() => service.validateCoordinates(90, 180)).not.toThrow();
    });
  });

  describe('calculateDistanceKm', () => {
    it('returns 0 for the same point', () => {
      expect(service.calculateDistanceKm(-23.55, -46.63, -23.55, -46.63)).toBeCloseTo(0, 6);
    });

    it('matches the known distance from São Paulo to Rio de Janeiro (~360 km)', () => {
      const km = service.calculateDistanceKm(-23.5505, -46.6333, -22.9068, -43.1729);
      expect(km).toBeGreaterThan(355);
      expect(km).toBeLessThan(365);
    });

    it('rejects invalid coordinates', () => {
      expect(() => service.calculateDistanceKm(100, 0, 0, 0)).toThrow(BadRequestException);
    });
  });
});
