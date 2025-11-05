import type { Asset } from "@/lib/types";

function toTimestamp(value: Date | string | null | undefined): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getAssetTimestamp(asset: Asset): number {
  return Math.max(
    toTimestamp(asset.updatedAt as Date | string | undefined),
    toTimestamp(asset.createdAt as Date | string | undefined),
  );
}

export function getLatestAssetByType(
  assets: Asset[],
  type: Asset["type"],
): Asset | undefined {
  return assets
    .filter((asset) => asset.type === type && asset.url)
    .sort((a, b) => getAssetTimestamp(b) - getAssetTimestamp(a))[0];
}

export function getPrimaryDisplayAsset(assets: Asset[]): Asset | undefined {
  const video = getLatestAssetByType(assets, "VIDEO");
  if (video) return video;
  const thumbnail = getLatestAssetByType(assets, "THUMBNAIL");
  if (thumbnail) return thumbnail;
  return assets[0];
}
