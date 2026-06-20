# Getting Started

YapGrid provides public embed URLs for movies and TV episodes. You can place these URLs inside an iframe on your website and create a watch page without building a custom video player interface.

The goal is simple: a website owner can create movie or TV pages, use TMDB IDs to point the embed to the correct title, and let YapGrid provide the public player experience inside the page.

## Who This Is For

YapGrid documentation is useful for:

- Website owners creating a movie or TV catalog.
- Developers building movie detail pages, episode pages, or entertainment directories.
- Publishers who want a responsive player area inside articles or landing pages.
- Communities that want a simple embed format for movie and TV pages.
- International websites that need subtitles, subtitle upload, and in-player subtitle translation.

This repository explains public embed usage only. It does not include application source code or private operational details.

## What You Need

To create an embed, you need:

- A TMDB ID for the movie or TV show.
- For TV shows, the season number and episode number.
- A responsive iframe container on your page.

No API key is required.

## Basic Workflow

A simple YapGrid integration usually looks like this:

1. Choose the movie or TV episode you want to show on your page.
2. Find the correct TMDB ID.
3. Build the YapGrid embed URL.
4. Place the URL inside an iframe.
5. Use a responsive 16:9 layout so the player works across screen sizes.
6. Add optional query parameters for autoplay, initial server, title, language, theme, or subtitles.

## Movie URL Format

```text
https://yapgrid.com/embed/movie/{tmdbId}
```

Example:

```text
https://yapgrid.com/embed/movie/550
```

## TV URL Format

```text
https://yapgrid.com/embed/tv/{tmdbId}/{season}/{episode}
```

Example:

```text
https://yapgrid.com/embed/tv/1396/1/1
```

## Recommended iframe Style

Use a responsive 16:9 layout so the player scales cleanly across desktop, tablet, and mobile screens.

```html
<iframe
  src="https://yapgrid.com/embed/movie/550"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

## Why the iframe Approach Is Useful

The iframe approach makes YapGrid easy to place inside many types of websites. You can build your own website design, navigation, search pages, movie cards, TV episode pages, and recommendation sections around the player while keeping the actual player experience consistent.

Inside the player, users can access playback controls, server selection, quality selection, subtitles, subtitle upload, subtitle translation, playback speed, volume, fullscreen, and loading indicators.

## Subtitle Translation

YapGrid includes subtitle translation inside the player when available. This helps international users follow a movie or episode in a language that is easier for them to understand.

For example, a user may select an available subtitle track and use the translation option from the player controls. This avoids forcing the user to leave the player just to look for a translated subtitle file somewhere else.

Availability may vary by title, language, and browser behavior.

## Optional Parameters

YapGrid supports optional query parameters for autoplay, initial server, subtitle language, title, theme, and external subtitles.

See [Parameters](parameters.md) for the full list.

## Next Steps

- Use [Movie Embed](movie-embed.md) for movie examples.
- Use [TV Embed](tv-embed.md) for episode examples.
- Use [Parameters](parameters.md) to customize embed behavior.
- Use [Subtitles](subtitles.md) to add or manage subtitle tracks.
- Use [Player Controls](player-controls.md) to understand what users can do inside the player.
- Use [Troubleshooting](troubleshooting.md) if an embed does not behave as expected.