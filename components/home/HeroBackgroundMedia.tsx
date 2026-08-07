const youtubePatterns = [/(?:youtube\.com\/watch\?v=)([\w-]{11})/, /(?:youtu\.be\/)([\w-]{11})/, /(?:youtube(?:-nocookie)?\.com\/embed\/)([\w-]{11})/];

function youtubeId(url: string) {
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export default function HeroBackgroundMedia({ mediaType, mediaUrl, fallbackImage, autoplay = true }: { mediaType: string; mediaUrl: string; fallbackImage: string; autoplay?: boolean }) {
  const videoId = youtubeId(mediaUrl);

  return <div className="absolute inset-0 overflow-hidden bg-[#03070d]">
    <div className="absolute inset-0 scale-[1.01] bg-cover bg-center" style={{ backgroundImage: `url(${fallbackImage})` }} />
    {mediaType === 'IMAGE' ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${mediaUrl})` }} /> : videoId ? <iframe title="Shelsea cinematic hero" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`} allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0" /> : <video autoPlay={autoplay} muted loop playsInline poster={fallbackImage} className="absolute inset-0 size-full object-cover"><source src={mediaUrl} type="video/mp4" /></video>}
  </div>;
}
