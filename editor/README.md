# Collection Editor

The Collection Editor is a small application on your Mac. You use it to add and change the items in the **Papers & Projects** collection of the website. One button saves the item and publishes it.

## Contents

- [What the editor does](#what-the-editor-does)
- [Requirements](#requirements)
- [Start the editor](#start-the-editor)
- [Add an item](#add-an-item)
- [Change an item](#change-an-item)
- [Publish](#publish)
- [Fields](#fields)
- [Stop the editor](#stop-the-editor)
- [Troubleshooting](#troubleshooting)
- [How it works](#how-it-works)

## What the editor does

- It shows a form for one item: a paper or a project.
- It shows a live preview of the item page, the card, and the Markdown file while you type.
- It resizes images before upload.
- It signs in to GitHub automatically with the GitHub CLI.
- It sends the item file and all of its images and files to GitHub in one commit.
- It controls where each item shows: on the home page and in the collection, in the collection only, or nowhere (Archive).
- It keeps a draft of unsaved work in the window, so a closed window or a stopped server does not lose your text.

## Requirements

- A Mac with the Python 3 that macOS supplies (`/usr/bin/python3`).
- The GitHub CLI, signed in to the account that owns the website repository. To check, run:

  ```bash
  gh auth status
  ```

- An internet connection.

## Start the editor

Use one of these methods:

- Open **Collection Editor** in your Applications folder (`~/Applications`).
- Double-click `Collection Editor.command` in this folder.
- In a terminal, run:

  ```bash
  python3 editor/server.py --open
  ```

The editor opens in its own window. If Google Chrome, Microsoft Edge, or Brave is installed, the window has no browser toolbar. Otherwise, the editor opens in your default browser.

> **Note:** If you move the repository folder, run `editor/make-app.sh` again to update the application.

## Add an item

1. Click **New**.
2. Select **Project** or **Paper**, and select the visibility. For a paper, the editor sets the main link type to SSRN and the Dublin Core type to Text.
3. Enter the title. The editor makes the slug (the web address) from the title. You can change the slug before the first publish.
4. Enter the date and a short description.
5. Add the links. The first link is the main button on the item page.
6. Optional: add a thumbnail, gallery images, and files.
7. Write the page text in Markdown.
8. Fill in the Dublin Core fields.
9. Click **Save & publish**.

## Change an item

1. Select the item in the list at the top left.
2. Change the fields.
3. Click **Save & publish**.

> **Note:** You cannot change the slug of a published item. The slug is part of the web address, and other sites can link to it.

## Publish

When you click **Save & publish**, the editor:

1. Prepares the item file and the new images and files.
2. Commits everything to the `main` branch of the repository in one commit.
3. Shows **Sent to GitHub**, a link to the commit, and a button that opens the item page.

GitHub Pages then rebuilds the website. Your changes are live in a few minutes. You do not have to keep the editor open while the website rebuilds.

If you removed an image or a file from an item, the editor also deletes it from the repository.

> **Caution:** Publishing makes the item public at once. Check the preview before you click **Save & publish**.

## Fields

| Field | Use |
| --- | --- |
| Category | Paper or Project. Controls the filters on the website. |
| Visibility | **Home + collection**: on the home page and in the full collection. **Collection only**: in the full collection, not on the home page. **Archive**: not on the website at all. The file stays in the repository, so you can change it back later. |
| Title, Slug, Date | Required. The date sets the order: newest first. |
| Short description | Required. Shows on the card and at the top of the item page. |
| Card label | A short type label, for example "Browser game · AI literacy". |
| Tags | Keywords, separated by commas. Used by the search on the website. |
| AI-assisted | Shows the AI-assisted badge. |
| Links | Each link has a type: live website, play, download, preview, PDF, SSRN, DOI, repository, or other. A link can point to a web address or to an attached file. A **Preview** link to a PDF also shows the PDF on the item page. |
| Thumbnail | The image on cards and in link previews. A 16:10 image works best. |
| Gallery | The images in the carousel on the item page. Each image needs alt text. |
| Files | Downloads, for example the PDF of a paper. Keep each file under 50 MB. |
| Page text | Markdown. |
| Dublin Core | The 15 Dublin Core elements. Title, Description, and Date come from the fields above. Put each value on its own line. |

## Stop the editor

Click the **✕** button at the top right. Then close the window.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| "The GitHub CLI is not signed in" | Run `gh auth login` in a terminal. Then restart the editor. |
| "The GitHub CLI (gh) is not installed" | Run `brew install gh`, then `gh auth login`. |
| The window does not open | Open <http://127.0.0.1:8790> in a browser. |
| A red banner says the server stopped | Open **Collection Editor** again. The window reconnects. Your text is kept as a draft. |
| A banner offers an unsaved draft | Click **Restore** to continue the draft, or **Discard** to delete it. New images and files in a draft must be added again. |
| "A permanent link instead of a temporary download link" | The link is a signed download link that stops working after a few minutes. Attach the PDF under **Files** and link to the attached file instead. |
| The changes are not live after 10 minutes | The commit is saved, but the build possibly failed. The website then shows the previous version. Open the repository on GitHub, then **Settings > Pages**, and read the build status. |
| "An item with the slug ... already exists" | Choose another slug, or select the existing item in the list to change it. |

## How it works

- `server.py` is a local web server. It uses only the Python standard library. It listens on `127.0.0.1:8790` only, and it accepts requests only from the editor page.
- The server gets a GitHub token from `gh auth token`. The token stays in the server and never goes to the browser.
- The server writes only to `_items/` and `assets/items/` in the repository.
- `static/preview.js` copies the HTML of the site templates (`_layouts/item.html`, `_includes/item-card.html`, and `_includes/link-button.html`). If you change those templates, change `preview.js` too.
- Jekyll does not publish this folder. `_config.yml` excludes it.
