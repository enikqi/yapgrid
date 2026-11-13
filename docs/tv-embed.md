# TV Embed

Use the TV embed endpoint when you want to embed a specific TV episode by TMDB ID, season number, and episode number.

## URL Format

```text
https://yapgrid.com/embed/tv/{tmdbId}/{season}/{episode}
```

Replace:

- `{tmdbId}` with the TV show TMDB ID.
- `{season}` with the season number.
- `{episode}` with the episode number.

Example:

```text
https://yapgrid.com/embed/tv/1396/1/1
```

## iframe Example

```html
<iframe
  src="https://yapgrid.com/embed/tv/1396/1/1?autoplay=0"
  title="YapGrid TV episode player"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

## With Optional Parameters

Example with autoplay and a preferred subtitle language:

```text
https://yapgrid.com/embed/tv/1396/1/1?autoplay=1&lang=en
```

Use the season and episode numbers from the show's TMDB listing. See [Parameters](parameters.md) for other options.

## Notes

- Playback and subtitle availability can vary by episode.
- The **Next episode** button opens the next episode number in the current season. To start another season, use its season and episode numbers in the embed URL.
