---
title: "ML Applications in Anthropology"
category: project
visibility: home
date: 2021-01-01
description: "Two Python projects that map and cluster cross-cultural data from the Standard Cross-Cultural Sample: the main domesticated animal of 118 societies, and a K-Modes clustering of 141 societies into three groups."
display_tag: "Data · Maps"
ai_assisted: true
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
  type: ["InteractiveResource", "Dataset", "Software"]
  format: ["text/html"]
  identifier: ["https://www.briannaimm.com/ml-applications-in-anthropology/"]
  source: ["D-PLACE (Database of Places, Language, Culture and Environment)", "Standard Cross-Cultural Sample (SCCS)"]
  language: ["en"]
  relation: ["https://github.com/briannarimm/ml-applications-in-anthropology", "https://library.briannaimm.com/omeka/items/show/1"]
  coverage: ["Anthropology", "Machine learning"]
  rights: ["MIT License. Photos from Pixabay; see CREDITS.md in the repository."]
---

**Online showcase:** <https://www.briannaimm.com/ml-applications-in-anthropology/>

This repository has two small Python projects. Both projects look for patterns in anthropology data. Each project makes an interactive map that you open in a web browser.

* **Domesticated animals map.** The map shows the main farm animal of 118 societies.
* **Clustering demo.** A machine learning method puts 141 societies into 3 groups. The groups are shown on a map and in charts.

You do not need to know machine learning or anthropology to use this repository.

**Disclosures:** I wrote all of this code back in 2021. I used Claude to help fix the little things that broke since 2021 and to migrate the experiment to a page on my website. Also, while the folder [clustering-demo/published](clustering-demo/published) keeps the charts and the map from the 2021 analysis, that analysis used a different random start, so the cluster sizes are a little different. The main pattern, however, remains across old and new.
