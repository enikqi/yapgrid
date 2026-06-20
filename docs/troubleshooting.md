# Troubleshooting

Use this guide when an embed does not behave as expected.

## Timeout

Retry playback or select another server from the player controls.

## No Stream Found

Test another server. Availability may differ between servers and titles.

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
