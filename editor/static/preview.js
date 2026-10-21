// Live preview. These functions produce the same HTML as the site's Jekyll
// templates (_layouts/item.html, _includes/item-card.html, and
// _includes/link-button.html). If you change those templates, change these too.

const LINK_KINDS = {
  live: { label: "Visit site", icon: "arrow-up-right", name: "Live website" },
  play: { label: "Play", icon: "play", name: "Play (game or app)" },
  download: { label: "Download", icon: "download", name: "Download" },
  preview: { label: "Preview", icon: "eye", name: "Preview (PDFs show inline)" },
  pdf: { label: "PDF", icon: "doc", name: "PDF" },
  ssrn: { label: "Read on SSRN", icon: "doc", name: "SSRN" },
  doi: { label: "DOI", icon: "arrow-up-right", name: "DOI" },
  repository: { label: "Repository", icon: "code", name: "Code repository" },
  other: { label: "Link", icon: "arrow-up-right", name: "Other link" },
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ico = (id) => `<svg class="ico" aria-hidden="true"><use href="#${id}"/></svg>`;

function linkButton(l, cls, resolve) {
  const k = LINK_KINDS[l.kind] || LINK_KINDS.other;
  const local = (l.url || "").startsWith("/");
  const href = local ? resolve(l.url) : l.url;
  const dl = l.kind === "download" && local ? " download" : "";
  return `<a class="${cls}" href="${esc(href)}"${dl} target="_blank">${esc(l.label || k.label)} ${ico(k.icon)}</a>`;
}

function catLabels(item) {
  return item.category === "paper" ? ["Paper", "Papers"] : ["Project", "Projects"];
}

function renderCard(item, resolve) {
  const [cat] = catLabels(item);
  const media = item.thumbnail
    ? `<img src="${esc(resolve(item.thumbnail))}" alt="">`
    : `<span class="ph"><span>${esc((item.title || "?").slice(0, 1))}</span></span>`;
  const links = (item.links || []).map((l) => linkButton(l, "plink", resolve)).join("");
  return `<article class="card tilt in" data-category="${esc(item.category)}">
  <a class="card-media" href="#" tabindex="-1" aria-hidden="true">${media}<span class="media-chip">${cat}</span></a>
  <div class="card-top"><span class="tag">${esc(item.display_tag || cat)}</span>${item.ai_assisted ? '<span class="badge">AI-assisted</span>' : ""}</div>
  <h3><a class="card-title" href="#">${esc(item.title || "Untitled")}</a></h3>
  <p>${esc(item.description)}</p>
  <div class="card-links"><a class="plink primary" href="#">View item ${ico("arrow-right")}</a>${links}</div>
</article>`;
}

function dcValues(v) {
  if (v === undefined || v === null || v === "") return [];
  return (Array.isArray(v) ? v : [v]).map(String).filter((x) => x.trim() !== "");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return isNaN(d) ? iso : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function renderItem(item, resolve, ctx) {
  const [cat, catPlural] = catLabels(item);
  const links = item.links || [];
  const actions = links.length
    ? `<div class="item-actions">${links.map((l, i) => linkButton(l, i === 0 ? "btn primary" : "btn", resolve)).join("")}</div>`
    : "";

  let media = "";
  const gallery = item.gallery || [];
  if (gallery.length) {
    const slides = gallery.map((g, i) => `<figure class="slide"><img src="${esc(resolve(g.src))}" alt="${esc(g.alt)}">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}</figure>`).join("");
    const nav = gallery.length > 1
      ? `<button class="cbtn prev" type="button" aria-label="Previous image">${ico("chev-left")}</button><button class="cbtn next" type="button" aria-label="Next image">${ico("chev-right")}</button><div class="dots" aria-hidden="true"></div>`
      : "";
    media = `<div class="carousel" data-carousel><div class="carousel-track" tabindex="0">${slides}</div>${nav}</div>`;
  } else if (item.thumbnail) {
    media = `<figure class="item-figure"><img src="${esc(resolve(item.thumbnail))}" alt="${esc(item.thumbnail_alt || item.title)}"></figure>`;
  }

  let pdf = "";
  const pv = links.find((l) => l.kind === "preview" && /\.pdf/i.test(l.url || "") );
  if (pv) {
    const src = (pv.url || "").startsWith("/") ? resolve(pv.url) : pv.url;
    pdf = `<div class="pdf-embed"><object data="${esc(src)}" type="application/pdf"><p>Your browser cannot show this PDF here.</p></object></div>`;
  }

  const files = (item.attachments || []).length
    ? `<section class="side-block"><h2 class="side-h">Files</h2><ul class="files">${item.attachments.map((f) => `<li><a href="${esc(resolve(f.file))}" target="_blank">${ico("download")}<span><b>${esc(f.label || f.file.split("/").pop())}</b>${f.note ? `<small>${esc(f.note)}</small>` : ""}</span></a></li>`).join("")}</ul></section>`
    : "";
  const tags = (item.keywords || []).length
    ? `<section class="side-block"><h2 class="side-h">Tags</h2><ul class="chips">${item.keywords.map((k) => `<li>${esc(k)}</li>`).join("")}</ul></section>`
    : "";

  const dcRows = (ctx.dublinCore || []).map((el) => {
    let vals = el.from === "top" ? dcValues(item[el.key]) : dcValues((item.dc || {})[el.key]);
    if (el.key === "date" && !vals.length) vals = [formatDate(item.date)];
    if (!vals.length) return "";
    const dd = vals.map((v) => `<span>${v.includes("://") ? `<a href="${esc(v)}" target="_blank">${esc(v)}</a>` : esc(v)}</span>`).join("");
    return `<div class="dc-row"><dt>${esc(el.label)}</dt><dd>${dd}</dd></div>`;
  }).join("");

  const creators = dcValues((item.dc || {}).creator).join(", ") || "Brianna R. Imm";
  const accessed = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const url = `${ctx.site}/items/${item.slug || "your-slug"}/`;
  const body = window.marked ? window.marked.parse(item.body || "") : esc(item.body);

  return `<article class="item-page">
  <nav class="crumbs"><a href="#">${ico("arrow-left")} Papers &amp; Projects</a><span>/</span><a href="#">${catPlural}</a></nav>
  <header class="item-head">
    <div class="card-top"><span class="tag">${cat}${item.display_tag ? ` &middot; ${esc(item.display_tag)}` : ""}</span>${item.ai_assisted ? '<span class="badge">AI-assisted</span>' : ""}</div>
    <h1 class="item-title">${esc(item.title || "Untitled")}</h1>
    <p class="lead">${esc(item.description)}</p>
    ${actions}
  </header>
  ${media}
  ${pdf}
  <div class="item-body">
    <div class="prose">${body}</div>
    <aside class="item-side">${files}${tags}<section class="side-block"><h2 class="side-h">Collection</h2><p class="side-p"><a href="#">${catPlural}</a> in Papers &amp; Projects</p></section></aside>
  </div>
  <section class="dc"><h2><span class="num">DC</span> Dublin Core</h2><dl class="dc-table">${dcRows}</dl></section>
  <section class="cite"><h2 class="side-h">Citation</h2><p class="cite-text">${esc(creators)}, &ldquo;${esc(item.title)},&rdquo; <em>Papers &amp; Projects</em>, Brianna Imm, accessed ${accessed}, ${esc(url)}.</p></section>
</article>`;
}

function previewDocument(inner, ctx, mode) {
  const main = mode === "card"
    ? `<section style="padding:3rem 0"><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(18rem,22rem))">${inner}</div></section>`
    : inner;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/site/style.css">
<style>.reveal,.js .reveal{opacity:1!important;transform:none!important;transition:none!important}.spotlight{display:none}</style>
</head><body>
${ctx.sprite}
${ctx.background}
<header class="site-header"><a class="brand" href="#">bri<span>.</span></a><nav><a href="#">About</a><a href="#">Experience</a><a href="#">Work</a><a href="#">Elsewhere</a></nav></header>
<main id="top">${main}</main>
<footer><p>&copy; ${new Date().getFullYear()} Brianna R. Imm &middot; Not legal advice.</p></footer>
<script src="/site/script.js"></script>
</body></html>`;
}
