# Subtitles

YapGrid supports automatic subtitle tracks, local subtitle uploads, and external subtitle URLs.

## Automatic Subtitles

YapGrid automatically loads available subtitle tracks from multiple subtitle sources.

Subtitle availability depends on the selected movie or episode. Some titles may have several subtitle languages, while others may have limited or no available subtitles.

Users can select subtitles from the player controls.

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

## Subtitle Language and Label

Use `sub_lang` to define the subtitle language code.

Use `sub_label` to define the name displayed in the player.

Example:

```text
https://yapgrid.com/embed/movie/550?sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.vtt&sub_lang=en&sub_label=English
```

`ds_lang` is available as a compatibility alias for `sub_lang`.
