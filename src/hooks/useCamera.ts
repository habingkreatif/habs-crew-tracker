import { useState, useCallback, useRef } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  photoUrl: string | null;
  photoFile: File | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  takePhoto: () => void;
  retakePhoto: () => void;
  isStreaming: boolean;
  error: string | null;
}

export function useCamera(facingMode: 'user' | 'environment' = 'user'): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsStreaming(true);
    } catch (err: any) {
      setError('Akses kamera ditolak atau kamera tidak ditemukan.');
      setIsStreaming(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsStreaming(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !isStreaming) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhotoUrl(dataUrl);

    // Convert dataURL to File object for uploading
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotoFile(file);
      }
    }, 'image/jpeg', 0.8);

    stopCamera();
  }, [isStreaming, stopCamera]);

  const retakePhoto = useCallback(() => {
    setPhotoUrl(null);
    setPhotoFile(null);
    startCamera();
  }, [startCamera]);

  return {
    videoRef,
    photoUrl,
    photoFile,
    startCamera,
    stopCamera,
    takePhoto,
    retakePhoto,
    isStreaming,
    error,
  };
}
