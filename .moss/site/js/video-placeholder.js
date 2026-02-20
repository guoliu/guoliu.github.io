/// Progressive video placeholder swapping
///
/// Architecture: Maximum Decoupling
/// - Frontend listens for asset_ready events from backend
/// - Backend owns asset conversion tracking
/// - Frontend only knows: swap this element with that URL
///
/// Three-stage progressive enhancement:
/// 1. Blocking phase (instant): SVG poster with dominant color + animated spinner
/// 2. Background early (~2s): Thumbnail replaces SVG as poster (real video frame)
/// 3. Background late (~30s+): MP4 replaces placeholder src (playable video)
///
/// Attributes on video elements:
/// - data-placeholder-src: original source path (e.g., "videos/clip.mov")
/// - data-thumb-src: thumbnail path (e.g., "videos/clip.thumb.jpg")
/// - poster: initially SVG placeholder, then swapped to thumbnail
(function() {
  // Only run in Tauri environment
  if (typeof window.__TAURI__ === 'undefined') return;

  var listen = window.__TAURI__.event.listen;

  // Derive thumbnail path from original video source path
  // e.g., "videos/clip.mov" -> "videos/clip.thumb.jpg"
  function deriveThumbPath(videoSourcePath) {
    var path = videoSourcePath
      .replace(/\.mp4$/i, '')
      .replace(/\.mov$/i, '')
      .replace(/\.webm$/i, '');
    return path + '.thumb.jpg';
  }

  // Listen for asset ready events from backend
  listen('asset_ready', function(event) {
    var path = event.payload.path;
    var asset_type = event.payload.asset_type;

    if (asset_type === 'thumbnail') {
      // Thumbnail ready: swap poster from SVG placeholder to real thumbnail
      // The path is the original video source (e.g., "videos/clip.mov")
      var thumbPath = deriveThumbPath(path);

      // Find video elements by data-placeholder-src matching the video source
      var videos = document.querySelectorAll('video[data-placeholder-src]');
      var found = false;

      for (var i = 0; i < videos.length; i++) {
        var video = videos[i];
        var placeholderSrc = video.getAttribute('data-placeholder-src');
        var thumbSrc = video.getAttribute('data-thumb-src');

        // Match by original source path or by thumb-src
        if (placeholderSrc === path || thumbSrc === thumbPath) {
          video.setAttribute('poster', '/' + thumbPath);
          found = true;
          console.log('[video-placeholder] Poster swapped to thumbnail: /' + thumbPath);
        }
      }

      if (!found) {
        console.warn('[video-placeholder] No video element found for thumbnail: ' + path);
      }
    } else if (asset_type === 'video') {
      // MP4 ready: swap src to enable playback
      // The path is the relative MP4 path (e.g., "videos/clip.mp4")
      var videos = document.querySelectorAll('video[data-placeholder-src]');
      var found = false;

      for (var i = 0; i < videos.length; i++) {
        var video = videos[i];
        var currentSrc = video.getAttribute('src');

        // Match by current src (already points to .mp4 from generator)
        if (currentSrc === path || currentSrc === '/' + path) {
          // Force reload the video to pick up the now-available file
          video.load();
          video.removeAttribute('data-placeholder-src');
          found = true;
          console.log('[video-placeholder] Video src ready: /' + path);
        }
      }

      if (!found) {
        console.warn('[video-placeholder] No video element found for video: ' + path);
      }
    }
  });
})();
