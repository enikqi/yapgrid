# FAQ

## Is an API key required?

No. YapGrid public embeds do not require an API key.

## Can I use YapGrid to start a movie or TV website?

Yes. YapGrid is designed so website owners can add a public movie and TV player to their own pages using simple iframe embed URLs.

You can build your own website around YapGrid with movie pages, TV episode pages, search pages, category pages, editorial content, and recommendation sections. The YapGrid iframe can then provide the embedded player experience on each watch page.

Website owners are responsible for how they use embeds and for following applicable laws, platform rules, and content policies.

## What makes YapGrid useful for international users?

YapGrid supports subtitles, local subtitle uploads, external subtitle URLs, and subtitle translation inside the player when available.

Subtitle translation is especially useful because users can adjust subtitle language options directly from the player controls instead of leaving the viewing experience to look for another subtitle file.

## Can the same URL switch servers?

Yes. Server selection is available inside the player.

## Are separate URLs needed for Server X/Y/Z?

No. You can set an initial server with the `server` parameter, but users can switch servers inside the player.

## Can users upload subtitles?

Yes. Users can upload local `.srt` or `.vtt` subtitle files from the player.

Local subtitle uploads are limited to 5 MB and remain inside the user’s browser session.

## Can users attach an external subtitle URL?

Yes. Website owners can use the `sub_url` parameter to attach an external `.srt` or `.vtt` subtitle file.

The subtitle URL must be URL-encoded, available over HTTP or HTTPS, and accessible by the browser with CORS allowed.

## Can subtitles be translated inside the player?

Yes, when subtitle translation is available. Users can select a subtitle track and use the translation option directly inside the player controls.

Availability and quality can vary by title, language, selected subtitle track, and browser behavior.

## Are movies and TV shows supported?

Yes. Movies and TV episodes are supported using TMDB IDs.

Movies use this format:

```text
https://yapgrid.com/embed/movie/{tmdbId}
```

TV episodes use this format:

```text
https://yapgrid.com/embed/tv/{tmdbId}/{season}/{episode}
```

## Can autoplay always be guaranteed?

No. Browser autoplay policies apply. Users may need to start playback manually.

## Does this repository contain the player source code?

No. This repository contains documentation only.

## Is the YapGrid player source code open source?

No. This documentation repository does not publish the YapGrid application source code and does not mean the player source code is open source.

## Does YapGrid guarantee that every title will play on every server?

No. Availability may vary. If a title does not load on one server, users can retry or select another server from the player controls.

## Does YapGrid guarantee subtitles for every title?

No. Subtitle availability depends on the selected movie or TV episode. Some titles may have several subtitle languages, while others may have limited or no available subtitles.