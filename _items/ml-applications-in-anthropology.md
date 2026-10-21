---
title: "ML Applications in Anthropology"
category: project
date: 2021-01-01
description: "Two Python projects that map and cluster cross-cultural data from the Standard Cross-Cultural Sample: the main domesticated animal of 118 societies, and a K-Modes clustering of 141 societies into three groups."
display_tag: "Data · Maps"
ai_assisted: false
keywords: ["Anthropology", "Machine learning", "Python", "Clustering", "Maps"]
thumbnail: /assets/items/ml-applications-in-anthropology/thumbnail.jpg
thumbnail_alt: "Cows grazing on a green mountain pasture."
links:
  - kind: live
    label: "Explore the maps"
    url: "https://www.briannaimm.com/ml-applications-in-anthropology/"
  - kind: repository
    url: "https://github.com/briannarimm/ml-applications-in-anthropology"
gallery:
  - src: /assets/items/ml-applications-in-anthropology/project-page.jpg
    alt: "The project web page, titled ML Applications in Anthropology, with a photo of grazing cows."
    caption: "The project page"
  - src: /assets/items/ml-applications-in-anthropology/animal-map.jpg
    alt: "A world map with an animal icon for each society, and a legend of seven animal groups."
    caption: "Map of primary domesticated animals"
  - src: /assets/items/ml-applications-in-anthropology/cluster-chart.jpg
    alt: "A bar chart of the three clusters of societies."
    caption: "K-Modes clusters"
dc:
  creator: ["Brianna R. Imm"]
  subject: ["Machine learning", "Ethnology -- Statistical methods", "Cross-cultural studies"]
  publisher: ["Brianna R. Imm"]
  date: ["2021"]
  source: ["D-PLACE (Database of Places, Language, Culture and Environment)", "Standard Cross-Cultural Sample (SCCS)"]
  type: ["InteractiveResource", "Dataset", "Software"]
  format: ["text/html"]
  identifier: ["https://www.briannaimm.com/ml-applications-in-anthropology/"]
  language: ["en"]
  relation: ["https://github.com/briannarimm/ml-applications-in-anthropology", "https://library.briannaimm.com/omeka/items/show/1"]
  coverage: ["Anthropology", "Machine learning"]
  rights: ["MIT License. Photos from Pixabay; see CREDITS.md in the repository."]
---

This item contains two small Python projects. Both apply machine learning and data tools to cross-cultural data from [D-PLACE](https://d-place.org/), and each produces an interactive map.

## The data

The data describes 141 societies from the Standard Cross-Cultural Sample (SCCS). For each society it records the main domesticated animal, the role of the gods, the animals that people hunt, the main religion, and the year the data describes. Glottolog supplied coordinates for 118 of the societies.

## Project 1: Domesticated animals map

A script joins the data with pandas and draws a world map with Folium. Each society has an animal icon. Hover over an icon to see the society's name, or click it to see the focal year, the role of the gods, the animals hunted, and the religion.

## Project 2: Clustering demo

The second project groups societies that have similar animals, gods, and religion. It uses the K-Modes algorithm, which works like K-Means but on categories instead of numbers. The script plots an elbow curve for one to five groups, makes three groups, and shows them on a map and in charts.

## Credits

The cover photo of grazing cows is by Pixel-Sepp on Pixabay. The repository's `CREDITS.md` lists all sources, icon authors, and software licenses.
