# Brianna Imm: personal website

This repository contains the source files of the personal website of Brianna Imm. The website is at <https://www.briannaimm.com>.

The website has a home page and a collection of papers and projects. The home page shows who Brianna is and what work she has done. The collection has one page for each paper or project, with Dublin Core metadata.

## Contents

- [Description](#description)
- [Files](#files)
- [Requirements](#requirements)
- [View the website on your computer](#view-the-website-on-your-computer)
- [Change the content](#change-the-content)
- [Papers and projects](#papers-and-projects)
- [Publish the website](#publish-the-website)
- [Set up the domain name](#set-up-the-domain-name)
- [Design](#design)
- [License](#license)

## Description

The website has four sections:

1. **About.** A short introduction and a list of research tools.
2. **Experience.** Work history and education.
3. **Papers & Projects.** The six newest items that are set to show on the home page, with filters and a link to the full collection.
4. **Elsewhere.** Links to GitHub, LinkedIn, SSRN, and email.

The website uses [Jekyll](https://jekyllrb.com/), which GitHub Pages runs automatically. Jekyll makes one page for each file in the `_items/` folder and adds each item to the lists. The pages use plain HTML, CSS, and JavaScript.

The website has these features:

- A background with slow, moving light.
- Sections that fade in when you scroll.
- A portrait that moves a little when you move the mouse.
- Cards that tilt toward the mouse pointer.
- Filters and a search box for the collection.
- An image carousel on item pages.
- A layout that fits both phones and large screens.

The website turns off all motion for users who set their system to reduce motion.

## Files

| File or folder | Purpose |
| --- | --- |
| `index.html` | The home page content. |
| `items/index.html` | The page that lists the full collection. |
| `items.json` | A machine-readable list of all items with their Dublin Core fields. |
| `_items/` | One Markdown file for each paper or project. |
| `assets/items/` | The images and files of each item, in one folder per item. |
| `_layouts/` | The page templates: `default.html` for all pages and `item.html` for item pages. |
| `_includes/` | Shared parts of pages, such as the header, the item card, and the link buttons. |
| `_data/dublin_core.yml` | The 15 Dublin Core elements, in display order. |
| `_config.yml` | The Jekyll settings. |
| `editor/` | The Collection Editor application. Jekyll does not publish this folder. |
| `style.css` | The colors, fonts, layout, and animations. |
| `script.js` | The scroll effects, the mouse effects, the filters, the carousel, and the rotating words. |
| `images/` | The portrait photo in three sizes. |
| `CNAME` | The custom domain name for GitHub Pages. |
| `DESIGN.md` | The design rules. Use this file to build other pages in the same style. |
| `LICENSE` | The license for the code, and a list of what each license covers. |
| `LICENSE-CC-BY-4.0` | The full text of the Creative Commons license for the documentation. |
| `.gitignore` | A list of files that Git must not track. |

## Requirements

To view the website, you need a current web browser.

To view the website on your computer, you also need Ruby 3 or later and Jekyll 3.10, the version that GitHub Pages uses.

To publish the website, you need a GitHub account.

## View the website on your computer

1. Install Ruby with Homebrew, if necessary:

   ```bash
   brew install ruby
   ```

2. Install Jekyll and its helpers:

   ```bash
   /opt/homebrew/opt/ruby/bin/gem install jekyll:3.10.0 kramdown-parser-gfm logger base64 csv bigdecimal webrick
   ```

3. Open a terminal in the repository folder.
4. Start Jekyll:

   ```bash
   RUBYOPT="-rlogger -rbase64 -rcsv -rbigdecimal" /opt/homebrew/lib/ruby/gems/4.0.0/bin/jekyll serve
   ```

5. Open <http://localhost:4000> in a web browser.
6. To stop the server, press `Control+C` in the terminal.

> **Note:** A plain web server, such as `python3 -m http.server`, does not run Jekyll. The pages then show template code instead of content.

## Change the content

The text of the home page is in `index.html`. Find the text that you want to change and edit it.

To add or change a paper or project, read [Papers and projects](#papers-and-projects).

To change the words that rotate in the first section, edit the `words` list in `script.js`.

To change the colors or the fonts, edit the values at the top of `style.css`. Read `DESIGN.md` first.

To replace the portrait:

1. Make a square or near-square photo.
2. Save three copies in the `images/` folder. Use the names `headshot-480.jpg`, `headshot-800.jpg`, and `headshot-1200.jpg`. The numbers are the widths in pixels.
3. Change the `alt` text of the image in `index.html` to describe the new photo.

> **Caution:** Do not put private data on the page. Private data includes phone numbers, home addresses, and the names of clients.

## Papers and projects

Each paper or project is one Markdown file in `_items/`. The file name is the slug: `_items/reword.md` becomes the page `/items/reword/`. The images and files of the item go in `assets/items/<slug>/`.

When a new file arrives on the `main` branch, GitHub Pages builds the website again. The new item then shows on the home page, on the collection page, and in `items.json`. You do not have to change any other file.

### Use the Collection Editor

The easiest way to add or change an item is the Collection Editor. It shows a live preview and publishes the item with one button. Read [editor/README.md](editor/README.md).

### Write an item by hand

1. Copy an existing file in `_items/`, for example `_items/opac.md`.
2. Rename the copy. Use lowercase letters, numbers, and hyphens.
3. Change the front matter (the part between the two `---` lines). The table below describes each field.
4. Write the page text in Markdown below the front matter.
5. Put the images and files in `assets/items/<slug>/`.
6. Commit and push the changes.

| Field | Required | Description |
| --- | --- | --- |
| `title` | Yes | The title of the item. |
| `category` | Yes | `paper` or `project`. |
| `visibility` | No | `home` (the default): on the home page and in the collection. `collection`: in the collection only. `archive`: not on the website. An archived item also needs `published: false`. |
| `date` | Yes | A date in the form `YYYY-MM-DD`. The lists show the newest item first. |
| `description` | Yes | One or two sentences for the card and the top of the page. |
| `display_tag` | No | A short label above the title, for example `"Desktop app · Legal writing"`. |
| `ai_assisted` | No | `true` shows the AI-assisted badge. |
| `keywords` | No | A list of tags. |
| `thumbnail` | No | The card image, for example `/assets/items/reword/thumbnail.jpg`. |
| `thumbnail_alt` | No | A description of the thumbnail. |
| `links` | No | A list of links. Each link has a `kind`, a `url`, and an optional `label`. The first link is the main button. Kinds: `live`, `play`, `download`, `preview`, `pdf`, `ssrn`, `doi`, `repository`, `other`. |
| `gallery` | No | A list of carousel images. Each image has a `src`, an `alt`, and an optional `caption`. |
| `attachments` | No | A list of files. Each file has a `label`, a `file`, and an optional `note`. |
| `dc` | No | The Dublin Core elements other than title, description, and date: `creator`, `contributor`, `subject`, `publisher`, `date` (to show a different date), `type`, `format`, `identifier`, `source`, `language`, `relation`, `coverage`, and `rights`. Each value is a list. |

> **Note:** A `preview` link to a PDF also shows the PDF on the item page.

## Publish the website

GitHub Pages builds and publishes the website from the `main` branch. You do not have to build the website yourself.

1. Save your changes.
2. Commit the changes:

   ```bash
   git add .
   git commit -m "Describe your change"
   ```

3. Send the changes to GitHub:

   ```bash
   git push
   ```

4. Wait one to two minutes. GitHub Pages then updates the website.

If the push fails because GitHub has newer commits, run `git pull --rebase`. Then run `git push` again.

## Set up the domain name

The file `CNAME` holds the custom domain name. GitHub Pages reads this file.

To use a different domain name:

1. Change the text in `CNAME` to the new domain name. The file must contain only the domain name.
2. In the settings of the repository, open **Pages**. Set the same domain name in the **Custom domain** field.
3. At your domain registrar, add a `CNAME` record. For a `www` name, set the value to `briannarimm.github.io`.
4. After the domain name resolves, turn on **Enforce HTTPS** in the Pages settings.

> **Note:** DNS changes can take some time to take effect.

## Design

`DESIGN.md` describes the colors, fonts, spacing, components, and motion rules of this website. Use it as a guide when you build other pages in the same style.

## License

This repository uses more than one license.

| Material | License |
| --- | --- |
| Source code: templates, styles, scripts, and the Collection Editor | [MIT License](LICENSE) |
| Documentation (`README.md`, `DESIGN.md`) | [Creative Commons Attribution 4.0 International](LICENSE-CC-BY-4.0) |
| Photographs, personal text, item text and images, and the name and likeness of Brianna Imm | All rights reserved, unless the Rights field of an item says otherwise |

Read the file `LICENSE` for the complete list of what each license covers.

## Contact

Send an email to <briannarimm@gmail.com>. You can also find Brianna on [GitHub](https://github.com/briannarimm) and [LinkedIn](https://www.linkedin.com/in/briannarimm/).
