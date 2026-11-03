---
title: "Creating and Clustering Patron Data"
category: project
visibility: home
date: 2026-10-31
description: "A small Python program for generating random circulation data, and then using clustering to find trends in the data."
display_tag: "ML in Libraries - Topic Exploration"
ai_assisted: false
keywords: ["machine learning", "python", "library sciences"]
links:
  - kind: repository
    label: "Repository"
    url: "https://github.com/briannarimm/patron_clustering"
dc:
  creator: ["Brianna R. Imm"]
  subject: ["machine learning", "python", "library science"]
  publisher: ["Brianna R. Imm"]
  date: ["2026"]
  type: ["software"]
  format: ["application/python"]
  language: ["en"]
  rights: ["MIT License"]
---

## Patron clustering

A small experiment for my ML for Libraries topic exploration (ISLT 7301). The question: can you use clustering to find patterns in circulation data?

I cannot use real patron records for a class project, so the project simulates them. The simulation is built so that it cannot cheat.

### How it works

1. **Simulate patrons.** Each patron gets an age, an activity level, a household card flag, and a mix of interests. The generator has no patron "types" in it. A kids-and-DVDs patron can only appear because age tilts the interest mix toward kids' books and shows. The `coupling` setting controls how strong that tilt is. At 0, interests have nothing to do with age.
2. **Simulate a year of checkouts** from those traits. The result looks like what an ILS would export: patron id, date, format, subject. Nothing else.
3. **Build one row per patron** from the checkouts (share of DVDs, share of kids' subjects, total checkouts, and so on) and cluster the rows with k-means, a Gaussian mixture, or hierarchical clustering.

Only after clustering does the code look back at the hidden traits, to ask whether the clusters mean anything. The traits never go into the clustering.
