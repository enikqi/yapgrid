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
  src="https://yapgrid.com/embed/movie/550"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

## With Optional Parameters

You can add optional query parameters to adjust the initial player behavior.

Example with autoplay, initial server, and preferred subtitle language:

```text
https://yapgrid.com/embed/movie/550?autoplay=1&server=x&lang=en
```

Example with a custom displayed title:

```text
https://yapgrid.com/embed/movie/550?title=Fight%20Club
```

When adding text values such as a title, URL-encode spaces and special characters.

## Notes

- The user can switch servers from inside the player.
- Subtitle availability can vary by movie.
- Autoplay may still be blocked by browser policy, especially when sound is enabled.
