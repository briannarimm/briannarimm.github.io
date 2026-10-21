---
title: "Objection!"
category: project
date: 2026-10-14
description: "A courtroom party game for two teams. The teams argue made-up legal cases, and an AI model acts as the judge and writes the ruling."
display_tag: "Game · Ren'Py"
ai_assisted: true
keywords: ["Games", "Trial advocacy", "Ren'Py", "Claude API"]
thumbnail: /assets/items/objection/thumbnail.jpg
thumbnail_alt: "An illustrated courtroom with a judge's bench, flags, and wood paneling."
links:
  - kind: repository
    url: "https://github.com/briannarimm/objection-the-game"
gallery:
  - src: /assets/items/objection/courtroom.jpg
    alt: "An illustrated courtroom with a judge's bench, flags, and wood paneling."
    caption: "The courtroom"
  - src: /assets/items/objection/evidence-parrot.jpg
    alt: "Evidence card: a parrot in a cage."
    caption: "Evidence: the parrot"
  - src: /assets/items/objection/evidence-cctv.jpg
    alt: "Evidence card: a still image from a security camera."
    caption: "Evidence: security camera footage"
  - src: /assets/items/objection/evidence-diary.jpg
    alt: "Evidence card: an open diary with handwritten entries."
    caption: "Evidence: the diary"
  - src: /assets/items/objection/receipt.png
    alt: "Evidence card: a printed store receipt."
    caption: "Evidence: the receipt"
dc:
  creator: ["Brianna R. Imm"]
  contributor: ["Claude (Anthropic), AI coding assistant"]
  subject: ["Trial practice -- Games", "Party games", "Artificial intelligence -- Games"]
  publisher: ["Brianna R. Imm"]
  type: ["Software", "InteractiveResource"]
  format: ["Ren'Py project (Windows, macOS, Linux)"]
  identifier: ["https://github.com/briannarimm/objection-the-game"]
  language: ["en"]
  rights: ["MIT License. See the repository LICENSE file."]
---

Objection! is a courtroom party game for two teams. Players argue made-up legal cases in front of a judge. An AI model (Claude) acts as the judge and writes the final ruling.

## How a round works

Two teams, the Plaintiff and the Defendant, play a series of rounds. Each round is a new case, and the first team to win three rounds wins. In each round, the teams:

1. Read the case.
2. Choose jurors.
3. Argue motions against a timer.
4. Examine evidence.
5. Answer a legal trivia question.
6. Write a closing argument.

The AI judge reads the arguments and the round details, then writes a ruling in the style of a court opinion and names a winner.

No legal knowledge is necessary. The game is for entertainment and does not give legal advice.

## Requirements

The game is built with [Ren'Py](https://www.renpy.org/), a free visual-novel engine, and runs on Windows, macOS, and Linux. The AI judge needs an Anthropic API key. The repository README describes the setup.

## How it was made

This project was built with Claude Code, an AI coding assistant, with limited line-by-line review. The code has not been fully tested or audited.
