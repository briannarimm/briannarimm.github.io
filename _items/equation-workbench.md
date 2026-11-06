---
title: "Equation Workbench"
category: project
visibility: home
date: 2026-11-06
description: "A web tool for building equations and checking symbolic logic. Drag symbols in or type them, then copy the result as LaTeX, plain text, a Word equation, or an image."
display_tag: "Web app · Math and logic"
ai_assisted: true
keywords: ["LaTeX", "Symbolic logic", "Deontic logic", "Legal reasoning", "MathML", "Web app"]
links:
  - kind: live
    label: "Open the workbench"
    url: "https://www.briannaimm.com/equation-workbench/"
dc:
  creator: ["Brianna R. Imm"]
  subject: ["Mathematical notation", "Logic, Symbolic and mathematical", "Deontic logic", "Law -- Methodology"]
  publisher: ["Brianna R. Imm"]
  date: ["2026"]
  type: ["InteractiveResource", "Software"]
  format: ["text/html"]
  identifier: ["https://www.briannaimm.com/equation-workbench/"]
  language: ["en"]
  rights: ["MIT License. Typesetting by MathJax (Apache License 2.0)."]
---

**Open it:** <https://www.briannaimm.com/equation-workbench/>

I wanted one place to write an equation once and paste it anywhere: Overleaf, Word, Google Docs, a slide, or a chat message. I also wanted to check the logic in legal arguments without a textbook open beside me.

## Build an equation

* Drag a symbol from the palette into the editor, or click in the editor and type. `/` makes a fraction, `^` a power, and `\alpha` any LaTeX command.
* Copy the result as LaTeX, as plain text with Unicode symbols, as MathML (desktop Word turns it into an editable equation), or as an image.
* Paste existing LaTeX to edit it, and save equations in your browser.

## Check the logic

The logic panel reads the formula in the editor. It handles sentence letters, predicates, quantifiers (∀, ∃), identity, and the duty operators O (obligatory), P (permitted), and F (forbidden).

* **Truth tables** for any formula without quantifiers.
* **Arguments:** says whether the conclusion follows. If it does not, it shows a counterexample and names the fallacy, such as affirming the consequent.
* **Equivalence:** checks whether two formulas say the same thing.
* **Rewrite:** converts a formula step by step with named laws, such as De Morgan's law and transposition.
* **Legend:** say what each letter means, and every formula is read back in plain English.

The examples include a hearsay rule, a liability fallacy, a duty triggered by a fact, and conflicting duties. You can switch between modern notation (¬ ∧ → ∀x) and the textbook notation of Copi and Hurley (~ · ⊃ (x)).

The results are a study aid, not legal advice. Nothing you type leaves your browser.

**AI disclosure:** I designed the tool and made the design choices. Claude wrote the code and tested it.
