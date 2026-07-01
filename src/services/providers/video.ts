// Video provider abstraction. We are NOT a video hosting company:
// bytes go direct-to-provider via signed uploads; we store only the asset id.
// Default provider recommendation: Cloudflare Stream (see docs).

import { getEnv } from '../env';

export interface DirectUpload {
  uploadUrl: string;
  assetId: string;
  provider: string;
}

export interface PlaybackInfo {
  hlsUrl: string;
  thumbnailUrl: string;
  provider: string;
}

export interface VideoProvider {
  readonly name: string;
  createDirectUpload(): Promise<DirectUpload>;
  getPlayback(assetId: string): Promise<PlaybackInfo>;
}

// Mock provider so upload/playback UI flows work end-to-end without a vendor.
export class MockVideoProvider implements VideoProvider {
  readonly name = 'mock';
  async createDirectUpload(): Promise<DirectUpload> {
    const assetId = `mock_${Math.random().toString(36).slice(2, 10)}`;
    return { uploadUrl: `https://mock.upload.local/${assetId}`, assetId, provider: this.name };
  }
  async getPlayback(assetId: string): Promise<PlaybackInfo> {
    return {
      hlsUrl: `https://mock.stream.local/${assetId}/playlist.m3u8`,
      thumbnailUrl: `https://mock.stream.local/${assetId}/thumb.jpg`,
      provider: this.name,
    };
  }
}

// Real provider (Cloudflare Stream). Selected when credentials are present.
export class CloudflareStreamProvider implements VideoProvider {
  readonly name = 'cloudflare_stream';
  constructor(private accountId: string, private apiToken: string) {}

  async createDirectUpload(): Promise<DirectUpload> {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/direct_upload`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxDurationSeconds: 600, requireSignedURLs: false }),
      },
    );
    const data = await res.json();
    return {
      uploadUrl: data.result.uploadURL,
      assetId: data.result.uid,
      provider: this.name,
    };
  }

  async getPlayback(assetId: string): Promise<PlaybackInfo> {
    return {
      hlsUrl: `https://videodelivery.net/${assetId}/manifest/video.m3u8`,
      thumbnailUrl: `https://videodelivery.net/${assetId}/thumbnails/thumbnail.jpg`,
      provider: this.name,
    };
  }
}

let cached: VideoProvider | null = null;

export function getVideoProvider(): VideoProvider {
  if (cached) return cached;
  const accountId = getEnv('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = getEnv('CLOUDFLARE_STREAM_TOKEN');
  cached =
    accountId && apiToken
      ? new CloudflareStreamProvider(accountId, apiToken)
      : new MockVideoProvider();
  return cached;
}

export function __setVideoProvider(p: VideoProvider | null): void {
  cached = p;
}
