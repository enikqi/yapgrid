# Parameters

YapGrid embed URLs support optional query parameters. Add parameters after the embed URL using `?`, and combine multiple parameters with `&`.

Example:

```text
https://yapgrid.com/embed/movie/550?autoplay=1&lang=en
```

## Optional Query Parameters

| Parameter | Type | Values / Example | Description |
| --- | --- | --- | --- |
| `autoplay` | boolean | `1`, `0`, `true`, `false` | Requests automatic playback. Browsers may still block autoplay with sound, so users may need to start playback manually. |
| `lang` | string | `en`, `sq`, `de`, `fr` | Preferred/default subtitle language. Also sets the language of the player interface. |
| `title` | string | `Fight%20Club` | Overrides the title displayed by the player. Text values should be URL-encoded. |
| `sub_url` | string | URL-encoded `.srt` or `.vtt` URL | Adds an external subtitle file. The subtitle host must allow browser CORS access. |
| `sub_lang` | string | `en`, `sq`, `de`, `fr` | Language code for the subtitle supplied through `sub_url`. |
| `sub_label` | string | `English` | Custom name displayed for the external subtitle track. |

Any parameter not listed here is ignored. Unknown parameters do not cause an error, so an embed URL that carries extra values from another player still loads normally.

## Accepted Aliases

Some parameters accept a second spelling. Both forms behave identically, so you can keep an existing embed URL as it is.

| Alias | Same as |
| --- | --- |
| `autoPlay` | `autoplay` |
| `sub` | `lang` |
| `subUrl` | `sub_url` |
| `ds_lang` | `sub_lang` |

## External Subtitle Example

```text
https://yapgrid.com/embed/movie/550?sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.srt&sub_lang=en&sub_label=English
```

## Combined Example

```text
https://yapgrid.com/embed/movie/550?autoplay=1&lang=en&sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.vtt&sub_lang=en&sub_label=English
```

## URL Encoding

Values such as `title`, `sub_url`, and `sub_label` should be URL-encoded when they contain spaces, symbols, or a full URL.

Example:

```text
Fight Club -> Fight%20Club
```

For subtitle links, encode the full subtitle URL before placing it in `sub_url`.
