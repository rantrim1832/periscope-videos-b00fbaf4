import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface Props {
  src: string;        // HLS (.m3u8) or progressive URL
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

// Adaptive HLS playback: native where supported (Safari/iOS), hls.js elsewhere.
// Works with any provider's playback URL (Cloudflare Stream, Mux, or a mock
// sample stream in development).
export const VideoPlayer = ({ src, poster, autoPlay = true, className }: Props) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    const isHls = src.includes('.m3u8');
    let hls: Hls | null = null;

    if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src; // native HLS
    } else if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src; // progressive / fallback
    }

    if (autoPlay) video.play().catch(() => undefined);
    return () => { hls?.destroy(); };
  }, [src, autoPlay]);

  return (
    <video
      ref={ref}
      poster={poster}
      controls
      playsInline
      muted={autoPlay}
      className={className ?? 'w-full h-full object-contain bg-black'}
    />
  );
};
