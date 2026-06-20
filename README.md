# YapGrid Documentation

![YapGrid favicon](https://yapgrid.com/favicon.svg)

YapGrid is an ad-free movie and TV streaming embed player for worldwide users. It lets website owners add a public playback experience to movie pages, TV episode pages, blogs, directories, community sites, and entertainment platforms by using simple iframe embed URLs.

YapGrid is designed for builders who want to start a movie or TV website without building a custom player from scratch. You only need the public YapGrid embed URL, a TMDB ID, and a responsive iframe. Movies and TV episodes can be embedded directly from `https://yapgrid.com` with no API key required.

> This repository contains documentation only. It does not contain the YapGrid application source code, and it does not mean the player source code is open source.

## Live Website

- Website: <https://yapgrid.com>
- Movie embed example: <https://yapgrid.com/embed/movie/550>
- TV embed example: <https://yapgrid.com/embed/tv/1396/1/1>

## What YapGrid Offers

YapGrid provides a clean public player experience that can be embedded worldwide. It supports:

- Movies using TMDB movie IDs.
- TV episodes using TMDB TV IDs, season numbers, and episode numbers.
- A fast multi-server streaming network with an in-player Server X/Y/Z selector.
- Automatic synchronized subtitles when available for the selected title.
- Local `.srt` and `.vtt` subtitle uploads inside the player.
- External subtitle URLs through embed parameters.
- In-player subtitle translation for users who want subtitles in another language when supported.
- Quality selection, playback speed, fullscreen, volume, seek controls, and loading indicators.
- Responsive behavior for desktop, tablet, and mobile screens.

## Built for Movie and TV Website Owners

YapGrid is useful when you want to create a movie or TV website that focuses on discovery, catalog pages, watch pages, editorial content, or community recommendations. Instead of designing a player interface, server selector, subtitle selector, subtitle upload workflow, and responsive playback layout yourself, you can place a YapGrid iframe on your page and keep your website focused on the user experience around the player.

A typical website flow can be simple:

1. Create a page for a movie or TV episode.
2. Store or display the correct TMDB ID.
3. Add the YapGrid iframe for that movie or episode.
4. Let the player handle playback controls, server switching, subtitles, subtitle uploads, and subtitle translation.

Website owners remain responsible for how they use public embeds and for following applicable laws, platform rules, and content policies in their own projects.

## Standout Feature: Subtitle Translation Inside the Player

One of YapGrid’s most useful player features is direct subtitle translation. When subtitle translation is available, users can translate subtitles from inside the player controls without leaving the viewing experience.

This is especially helpful for international audiences. A viewer may open a movie or TV episode, select available subtitles, and use the translation option to make the content easier to follow in their preferred language. This reduces friction for users because they do not need to search for separate translated subtitle files before watching.

Subtitle availability, translation availability, and translation quality can vary by title, language, and browser behavior. YapGrid does not make uptime, subtitle, or translation guarantees.

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
| [Subtitles](docs/subtitles.md) | Automatic subtitles, local uploads, external subtitle links, and translation. |
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

This repository is for public user documentation. It helps website owners and viewers understand how to embed and use the public YapGrid player correctly. It does not publish application source code, deployment details, private configuration, or operational details.