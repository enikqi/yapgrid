# Movie Embed

Use the movie embed endpoint when you want to embed a movie by TMDB ID.

## URL Format

```text
https://yapgrid.com/embed/movie/{tmdbId}
```

Replace `{tmdbId}` with the movie TMDB ID.

Example:

```text
https://yapgrid.com/embed/movie/550
```

## iframe Example

```html
<iframe
  src="https://yapgrid.com/embed/movie/550?autoplay=0"
  title="YapGrid movie player"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

## With Optional Parameters

You can add optional query parameters to adjust the initial player behavior.

Example with autoplay and a preferred subtitle language:

```text
https://yapgrid.com/embed/movie/550?autoplay=1&lang=en
```

Use `autoplay=0` to wait for the viewer to press Play. See [Parameters](parameters.md) for the full list of options.

## Notes

- Subtitle availability can vary by movie.
- Browsers may start autoplay muted or require the viewer to press Play.
