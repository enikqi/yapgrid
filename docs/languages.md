# Languages

Use `lang` to set the preferred subtitle language for an embed. The main player controls are in English.

## How YapGrid Picks a Subtitle Language

YapGrid uses the website's `lang` value when it is supported. A viewer's saved choice can take priority. Without an explicit or saved preference, YapGrid tries the viewer's country, then their browser language, then English.

Set `lang=de` to prefer German subtitles.

```text
https://yapgrid.com/embed/movie/550?lang=de
```

## Setting the Language per Zone

Most websites that serve several regions keep the language in the page URL, a subdomain, a cookie, or the user's account settings. Pass that same value straight through to the embed.

If your pages look like this:

| Your page | Pass to YapGrid |
| --- | --- |
| `example.com/de/film/fight-club` | `lang=de` |
| `example.com/es/pelicula/fight-club` | `lang=es` |
| `example.com/pt-br/filme/fight-club` | `lang=pt-br` |
| `example.com/film/fight-club` | `lang=en` |

A small helper is usually enough. In a template, the value you already use to render the page is the value to pass:

```html
<iframe
  src="https://yapgrid.com/embed/movie/550?lang={{ page_language }}"
  title="YapGrid movie player"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

On a multilingual site, pass the page's language as the initial preference. Viewers can pick another language from the subtitle menu.

### When the Zone Has No Obvious Language

For a global page, set `lang=en` if you want English as the default preference. Omit `lang` to let YapGrid infer a preference for each viewer.

## Supported Language Codes

Use the code from this table as the value of `lang`.

| Code | Language | Code | Language | Code | Language | Code | Language |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ar` | Arabic | `fa` | Persian | `ko` | Korean | `si` | Sinhala |
| `bg` | Bulgarian | `fi` | Finnish | `lt` | Lithuanian | `sk` | Slovak |
| `bn` | Bengali | `fr` | French | `lv` | Latvian | `sl` | Slovenian |
| `br` | Breton | `gl` | Galician | `mk` | Macedonian | `sq` | Albanian |
| `bs` | Bosnian | `he` | Hebrew | `ml` | Malayalam | `sr` | Serbian |
| `ca` | Catalan | `hi` | Hindi | `mr` | Marathi | `sv` | Swedish |
| `cs` | Czech | `hr` | Croatian | `ms` | Malay | `ta` | Tamil |
| `da` | Danish | `hu` | Hungarian | `nl` | Dutch | `te` | Telugu |
| `de` | German | `id` | Indonesian | `no` | Norwegian | `th` | Thai |
| `el` | Greek | `is` | Icelandic | `pl` | Polish | `tr` | Turkish |
| `en` | English | `it` | Italian | `pt` | Portuguese | `uk` | Ukrainian |
| `es` | Spanish | `ja` | Japanese | `pt-br` | Portuguese (Brazil) | `ur` | Urdu |
| `et` | Estonian | `ka` | Georgian | `ro` | Romanian | `vi` | Vietnamese |
| `eu` | Basque | `kn` | Kannada | `ru` | Russian | `zh` | Chinese |

`pt` and `pt-br` are separate. Use `pt-br` for Brazil and `pt` for Portugal and the other Portuguese-speaking countries.

An unrecognised code is ignored rather than rejected, and the player falls back to the steps above. Check the spelling against this table if a language does not appear.

## Track Availability

Subtitle tracks vary by movie and episode.

- If a subtitle track exists in that language, it is selected.
- If it does not, YapGrid can translate an available track into that language when translation is available for the title.
- If neither is possible, the viewer can still pick any available track from the player.

## Supplying Your Own Subtitle File

To attach your own file, use `sub_url` with `sub_lang`, as described in [Subtitles](subtitles.md). Set `lang` separately to prefer a subtitle language for the embed.

```text
https://yapgrid.com/embed/movie/550?lang=de&sub_url=https%3A%2F%2Fexample.com%2Fsubs%2Fde.vtt&sub_lang=de&sub_label=Deutsch
```
