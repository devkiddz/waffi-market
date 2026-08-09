export const WAFFI_MEDIA_POLICY = {
  image: {
    hardMaxBytes: 2 * 1024 * 1024,
    hardMaxMb: 2,
    recommendedMaxMb: 1
  },
  video: {
    hardMaxBytes: 20 * 1024 * 1024,
    hardMaxMb: 20,
    recommendedMaxMb: 12
  }
} as const;

export type WaffiMediaPolicyResourceType = 'IMAGE' | 'VIDEO';

export function mediaHardLimitBytes(
  resourceType: WaffiMediaPolicyResourceType
): number {
  return resourceType === 'VIDEO'
    ? WAFFI_MEDIA_POLICY.video.hardMaxBytes
    : WAFFI_MEDIA_POLICY.image.hardMaxBytes;
}

export function mediaHardLimitMb(
  resourceType: WaffiMediaPolicyResourceType
): number {
  return resourceType === 'VIDEO'
    ? WAFFI_MEDIA_POLICY.video.hardMaxMb
    : WAFFI_MEDIA_POLICY.image.hardMaxMb;
}

export function mediaRecommendedMaxMb(
  resourceType: WaffiMediaPolicyResourceType
): number {
  return resourceType === 'VIDEO'
    ? WAFFI_MEDIA_POLICY.video.recommendedMaxMb
    : WAFFI_MEDIA_POLICY.image.recommendedMaxMb;
}
