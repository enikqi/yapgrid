# Troubleshooting

Use this guide when an embed does not behave as expected.

## Timeout

Use **Try again** if the player cannot find a playback source. If the title is still unavailable, try another title to check the embed setup.

## No Stream Found

Check that you used the movie or show TMDB ID and, for TV, the correct season and episode numbers. Availability varies by title and can change over time.

## Subtitles Out of Sync

For a track marked **Unverified timing**, use the controls next to the time bar to shift it in half-second steps. If the mismatch grows during playback, try another track for that release.

## Autoplay Blocked

Press **Play** if the browser blocks autoplay. If playback starts muted, use the volume control to turn on sound.

## Fullscreen Unavailable

Make sure the iframe includes both `allowfullscreen` and fullscreen permission in the `allow` attribute.

Recommended iframe attributes:

```html
allow="autoplay; fullscreen; picture-in-picture"
allowfullscreen
```

## External Subtitles Not Loading

Confirm `sub_url` contains a URL-encoded, publicly reachable HTTPS link to an `.srt` or `.vtt` file. Open the original URL to check that it returns the subtitle file. See [Subtitles](subtitles.md#external-subtitle-urls).

## Embed Sizing Issues

Use a responsive 16:9 iframe style:

```html
style="width:100%; aspect-ratio:16/9; border:0"
```

## Changes Not Showing

Reload the embed after changing its URL. If the subtitle language still differs from your setting, open **Subtitles**, then **Language**, to check the viewer's saved preference.
