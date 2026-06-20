# YapGrid Use Cases

YapGrid helps website owners embed the public YapGrid player on movie and TV pages by using simple iframe URLs.

This page is for lawful, public documentation use only. Website owners are responsible for following applicable laws, platform rules, and content policies in their own projects.

## Movie Website Pages

A movie page can include a title, description, artwork, metadata, and a responsive YapGrid iframe.

```html
<iframe
  src="https://yapgrid.com/embed/movie/550"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

This format is useful for builders who want a simple movie embed player based on a TMDB movie ID.

## TV Episode Pages

A TV episode page can include the show title, season number, episode number, episode description, and a YapGrid TV embed.

```html
<iframe
  src="https://yapgrid.com/embed/tv/1396/1/1"
  style="width:100%; aspect-ratio:16/9; border:0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

The TV embed format uses a TMDB TV ID, season number, and episode number.

## International Subtitle Support

YapGrid is useful for international movie and TV websites because the player supports automatic subtitles, local subtitle uploads, external subtitle URLs, and subtitle translation when available.

Subtitle translation can help viewers read subtitles in a preferred language without leaving the player interface.

## Responsive Embeds

Use a responsive 16:9 iframe style for desktop, tablet, and mobile layouts.

```html
style="width:100%; aspect-ratio:16/9; border:0"
```

## One Embed URL with Server Selection

YapGrid includes a Server X/Y/Z selector inside the player. A website can use one embed URL, while viewers can switch servers from the player controls when needed.

## External Subtitle Example

```text
https://yapgrid.com/embed/movie/550?sub_url=https%3A%2F%2Fexample.com%2Fsubtitles%2Fenglish.srt&sub_lang=en&sub_label=English
```

External subtitle URLs must be URL-encoded and accessible by the viewer’s browser.