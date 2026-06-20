# Parameters

YapGrid embed URLs support optional query parameters. Add parameters after the embed URL using `?`, and combine multiple parameters with `&`.

Example:

```text
https://yapgrid.com/embed/movie/550?autoplay=1&server=x&lang=en
```

## Optional Query Parameters

| Parameter | Type | Values / Example | Description |
| --- | --- | --- | --- |
| `autoplay` | boolean | `1`, `0`, `true`, `false` | Requests automatic playback. Browsers may still block autoplay with sound, so users may need to start playback manually. |
| `server` | string | `x`, `y`, `z` | Sets the initial server. The user can still switch servers from the player controls. |
| `lang` | string | `en`, `sq`, `de`, `fr` | Preferred/default subtitle language. |
| `title` | string | `Fight%20Club` | Overrides the title displayed by the player. Text values should be URL-encoded. |
| `theme` | string | `red`, `blue`, `dark` | Sets the player accent theme when supported. |
| `sub_url` | string | URL-encoded `.srt` or `.vtt` URL | Adds an external subtitle file. The subtitle host must allow browser CORS access. |
| `sub_lang` | string | `en`, `sq`, `de`, `fr` | Language code for the subtitle supplied through `sub_url`. |
| `sub_label` | string | `English` | Custom name displayed for the external subtitle track. |
| `ds_lang` | string | `en`, `sq`, `de`, `fr` | Compatibility alias for `sub_lang`. |

## External Subtitle Example

```text
https://yapgrid.com/embed/movie/550?sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.srt&sub_lang=en&sub_label=English
```

## Combined Example

```text
https://yapgrid.com/embed/movie/550?autoplay=1&server=x&lang=en&sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.vtt&sub_lang=en&sub_label=English
```

## URL Encoding

Values such as `title`, `sub_url`, and `sub_label` should be URL-encoded when they contain spaces, symbols, or a full URL.

Example:

```text
Fight Club -> Fight%20Club
```

For subtitle links, encode the full subtitle URL before placing it in `sub_url`.
