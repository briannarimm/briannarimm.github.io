# Missouri Election Results, November 3, 2026

A results page for Missouri's 2026 general election at `/missouri-results/`: the State Auditor race, Amendments 3, 6, 7 and 8, Proposition A, the Supreme Court retention vote, every U.S. House, State Senate and State House seat, judicial retention votes and circuit-court races, county offices, and local ballot questions, with county and district maps, a seat chart with supermajority markers, and flips measured against who held each seat before the election.

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
| `data/judicial.csv` | Court of Appeals retention votes and circuit/associate circuit races from the SOS count, by county. Columns: `race, group, unit_id, choice, party, votes, reporting` (`group` is `appeals`, `retention` or `elected`). The Supreme Court retention vote stays in `results.csv`. |
| `data/offices.json` | County offices (presiding commissioner, clerks, recorder, treasurer, collector, prosecutor, auditor, associate circuit judges, Jackson County executive and legislature), by county, with each county's source. |
| `data/local.json` | Local ballot questions gathered from county clerks, election boards and local news, with sources. |
| `data/places.json` | City label positions and each county's and district's largest places. |
| `data/mo.topo.json` | County, congressional, State Senate and State House boundaries (Census Bureau 2025 cartographic files, simplified). |
| `tools/` | Scripts that rebuild the data files. Jekyll does not publish this folder. |

## Where the numbers come from

- **Results:** the Missouri Secretary of State's election-night reporting site (enr.sos.mo.gov), saved as PDF printouts of the statewide page and each county page, then parsed with `tools/parse_enr.py`. Every parsed race is checked against the "Total Votes" line printed on its page, and the county files are checked against the statewide totals.
  - **Refreshed Nov 5, 6:30 p.m.** The election-night printouts (12:20 a.m. Nov 4) were compared county by county with the live SOS site. Four counties had changed since then: Laclede and Vernon added late ballots, and the SOS fixed dropped digits in Christian (auditor, Wilson) and Jefferson (auditor, Fitzpatrick).
  - **County-clerk corrections** (listed in `data/meta.json` under `corrections`): where a county's own results report shows the state feed is wrong, the county figure is used. These are Andrew (the state feed is missing about 175 ballots), Osage (Prop A Yes 2,677, not 3,677), Linn (Prop A rows shifted) and Randolph (auditor Wilson 2,001, not 1,001). Statewide and district rows are re-summed from the counties, so the app's statewide Prop A Yes total is 1,000 lower than the SOS site.
- **Kansas City:** the Kansas City Election Board counts only Kansas City voters who live in Jackson County. Its file is added into Jackson County on the map. Kansas City voters in Clay, Platte and Cass counties are counted in those counties' own results.
- **Seat holders:** Ballotpedia's member lists, checked against the House and Senate sites. Vacant seats count for the party that last held them.
- **Population centers:** Census 2024 city population estimates for counties; the 2020 Census redistricting file (block counts) for districts, assigned by `tools/district_places.py`.
- **Courts:** the same SOS count. Linn County's Court of Appeals (Hardwick) rows were shifted in the state feed; the Linn County Clerk's 2,136 Yes / 1,076 No is used (listed in `corrections`). Andrew uses the county clerk's figures for every race.
- **County offices:** the SOS doesn't publish them, so they come from county clerks' result reports (PDFs and scans, read with `pdftotext` or OCR and checked against each contest's printed total where there is one) and from local news (KY3, KFVS12, KOAM, KTTN, KRMS, the St. Louis Post-Dispatch, the Southeast Missourian, the Mexico Ledger, The Beacon). News pages list only contested races, so those counties are marked as partial. `tools/build_offices.py` builds `offices.json`. 87 of 115 counties are covered, 11 of them partially. Jefferson, St. Charles, Franklin and Stone come from their clerks' election-night results pages (livevoterturnout.com), St. Louis City from the Board of Election Commissioners, and Jackson from The Beacon's totals for both election boards. St. Louis County comes from the St. Louis Post-Dispatch and Greene from KY3; both list only contested races. No November results could be found for Carter, Clark, Dade, Dent, Douglas, Gasconade, Gentry, Henry, Holt, Iron, Lewis, Lincoln, Livingston, Maries, Marion, Mercer, Montgomery, New Madrid, Ozark, Putnam, Ralls, Reynolds, Ripley, Schuyler, Shelby, St. Clair, Warren and Worth.
- **Local measures:** `tools/merge_local.py` combines regional research files and checks each entry's vote share against its result and threshold.

## Updating the data

1. Save the Secretary of State's statewide results page and each county page as PDF, and convert them to text with `pdftotext -layout`.
2. Run `python3 tools/parse_enr.py TXT_DIR data/results.csv` to rebuild `results.csv` and `meta.json`.
3. Reload the page. No other step is needed.

`tools/build_inline.py` bundles everything into a single HTML file, for sharing the page outside the site.
