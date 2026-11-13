# Parameters

YapGrid embed URLs support optional query parameters. Add parameters after the embed URL using `?`, and combine multiple parameters with `&`.

Example:

```text
https://yapgrid.com/embed/movie/550?autoplay=1&lang=en
```

## Optional Query Parameters

| Parameter | Type | Values / Example | Description |
| --- | --- | --- | --- |
| `autoplay` | boolean | `1`, `0`, `true`, `false` | Defaults to on. Use `0` or `false` for click-to-play. If the browser blocks autoplay with sound, the player tries muted playback. |
| `lang` | language code | `en`, `sq`, `de`, `fr` | Preferred subtitle language. The main player controls are in English. |
| `title` | string | `Fight%20Club` | Fallback display title when title metadata is unavailable. |
| `theme` | string | `blue`, `amber`, `%2322c55e` | Accent color for supported controls. Use a supported color name such as `blue` or a URL-encoded six-digit hex color. |
| `sub_url` | URL | URL-encoded `.srt` or `.vtt` URL | Adds an external subtitle track. Use a publicly reachable HTTPS file URL. |
| `sub_lang` | language code | `en`, `sq`, `de`, `fr` | Language of the external track. It also supplies the embed's subtitle language preference when `lang` and `sub` are omitted. |
| `sub_label` | string | `English` | Custom name displayed for the external subtitle track. |

Use the parameters in this table for new integrations.

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

URL-encode values such as `title`, `sub_url`, and `sub_label` when building a URL by hand. If you use `URLSearchParams`, pass it the original values so it encodes them once.

Example:

```text
Fight Club -> Fight%20Club
```

For subtitle links, encode the full subtitle URL before placing it in `sub_url`.
