# Move www.briannaimm.com to Cloudflare Workers

This guide moves the website and three projects from GitHub Pages to Cloudflare Workers. Do the steps in order. Nothing changes for visitors until step 5, and step 5 can be undone in a minute.

## What is ready

Each repository has a `wrangler.jsonc` file and a `cloudflare/build.sh` script on the branch `claude/equation-editor-webapp-6606j4`. The builds were tested with the same tools that Cloudflare uses.

| Worker name | Repository | Address after the move | What the build does |
| --- | --- | --- | --- |
| `briannaimm-site` | `briannarimm.github.io` | `www.briannaimm.com/` | Builds the site with Jekyll. |
| `ml-applications-in-anthropology` | `ml-applications-in-anthropology` | `/ml-applications-in-anthropology/` | Copies the files that GitHub Pages serves today. |
| `ai-pix-explorer` | `ai-pix-explorer` | `/ai-pix-explorer/` | Runs `tools/build.py` and publishes the game. |
| `codepix` | `CodePix` | `/CodePix/` | Installs NumPy, pandas, scikit-learn and Matplotlib, then runs `tools/build.py`. About 2 minutes. |

How the addresses work: each project Worker gets a route for its own path, such as `www.briannaimm.com/CodePix*`. The website Worker gets `www.briannaimm.com/*`. When two routes match, Cloudflare uses the more specific one, so `/CodePix/` goes to the CodePix Worker and everything else goes to the website Worker.

> **Note:** `CodePix` and `ai-pix-explorer` are private repositories. GitHub Pages does not publish private repositories on the free plan, so these two projects are not online today. After step 5 they are online, and their code stays private.

## Step 1. Merge the Cloudflare files into `main`

Do this in each of the four repositories. Open the repository on GitHub, select **Compare & pull request** for the branch `claude/equation-editor-webapp-6606j4`, and merge it.

This is safe for GitHub Pages:

* **Website:** `_config.yml` excludes `cloudflare/` and `wrangler.jsonc`, so Jekyll does not publish them. Nothing else changes.
* **ml-applications-in-anthropology:** GitHub Pages also publishes the two new files. They contain no private data.
* **CodePix and ai-pix-explorer:** the GitHub Actions workflows do not read the new files.

## Step 2. Create the four Workers

Do these steps four times, once for each row of the table.

1. In the Cloudflare dashboard, open **Workers & Pages**.
2. Select **Create application**, then **GitHub**.
3. The first time, let Cloudflare read your GitHub account. Give it access to the four repositories, including the private ones.
4. Select the repository.
5. Set these values:
   * **Project name:** the Worker name from the table, exactly. The build fails if the name is different from `name` in `wrangler.jsonc`.
   * **Build command:** `bash cloudflare/build.sh`
   * **Deploy command:** leave the default, `npx wrangler deploy`.
   * **Root directory:** leave it empty.
   * **Production branch:** `main`.
6. For **CodePix** only: under the build variables, add `PYTHON_VERSION` with the value `3.13`. GitHub Actions uses the same version.
7. Select **Save and Deploy**, then wait for the build to finish.

> **Note:** The configuration files have no routes yet. The Workers only answer at their `workers.dev` test addresses. Your domain still comes from GitHub Pages.

## Step 3. Test each Worker on its test address

Each Worker gets an address like `https://ai-pix-explorer.<your-subdomain>.workers.dev`. The dashboard shows it. Project Workers answer at their own path on that address:

* `https://briannaimm-site.<your-subdomain>.workers.dev/`
* `https://ml-applications-in-anthropology.<your-subdomain>.workers.dev/ml-applications-in-anthropology/`
* `https://ai-pix-explorer.<your-subdomain>.workers.dev/ai-pix-explorer/`
* `https://codepix.<your-subdomain>.workers.dev/CodePix/`

Check the home page, one project page, the Equation Workbench, and each project. On the test addresses, links between the website and the projects go to the live domain. That is correct.

## Step 4. Check the DNS

Your DNS is already ready. The `www` record goes through Cloudflare (orange cloud), and Cloudflare routes need that.

1. Open **briannaimm.com → DNS → Records**.
2. Make sure the `www` record shows **Proxied** (orange cloud). Do not change its target. It points to GitHub Pages, and that is the fallback.

## Step 5. Move the domain (migration day)

Add the routes. Do the three projects first and the website last, so the projects never show the website's error page.

For each repository, open `wrangler.jsonc` and remove the two `//` characters at the start of the `"routes"` line, so it reads like this:

```jsonc
"routes": [{ "pattern": "www.briannaimm.com/CodePix*", "zone_name": "briannaimm.com" }],
```

Commit the change to `main`. Cloudflare builds the Worker again and adds the route. The build log may show the warning "The following routes will attempt to serve Assets on a configured path". That is expected: the `base_path` setting maps the path, as Cloudflare documents for serving a subdirectory. Keep the routes in the file, so the file stays the record of what each Worker serves.

Then check the live addresses:

* `https://www.briannaimm.com/`
* `https://www.briannaimm.com/equation-workbench/`
* `https://www.briannaimm.com/ml-applications-in-anthropology/`
* `https://www.briannaimm.com/ai-pix-explorer/`
* `https://www.briannaimm.com/CodePix/`

To confirm that Cloudflare serves a page, open the browser's developer tools, select **Network**, and reload. A response from GitHub has `x-github-request-id` in its headers. A response from a Worker does not.

### Undo

For the fastest undo, delete the route in the Worker's **Settings → Domains & Routes**. Visitors go back to GitHub Pages at once, because the DNS still points there. Then put the `//` back at the start of the `"routes"` line and commit, so the next deploy does not add the route again.

## Step 6. After a week with no problems

These steps are optional.

* **Turn off the test addresses.** In each Worker, open **Settings → Domains & Routes** and turn off `workers.dev`. Then the projects are only at your domain.
* **Add a redirect for the bare domain before you turn off GitHub Pages.** Today GitHub sends `briannaimm.com` to `www.briannaimm.com`. If you turn off GitHub Pages, add a rule first: open **briannaimm.com → Rules → Redirect Rules**, and create a rule for requests whose hostname is `briannaimm.com`. Set the target to `https://www.briannaimm.com` with the same path, as a `301` redirect.
* **Turn off GitHub Pages** in each repository's **Settings → Pages**. Only do this after the redirect rule works, and remember that the undo above needs GitHub Pages.

## Day-to-day after the move

* **Publish a change:** push to `main`, as now. Cloudflare builds and deploys the Worker. Each Worker's **Deployments** tab shows the builds.
* **Previews:** a push to any other branch makes a preview build with its own link. In CodePix, a branch other than `main` builds the release candidate (the `rc` channel, saved under `codepix-save-rc`).
* **CodePix checks:** GitHub Actions still runs the CodePix checks. Cloudflare only builds.
* **Build tools:** the Workers use the newest Wrangler. The `base_path` setting needs Wrangler 4.148 or later. Wrangler 4.158 was the newest when this guide was written.
