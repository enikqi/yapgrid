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
  src="https://yapgrid.com/embed/tv/1396/1/1"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

## With Optional Parameters

Example with autoplay, initial server, and preferred subtitle language:

```text
https://yapgrid.com/embed/tv/1396/1/1?autoplay=1&server=y&lang=en
```

Example with a custom displayed title:

```text
https://yapgrid.com/embed/tv/1396/1/1?title=Breaking%20Bad%20S01E01
```

## Notes

- The same URL can still use the player server selector.
- Subtitle availability can vary by episode.
- If one server does not load, users can select another server inside the player.
