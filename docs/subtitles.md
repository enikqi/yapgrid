# Subtitles

YapGrid supports automatic subtitle tracks, local subtitle uploads, external subtitle URLs, and subtitle translation inside the player when available.

Subtitles are an important part of the YapGrid experience because movie and TV websites often serve international audiences. A viewer may prefer a different language than the original audio, may need captions for accessibility, or may want to upload a custom subtitle file for the current session.

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

## Local Subtitle Uploads

Users can upload local subtitle files directly inside the player.

Supported formats:

- `.srt`
- `.vtt`

Maximum local subtitle file size:

```text
5 MB
```

Local subtitle uploads remain inside the user’s browser session. They are intended for the current viewing session and are not added as public subtitle tracks.

A local upload is helpful when a user already has a subtitle file and wants to use it immediately without changing the embed URL.

## External Subtitle URLs

You can attach an external subtitle file using `sub_url`.

External subtitle files must:

- Use HTTP or HTTPS.
- Be in `.srt` or `.vtt` format.
- Allow browser CORS access.
- Be available to the viewer’s browser.

Example:

```text
https://yapgrid.com/embed/movie/550?sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.srt&sub_lang=en&sub_label=English
```

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
- Keep local subtitle files under 5 MB.
- Use HTTPS for external subtitle files when possible.
- Make sure external subtitle files allow browser CORS access.
- Use clear labels such as `English`, `Albanian`, `German`, or `French`.
- Test the embed after adding an external subtitle URL.
- Remember that automatic subtitles and translation can vary by movie, episode, and language.