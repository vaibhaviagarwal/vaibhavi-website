# vaibhaviagarwal.com

Single-page site. Plain HTML, CSS and JavaScript — no build step, no dependencies.
Edit a file, save, refresh.

## Files

```
index.html    the whole page + all the script
style.css     all styling
vaibhavi.JPG  portrait (Euclid Ave)
painting.jpg  artwork
resume.pdf    linked from the resume button
favicon.svg   the Q♦4♠
*.mp4         project demos
archive/      old site — safe to delete once you're sure
```

## Where to change things

| I want to… | Go to |
| --- | --- |
| Add trip photos | `index.html` → script → **`TRIPS`** (section 1) |
| Log a poker session | `index.html` → script → **`SESSIONS`** (section 1) |
| Change the music period | `index.html` → script → **`LASTFM`** (section 1) |
| Edit bio, facts, links | `index.html` → `<!-- identity -->` |
| Add a project + repo link | `index.html` → `<!-- projects -->` |
| Add a job | `index.html` → `<!-- experience -->` |
| Add artwork | `index.html` → `<!-- art -->` |
| Add or update a trip | `index.html` → `<!-- trips -->` |
| Change the film | `index.html` → `<!-- logs -->` |
| Colours, type, spacing | `style.css` → `:root` at the top |

Everything you update regularly is in **section 1** of the script. Sections 2–7
are plumbing.

## Adding trip photos

1. Drop the image files into this folder.
2. In `TRIPS`, add a line per photo. The key matches `data-trip` on the trip's
   `<li>`.

```js
const TRIPS = {
  hamburg: [
    ['hamburg-1.jpg', 'First week. The harbour never actually stops.']
  ]
};
```

Only trips badged `went` are clickable. A `went` trip with no photos still
opens and says there are none yet.

## Logging poker

```js
const SESSIONS = [
  ['2026-09-08', 18, 'ran quiet, folded a lot'],
  ['2026-09-10', -25, ''],
];
```

Date, result in dollars (negative for a loss), optional note. Newest at the
bottom. While the list is empty the tab shows the "tracking from September"
note and hides the stats, chart and list on its own.

## Things that hide themselves

So the site never looks half-finished:

- a `.repo` link still set to `href="#"` is removed
- an artwork whose image file is missing is removed
- the poker stats, chart and log vanish while `SESSIONS` is empty
- the music receipt falls back to three lines if last.fm can't be reached

## Running it locally

```
python3 -m http.server
```

Then open <http://localhost:8000>. Opening `index.html` directly with
`file://` works, except the music receipt — last.fm won't answer a `file://`
page, so you'll see the fallback.

## Deploying

Push to the GitHub Pages repo. `CNAME` handles the domain.

## Notes

- The last.fm API key in `index.html` is public by design. It's read-only over
  public listening data. Don't reuse it anywhere that writes.
- Last.fm only counts what you play after connecting Spotify, so the receipt
  fills in over time.
- The background walker is a random walk biased toward the cursor; the pull
  reverses inside 170px so it never arrives. It's frozen on touch devices and
  for anyone with reduced motion enabled.
