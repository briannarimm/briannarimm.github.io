# Missouri Election Results, November 3, 2026

A results page for Missouri's 2026 general election at `/missouri-results/`: the State Auditor race, Amendments 3, 6, 7 and 8, Proposition A, the Supreme Court retention vote, every U.S. House, State Senate and State House seat, and local ballot questions, with county and district maps, a seat chart with supermajority markers, and flips measured against who held each seat before the election.

The page is plain HTML, CSS and JavaScript. It draws the maps with [d3](https://d3js.org) and [topojson-client](https://github.com/topojson/topojson-client), loaded from cdnjs. There is no build step: the page reads the files in `data/` when it loads.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The page: header, map, panels, seat chart, table. |
| `app.css` | Styles. Uses the site's tokens from `DESIGN.md` plus an election palette (blue, red, purple, and sage/amber for Yes/No). |
| `app.js` | Loads the data, draws the maps and charts, handles the views. |
| `data/results.csv` | Every result, one row per candidate (or Yes/No) per county or district. Columns: `race, district, unit, unit_id, choice, party, votes, reporting, winner`. |
| `data/meta.json` | When the statewide count was captured and which county files it came from. |
| `data/holders.json` | Who held each seat before the election, used to find flips. |
| `data/measures.json` | Plain-language descriptions of the statewide measures and races. |
| `data/local.json` | Local ballot questions gathered from county clerks, election boards and local news, with sources. |
| `data/places.json` | City label positions and each county's and district's largest places. |
| `data/mo.topo.json` | County, congressional, State Senate and State House boundaries (Census Bureau 2025 cartographic files, simplified). |
| `tools/` | Scripts that rebuild the data files. Jekyll does not publish this folder. |

## Where the numbers come from

- **Results:** the Missouri Secretary of State's election-night reporting site (enr.sos.mo.gov), saved as PDF printouts of the statewide page and each county page, then parsed with `tools/parse_enr.py`. Every parsed race is checked against the "Total Votes" line printed on its page, and the county files are checked against the statewide totals.
- **Kansas City:** the Kansas City Election Board counts only Kansas City voters who live in Jackson County. Its file is added into Jackson County on the map. Kansas City voters in Clay, Platte and Cass counties are counted in those counties' own results.
- **Seat holders:** Ballotpedia's member lists, checked against the House and Senate sites. Vacant seats count for the party that last held them.
- **Population centers:** Census 2024 city population estimates for counties; the 2020 Census redistricting file (block counts) for districts, assigned by `tools/district_places.py`.
- **Local measures:** `tools/merge_local.py` combines regional research files and checks each entry's vote share against its result and threshold.

## Updating the data

1. Save the Secretary of State's statewide results page and each county page as PDF, and convert them to text with `pdftotext -layout`.
2. Run `python3 tools/parse_enr.py TXT_DIR data/results.csv` to rebuild `results.csv` and `meta.json`.
3. Reload the page. No other step is needed.

`tools/build_inline.py` bundles everything into a single HTML file, for sharing the page outside the site.
