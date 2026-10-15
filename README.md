# Brianna Imm: personal website

This repository contains the source files of the personal website of Brianna Imm. The website is at <https://www.briannaimm.com>.

The website is a single web page. It shows who Brianna is, what work she has done, and where to find her projects.

## Contents

- [Description](#description)
- [Files](#files)
- [Requirements](#requirements)
- [View the website on your computer](#view-the-website-on-your-computer)
- [Change the content](#change-the-content)
- [Publish the website](#publish-the-website)
- [Set up the domain name](#set-up-the-domain-name)
- [Design](#design)
- [License](#license)

## Description

The website has four sections:

1. **About.** A short introduction and a list of research tools.
2. **Experience.** Work history and education.
3. **Projects.** Short descriptions of six projects, with links to each app and repository.
4. **Elsewhere.** Links to GitHub and email.

The website does not use a framework or a build tool. It uses plain HTML, CSS, and JavaScript. A web browser can open the files directly.

The website has these features:

- A background with slow, moving light.
- Sections that fade in when you scroll.
- A portrait that moves a little when you move the mouse.
- Cards that tilt toward the mouse pointer.
- A layout that fits both phones and large screens.

The website turns off all motion for users who set their system to reduce motion.

## Files

| File or folder | Purpose |
| --- | --- |
| `index.html` | The page content and structure. |
| `style.css` | The colors, fonts, layout, and animations. |
| `script.js` | The scroll effects, the mouse effects, and the rotating words. |
| `images/` | The portrait photo in three sizes. |
| `CNAME` | The custom domain name for GitHub Pages. |
| `DESIGN.md` | The design rules. Use this file to build other pages in the same style. |
| `LICENSE` | The license for the code, and a list of what each license covers. |
| `LICENSE-CC-BY-4.0` | The full text of the Creative Commons license for the documentation. |
| `.gitignore` | A list of files that Git must not track. |

## Requirements

To view the website, you need a current web browser.

To view the website on your computer with the steps below, you also need Python 3. You can use any other local web server instead.

To publish the website, you need a GitHub account.

## View the website on your computer

1. Open a terminal.
2. Go to the folder that contains `index.html`.
3. Start a local web server:

   ```bash
   python3 -m http.server 8000
   ```

4. Open <http://localhost:8000> in a web browser.
5. To stop the server, press `Control+C` in the terminal.

> **Note:** Do not open `index.html` with a double-click. Some browsers then do not load the fonts and the images correctly.

## Change the content

All of the text is in `index.html`. Find the text that you want to change and edit it.

To add a project card:

1. Open `index.html`.
2. Find the `<div class="grid">` element in the Projects section.
3. Copy one `<a class="card tilt reveal">` block.
4. Paste the block before the `<div class="card soon reveal">` block.
5. Change the tag, the title, the description, and the link.
6. Save the file and refresh the browser.

To change the words that rotate in the first section, edit the `words` list in `script.js`.

To change the colors or the fonts, edit the values at the top of `style.css`. Read `DESIGN.md` first.

To replace the portrait:

1. Make a square or near-square photo.
2. Save three copies in the `images/` folder. Use the names `headshot-480.jpg`, `headshot-800.jpg`, and `headshot-1200.jpg`. The numbers are the widths in pixels.
3. Change the `alt` text of the image in `index.html` to describe the new photo.

> **Caution:** Do not put private data on the page. Private data includes phone numbers, home addresses, and the names of clients.

## Publish the website

GitHub Pages publishes the website from the `main` branch. No build step is necessary.

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
| Source code (`index.html`, `style.css`, `script.js`) | [MIT License](LICENSE) |
| Documentation (`README.md`, `DESIGN.md`) | [Creative Commons Attribution 4.0 International](LICENSE-CC-BY-4.0) |
| Photographs, personal text, and the name and likeness of Brianna Imm | All rights reserved |

Read the file `LICENSE` for the complete list of what each license covers.

## Contact

Send an email to <briannarimm@gmail.com>. You can also find Brianna on [GitHub](https://github.com/briannarimm).
