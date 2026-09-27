# Player Controls

The YapGrid player includes playback, subtitle, viewing, and streaming controls designed for public movie and TV embeds.

The controls are built so users can watch, manage subtitles, translate subtitles when available, correct subtitle timing, adjust playback, and move between viewing modes without leaving the embedded player.

## Playback

- **Play and pause**: Start or stop playback from the main control bar.
- **Seek bar**: Jump to a specific point in the movie or episode.
- **Rewind and forward**: Move backward or forward quickly during playback.
- **Playback speed**: Adjust playback speed when supported by the browser.

These controls help users navigate longer movies and TV episodes without needing any extra page controls outside the iframe.

## Audio

- **Volume control**: Increase or reduce audio volume.
- **Mute and unmute**: Quickly silence or restore audio.

Browser and device settings may also affect audio behavior, especially on mobile devices.

## Streaming Options

- **Quality selector**: Select a playback quality when multiple quality options are available.
- **Buffering and loading indicators**: See when content is preparing, loading, or switching.

A website can use one embed URL per title. Playback sources are resolved by YapGrid, so the embed URL does not change when the underlying source changes.

## Subtitles

- **Subtitle selector**: Choose from available subtitle tracks.
- **Local subtitle upload**: Upload `.srt` or `.vtt` files for the current browser session.
- **External subtitle support**: Use embed parameters to attach a subtitle file URL.
- **Subtitle translation**: Translate subtitles from inside the player when available.
- **Subtitle timing adjustment**: Shift subtitles earlier or later when they run out of sync.

### Subtitle Translation

Subtitle translation is a key YapGrid feature for international users. When available, users can translate a selected subtitle track directly from the player controls.

This makes the player more useful for multilingual websites because viewers can keep watching while adjusting subtitle language options inside the same player interface.

Translation availability and quality can vary by title, subtitle track, language, and browser behavior.

### Subtitle Timing Adjustment

Subtitle files are timed against a particular release of a title. When a viewer watches a different cut, the subtitles can run a few seconds early or late. YapGrid lets the viewer correct this from inside the player instead of hunting for a better subtitle file.

The timing control sits next to the subtitle list:

- Shift the subtitles earlier or later in steps of `0.5` seconds.
- The current shift is shown while adjusting, so the viewer can see the correction before applying it.
- Adjustments are limited to `120` seconds in either direction.

A correction is not private to the viewer who made it. Once someone fixes the timing for a subtitle track, the corrected version is what the next viewer of that title receives. One person spending ten seconds on the control fixes the title for everyone who comes after them, which is why the feature gets more accurate as a title is watched more.

## Interface Language

The player interface is translated into more than 50 languages. Use the `lang` parameter to set it:

```text
https://yapgrid.com/embed/movie/550?lang=de
```

When `lang` is not supplied, the player selects a language for the viewer automatically. The same value also sets the preferred subtitle language, so a single parameter covers both.

## Viewing

- **Fullscreen**: Expand the player to fullscreen when allowed by the browser and iframe permissions.
- **Picture-in-picture**: Use picture-in-picture when supported by the browser.
- **Responsive layout**: The player is designed to fit desktop, tablet, and mobile layouts.

For fullscreen support, the iframe should include `allowfullscreen` and `allow="fullscreen"` or a broader allow value that includes fullscreen permission.

## Mobile Behavior

On mobile devices, controls may appear in a compact layout. Some controls can be grouped behind menus depending on screen size.

Mobile behavior can also depend on:

- Browser autoplay rules.
- Device fullscreen rules.
- Touch controls.
- Screen orientation.
- Network conditions.

Use a responsive iframe style such as `width:100%; aspect-ratio:16/9; border:0` so the player keeps a clean layout on smaller screens.

## Recommended iframe Permissions

Use the following iframe permissions for the best public embed experience:

```html
allow="autoplay; fullscreen; picture-in-picture"
allowfullscreen
```

Autoplay may still be blocked by browser policy, especially when audio is enabled.