---
title: "Creating and Clustering Patron Data"
category: project
visibility: home
date: 2026-10-31
description: "A small Python program for generating random circulation data, and then using clustering to find trends in the data."
display_tag: "ML in Libraries - Topic Exploration"
ai_assisted: true
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


A small experiment for my ML for Libraries topic exploration (ISLT 7301). Inspired by discussion of k-means clustering analysis in Lund (2026, pp. 88–89).

I simulate patron records. In the future, I want to incorporate data from public libraries, especially [the data available from Seattle Public Libraries](https://data.seattle.gov/Community-and-Culture/Checkouts-by-Title/tmmm-ytt6/about_data).

AI Disclosure: While I tried to hand code as much of this program as I could based on some old anthropology notes (see [this repo](https://github.com/briannarimm/ml-applications-in-anthropology), if you're interested in that experiment!), I used Claude to help with debugging the clustering code, helping to create the patron data simulation code, and to refactor all of the code (mostly as a sanity check).
