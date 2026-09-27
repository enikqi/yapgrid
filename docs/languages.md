# Languages

One parameter, `lang`, controls both the subtitle language and the language of the player interface. This page explains how YapGrid picks a language, why you should set it yourself, and how to set it correctly when your website serves several regions.

## How YapGrid Picks a Language

When the player opens, it works down this list and stops at the first answer it gets:

1. **The `lang` parameter in your embed URL.** If you set it, nothing else is consulted.
2. **The viewer's country.** Used only when `lang` is absent.
3. **The viewer's browser language**, from the `Accept-Language` header the browser sends.
4. **English**, when none of the above produced a supported language.

Steps 2 and 3 are guesses. They are there so an embed without any parameters still shows something sensible, not because they are expected to be correct. Step 1 is the only one that reflects what your website actually knows about the visitor.

## Always Set `lang`

Your website knows which region or language section a visitor is reading. YapGrid does not. A viewer travelling abroad, using a VPN, or running an English-language operating system in a non-English country will be guessed wrong by steps 2 and 3, and there is nothing the player can do about it.

Set `lang` explicitly:

```text
https://yapgrid.com/embed/movie/550?lang=de
```

This sets the subtitle language to German and shows the player interface in German at the same time.

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
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

Do not hard-code one language across a multi-region site. A single `lang=en` on every page means your German and Spanish sections show English subtitles to visitors who came specifically for their own language.

### When the Zone Has No Obvious Language

Some sections are not tied to a language, such as a global "trending" page. Use `lang=en` there rather than leaving the parameter out. An explicit English is predictable; an omitted parameter means the player guesses, and two visitors on the same page can see two different languages.

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

## What `lang` Does Not Do

`lang` states a preference. It does not create a subtitle track that does not exist.

- If a subtitle track exists in that language, it is selected.
- If it does not, YapGrid can translate an available track into that language when translation is available for the title.
- If neither is possible, the viewer can still pick any available track from the player.

Subtitle availability varies by title, so a language that works on one movie may have nothing on another.

## Supplying Your Own Subtitle File

`lang` selects from what YapGrid finds. To attach a specific file of your own, use `sub_url` together with `sub_lang`, described in [Subtitles](subtitles.md). The two can be combined: `sub_url` adds your track, and `lang` still sets the interface language.

```text
https://yapgrid.com/embed/movie/550?lang=de&sub_url=https%3A%2F%2Fexample.com%2Fsubs%2Fde.vtt&sub_lang=de&sub_label=Deutsch
```

## Checklist

- Pass `lang` on every embed rather than relying on detection.
- Use the value your page already knows, not a fixed one.
- Use `en` for sections that are not tied to a region.
- Take the code from the table above, and use `pt-br` rather than `pt` for Brazil.
- Remember that a preference is not a guarantee: availability still depends on the title.
