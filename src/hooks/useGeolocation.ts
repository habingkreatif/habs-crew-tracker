import { useState, useCallback } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface UseGeolocationReturn {
  coords: Coordinates | null;
  error: string | null;
  isLoading: boolean;
  getLocation: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser ini.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        let errorMessage = 'Gagal mendapatkan lokasi.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Akses lokasi ditolak. Harap izinkan akses GPS di pengaturan browser/HP Anda.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia (sinyal GPS lemah).';
            break;
          case err.TIMEOUT:
            errorMessage = 'Waktu permintaan lokasi habis.';
            break;
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return { coords, error, isLoading, getLocation };
}
