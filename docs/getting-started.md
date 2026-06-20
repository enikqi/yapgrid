# Getting Started

YapGrid provides public embed URLs for movies and TV episodes. You can place these URLs inside an iframe on your website.

## What You Need

To create an embed, you need:

- A TMDB ID for the movie or TV show.
- For TV shows, the season number and episode number.
- A responsive iframe container on your page.

No API key is required.

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

## Optional Parameters

YapGrid supports optional query parameters for autoplay, initial server, subtitle language, title, theme, and external subtitles.

See [Parameters](parameters.md) for the full list.

## Next Steps

- Use [Movie Embed](movie-embed.md) for movie examples.
- Use [TV Embed](tv-embed.md) for episode examples.
- Use [Subtitles](subtitles.md) to add or manage subtitle tracks.
- Use [Troubleshooting](troubleshooting.md) if an embed does not behave as expected.
