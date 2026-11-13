# Subtitles

YapGrid supports automatic subtitle tracks, external subtitle URLs, and in-player subtitle translation when available.

Viewers can choose a subtitle language to follow the dialogue or use captions for accessibility.

## Automatic Subtitles

YapGrid automatically loads available subtitle tracks from multiple subtitle sources.

Subtitle availability depends on the selected movie or episode. Some titles may have several subtitle languages, while others may have limited or no available subtitles.

Users can select subtitles from the player controls.

## In-Player Subtitle Translation

YapGrid includes subtitle translation directly inside the player when the feature is available for the selected subtitle track.

This is one of the most advanced parts of the public player experience. Instead of making users leave the player, search for another subtitle file, download it, and upload it manually, YapGrid can provide a translation option from inside the player controls.

This is useful for:

- International audiences who want subtitles in their preferred language.
- Websites that attract visitors from different countries.
- Users who find an available subtitle track but want to read it in another language.
- Viewers on mobile devices who need a faster, simpler subtitle workflow.

Subtitle translation availability and quality can vary. Translation may depend on the selected subtitle track, language pair, browser behavior, and title availability. YapGrid does not guarantee that every subtitle track can be translated.

## Subtitle Timing Adjustment

A subtitle can run early or late if it was timed for a different release. For tracks marked **Unverified timing**, use the controls next to the time bar to shift the subtitles earlier or later.

- Each click shifts the track by half a second and takes effect immediately.
- The adjustment range is five minutes in either direction.
- The player remembers manual adjustments in the current browser. It can also reuse an automatic timing match for the same subtitle and video version.

## External Subtitle URLs

You can attach an external subtitle file using `sub_url`.

Use a direct, publicly reachable HTTPS URL to an `.srt` or `.vtt` file.

Example:

```text
https://yapgrid.com/embed/movie/550?sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.srt&sub_lang=en&sub_label=English
```

Replace the example URL with the address of your subtitle file.

External subtitle URLs are useful when a website owner wants a specific subtitle track to appear with the embed by default.

## Encoding External Subtitle URLs

External URLs must be URL-encoded before being placed inside an embed URL.

Original subtitle URL:

```text
https://example.com/subtitles/english.srt
```

Encoded value:

```text
https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.srt
```

You can encode a URL with `encodeURIComponent()` by passing the full subtitle URL as the value to encode. Use the encoded result as the value for `sub_url`.

For example, the URL:

```text
https://example.com/subtitles/english.srt
```

becomes:

```text
https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.srt
```

## Subtitle Language and Label

Use `sub_lang` to define the subtitle language code.

Use `sub_label` to define the name displayed in the player.

Example:

```text
https://yapgrid.com/embed/movie/550?sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.vtt&sub_lang=en&sub_label=English
```

`ds_lang` is available as a compatibility alias for `sub_lang`.

## Best Practices

- Use `.vtt` or `.srt` files only.
- Use clear labels such as `English`, `Albanian`, `German`, or `French`.
- Test the embed after adding an external subtitle URL.
- Remember that automatic subtitles and translation can vary by movie, episode, and language.
