---
title: "Personal OPAC Catalog"
category: project
date: 2026-10-13
description: "A working library catalog built with Apache, PHP, and MySQL. Each record uses the 15 Dublin Core elements, and administrators can add books from an ISBN with data from Open Library."
display_tag: "Library systems"
ai_assisted: false
keywords: ["OPAC", "Library catalogs", "Dublin Core", "PHP", "MySQL"]
thumbnail: /assets/items/opac/thumbnail.jpg
thumbnail_alt: "The catalog search page, with a keyword search and fields for Title, Creator, Subject, and other Dublin Core elements."
links:
  - kind: live
    label: "Open the catalog"
    url: "https://opac.briannaimm.com"
dc:
  creator: ["Brianna R. Imm"]
  subject: ["Online library catalogs", "Dublin Core", "Library information networks"]
  publisher: ["Brianna R. Imm"]
  type: ["InteractiveResource", "Software"]
  format: ["text/html"]
  identifier: ["https://opac.briannaimm.com"]
  language: ["en"]
  coverage: ["Library and information science coursework, Fall 2026"]
---

OPAC stands for Online Public Access Catalog: a website where people search the books of a library. This project shows how the parts of an OPAC work together. A web server (Apache) sends pages, a scripting language (PHP) reads each request, and a database (MySQL) stores the records.

Each record uses the 15 elements of the [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) metadata standard instead of MARC.

## Features

- Search all fields at once with one or more keywords, or search specific fields such as Creator or Subject.
- Combine keyword and field searches, and choose 10, 20, 50, or 100 results per page.
- Add, find, and edit records on password-protected administrator pages.
- Add many books at once from a list of ISBNs, confirming each one.
- Fill in metadata automatically from an ISBN with data from [Open Library](https://openlibrary.org/).
- Light and dark modes that follow the visitor's device setting.
