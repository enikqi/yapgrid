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
- **Audio track selector**. Choose another audio track when the source provides multiple tracks.
- **Buffering and loading indicators**. See when the player is loading or switching sources.

A website can use one embed URL per title. Playback sources are resolved by YapGrid, so the embed URL does not change when the underlying source changes.

## Subtitles

- **Subtitle selector**: Choose from available subtitle tracks.
- **External subtitle support**: Use embed parameters to attach a subtitle file URL.
- **Subtitle translation**: Translate subtitles from inside the player when available.
- **Subtitle timing adjustment**. Shift subtitle tracks with unverified timing earlier or later.

### Subtitle Translation

Subtitle translation is a key YapGrid feature for international users. When available, users can translate a selected subtitle track directly from the player controls.

This makes the player more useful for multilingual websites because viewers can keep watching while adjusting subtitle language options inside the same player interface.

Translation availability and quality can vary by title, subtitle track, language, and browser behavior.

### Subtitle Timing Adjustment

For tracks with unverified timing, use the controls next to the time bar. Each click shifts the subtitles by half a second, up to five minutes in either direction. Manual shifts are saved in the current browser. See [Subtitles](subtitles.md#subtitle-timing-adjustment) for details.

## Subtitle Language

Open **Subtitles**, then **Language** to choose the preferred subtitle language. Website owners can set the initial preference with `lang`. See [Languages](languages.md).

## Viewing

- **Fullscreen**: Expand the player to fullscreen when allowed by the browser and iframe permissions.
- **Next episode**. Open the next episode number in the current season from a TV embed.
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

The player requests autoplay by default and may start muted. Browser policy can still require the viewer to press Play.
