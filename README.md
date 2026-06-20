# YapGrid Documentation

![YapGrid favicon](https://yapgrid.com/favicon.svg)

YapGrid is an ad-free movie and TV streaming embed player for worldwide users. It supports movies and TV series by TMDB ID, a fast multi-server streaming network, synchronized subtitles, local subtitle uploads, external subtitle links, and common playback controls.

> This repository contains documentation only. It does not contain the YapGrid application source code, and it does not mean the player source code is open source.

## Live Website

- Website: <https://yapgrid.com>
- Movie embed example: <https://yapgrid.com/embed/movie/550>
- TV embed example: <https://yapgrid.com/embed/tv/1396/1/1>

## Quick Start

### Movie Embed

```html
<iframe
  src="https://yapgrid.com/embed/movie/550"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

### TV Embed

```html
<iframe
  src="https://yapgrid.com/embed/tv/1396/1/1"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

## Public Embed URLs

Movie:

```text
https://yapgrid.com/embed/movie/{tmdbId}
```

TV episode:

```text
https://yapgrid.com/embed/tv/{tmdbId}/{season}/{episode}
```

No API key is required.

## Documentation

| Page | Description |
| --- | --- |
| [Getting Started](docs/getting-started.md) | Basic setup and embed requirements. |
| [Movie Embed](docs/movie-embed.md) | How to embed movies using TMDB IDs. |
| [TV Embed](docs/tv-embed.md) | How to embed TV episodes using TMDB IDs, season, and episode numbers. |
| [Parameters](docs/parameters.md) | Optional query parameters for playback, subtitles, language, and appearance. |
| [Subtitles](docs/subtitles.md) | Automatic subtitles, local uploads, and external subtitle links. |
| [Player Controls](docs/player-controls.md) | Available controls inside the YapGrid player. |
| [Troubleshooting](docs/troubleshooting.md) | Common embed and playback issues. |
| [FAQ](docs/faq.md) | Frequently asked questions. |
| [Contributing](CONTRIBUTING.md) | How to improve this documentation. |
| [Security](SECURITY.md) | How to report documentation or public embed security concerns. |

## Example URLs with Parameters

External subtitle example:

```text
https://yapgrid.com/embed/movie/550?sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.srt&sub_lang=en&sub_label=English
```

Combined example:

```text
https://yapgrid.com/embed/movie/550?autoplay=1&server=x&lang=en&sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.vtt&sub_lang=en&sub_label=English
```

## Scope

This repository is for public user documentation. It is intended to help website owners and users embed the public YapGrid player correctly.
