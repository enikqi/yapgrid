# Troubleshooting

Use this guide when an embed does not behave as expected.

## Timeout

Retry playback. If the title still does not start, try again later.

## No Stream Found

Availability can differ between titles and can change over time. Confirm the TMDB ID is correct for the movie or episode, then retry.

## Subtitles Out of Sync

Use the timing control next to the subtitle list to shift subtitles earlier or later in half-second steps. If a track is far out, switching to a different subtitle track is usually faster than a large shift.

## Autoplay Blocked

Interact with the player manually. Browsers may block autoplay, especially when sound is enabled.

## Fullscreen Unavailable

Make sure the iframe includes both `allowfullscreen` and fullscreen permission in the `allow` attribute.

Recommended iframe attributes:

```html
allow="autoplay; fullscreen; picture-in-picture"
allowfullscreen
```

## External Subtitles Not Loading

Check the following:

- The subtitle URL uses HTTPS or HTTP.
- The subtitle URL is URL-encoded.
- The subtitle file is `.srt` or `.vtt`.
- The subtitle host allows browser CORS access.
- The subtitle file is available to the viewer’s browser.

## Local Subtitle Upload Rejected

Use a `.srt` or `.vtt` file under 5 MB.

## Embed Sizing Issues

Use a responsive 16:9 iframe style:

```html
style="width:100%; aspect-ratio:16/9; border:0"
```

## Changes Not Showing

Hard refresh the browser after changing embed parameters.
