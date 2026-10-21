---
title: "ReWord"
category: project
date: 2026-10-09
description: "A writing application for legal and academic documents. It combines a word-processor-style editor with formatted PDF and Word output, a citation library, and research notes. It works offline on Apple Silicon Macs."
display_tag: "Desktop app · Legal writing"
ai_assisted: true
keywords: ["Legal writing", "Bluebook", "Citation management", "Document assembly", "macOS"]
thumbnail: /assets/items/reword/thumbnail.png
thumbnail_alt: "An image showing an example document displayed in ReWord. The preview on the right shows a PDF with the title \"How Soccer Functions as a Religion in Brazil\"."
links:
  - kind: download
    label: "Download for Mac"
    url: "https://github.com/briannarimm/legal-writing-app/tree/main/distro"
  - kind: repository
    url: "https://github.com/briannarimm/legal-writing-app"
dc:
  creator: ["Brianna R. Imm"]
  contributor: ["Claude (Anthropic), AI coding assistant"]
  subject: ["Legal composition", "Citation of legal authorities", "Word processing -- Software"]
  publisher: ["Brianna R. Imm"]
  type: ["Software"]
  format: ["application/zip (macOS application, Apple Silicon)"]
  identifier: ["https://github.com/briannarimm/legal-writing-app"]
  language: ["en"]
  relation: ["https://github.com/briannarimm/legal-writing-app/tree/main/distro"]
  rights: ["Software: MIT License. Documentation: CC BY 4.0. See the repository LICENSE file."]
---

ReWord is a writing application for legal and academic documents. You write in an editor that looks like a word processor, and ReWord produces the finished PDF and Word files. It also keeps research notes and a source library in the same place.

## Features

- **Write.** A rich-text editor with italics, bold, small caps, headings, lists, block quotes, and footnotes.
- **Format.** One button produces a formatted PDF and Word file from a template.
- **Cite.** Each source is stored once in a library and formatted in Bluebook or APA 7 style.
- **Shorten citations.** A final draft uses *Id.*, short forms, and *supra* where the rules permit them.
- **Compare versions.** Save a version, then produce a redline that shows the changes as Word tracked changes and as a color PDF.

## Requirements

ReWord runs on Apple Silicon Macs (M1 or newer). It does not need an internet connection to produce documents, and it does not need other software.

## Download

The download is a ZIP file in the `distro` folder of the repository. Read the repository README before you install it.

## How it was made

This project was built with Claude Code, an AI coding assistant. Brianna Imm supplied the requirements, the legal-writing knowledge, the design decisions, and the testing. Check each citation and court rule against the official sources, and keep a separate copy of important work.
