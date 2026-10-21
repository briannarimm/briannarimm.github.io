/* Collection Editor: form state, Markdown output, live preview, and publish. */
const CFG = window.EDITOR_CONFIG;
const $ = (s, el = document) => el.querySelector(s);
const ctx = { site: CFG.site, sprite: "", background: "", dublinCore: [] };

const DC_FIELDS = [
  ["creator", "Creator", "One name per line"],
  ["contributor", "Contributor", "For example: Claude (Anthropic), AI coding assistant"],
  ["subject", "Subject", "Subject headings, one per line"],
  ["publisher", "Publisher", ""],
  ["date", "Date (display)", "Optional, for example 2021. Empty = the date above."],
  ["type", "Type", "DCMI type: Text, Software, InteractiveResource, Dataset..."],
  ["format", "Format", "For example: application/pdf or text/html"],
  ["identifier", "Identifier", "URL, DOI, or SSRN ID"],
  ["source", "Source", ""],
  ["language", "Language", "en"],
  ["relation", "Relation", "Related URLs, one per line"],
  ["coverage", "Coverage", ""],
  ["rights", "Rights", "For example: CC BY 4.0"],
];
const DCMI_TYPES = ["Collection", "Dataset", "Event", "Image", "InteractiveResource", "MovingImage", "PhysicalObject", "Service", "Software", "Sound", "StillImage", "Text"];

let state;
let savedMarkdown = "";
let uid = 0;
const nextId = () => ++uid;

// ------------------------------------------------------------ helpers

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", "X-Session": CFG.session, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function toast(msg, err = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast" + (err ? " err" : "");
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), err ? 6000 : 3000);
}

const today = () => new Date().toLocaleDateString("en-CA");
const slugify = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
const fileBase = (name) => {
  const dot = name.lastIndexOf(".");
  return slugify(dot > 0 ? name.slice(0, dot) : name) || "file";
};
const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "bin");
const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
const toList = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v.map(String) : [String(v)]);

function blankState() {
  return {
    isNew: true, slugTouched: false, slug: "", title: "", category: "project", date: today(),
    description: "", display_tag: "", ai_assisted: false, keywords: "",
    links: [{ id: nextId(), kind: "live", label: "", url: "", fileRef: null }],
    thumb: null, thumbnail_alt: "", gallery: [], attachments: [], body: "",
    dc: { creator: "Brianna R. Imm", publisher: "Brianna R. Imm", language: "en" },
    originalPaths: [],
  };
}

// ------------------------------------------------------------ images and files

async function processImage(file, maxDim) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { blob: file, ext: extOf(file.name) };
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const keepPng = file.type === "image/png";
  if (scale === 1 && file.size < 1.5e6) {
    return { blob: file, ext: keepPng ? "png" : file.type === "image/webp" ? "webp" : "jpg" };
  }
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const type = keepPng ? "image/png" : "image/jpeg";
  const blob = await new Promise((r) => c.toBlob(r, type, 0.86));
  return { blob, ext: keepPng ? "png" : "jpg" };
}

function uniqueName(base, ext, taken) {
  let name = `${base}.${ext}`;
  let n = 2;
  while (taken.has(name)) name = `${base}-${n++}.${ext}`;
  taken.add(name);
  return name;
}

function takenNames() {
  const s = new Set(["thumbnail.jpg", "thumbnail.png", "thumbnail.webp"]);
  state.gallery.forEach((g) => s.add(g.name));
  state.attachments.forEach((a) => s.add(a.name));
  return s;
}

const blobToB64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(",")[1]);
  r.onerror = reject;
  r.readAsDataURL(blob);
});

// ------------------------------------------------------------ build item data

function buildItem() {
  const slug = state.slug || "new-item";
  const base = `/assets/items/${slug}`;
  const uploads = [];
  const blobFor = new Map();
  const addUpload = (path, entry) => {
    uploads.push({ path, blob: entry.file });
    blobFor.set(path, entry.objURL);
  };

  let thumbnail = null;
  if (state.thumb) {
    thumbnail = state.thumb.file ? `${base}/thumbnail.${state.thumb.ext}` : state.thumb.src;
    if (state.thumb.file) addUpload(thumbnail, state.thumb);
  }
  const gallery = state.gallery.map((g) => {
    const src = g.file ? `${base}/${g.name}` : g.src;
    if (g.file) addUpload(src, g);
    return { src, alt: g.alt, caption: g.caption };
  });
  const attachPath = new Map();
  const attachments = state.attachments.map((a) => {
    const file = a.file ? `${base}/files/${a.name}` : a.src;
    if (a.file) addUpload(file, a);
    attachPath.set(a.id, file);
    return { label: a.label, file, note: a.note };
  });
  const links = state.links
    .map((l) => ({ kind: l.kind, label: l.label.trim(), url: l.fileRef ? attachPath.get(l.fileRef) || "" : l.url.trim() }))
    .filter((l) => l.url);

  const dc = {};
  DC_FIELDS.forEach(([k]) => {
    const v = lines(state.dc[k]);
    if (v.length) dc[k] = v;
  });

  const item = {
    slug: state.slug, title: state.title.trim(), category: state.category, date: state.date,
    description: state.description.trim(), display_tag: state.display_tag.trim(),
    ai_assisted: state.ai_assisted,
    keywords: state.keywords.split(",").map((s) => s.trim()).filter(Boolean),
    thumbnail, thumbnail_alt: state.thumbnail_alt.trim(), links, gallery, attachments, dc,
    body: state.body,
  };
  return { item, uploads, blobFor };
}

function toMarkdown(item) {
  const q = (s) => JSON.stringify(String(s ?? ""));
  const flow = (arr) => `[${arr.map(q).join(", ")}]`;
  const out = ["---"];
  out.push(`title: ${q(item.title)}`);
  out.push(`category: ${item.category}`);
  out.push(`date: ${item.date}`);
  out.push(`description: ${q(item.description)}`);
  if (item.display_tag) out.push(`display_tag: ${q(item.display_tag)}`);
  out.push(`ai_assisted: ${item.ai_assisted ? "true" : "false"}`);
  if (item.keywords.length) out.push(`keywords: ${flow(item.keywords)}`);
  if (item.thumbnail) out.push(`thumbnail: ${item.thumbnail}`);
  if (item.thumbnail && item.thumbnail_alt) out.push(`thumbnail_alt: ${q(item.thumbnail_alt)}`);
  if (item.links.length) {
    out.push("links:");
    item.links.forEach((l) => {
      out.push(`  - kind: ${l.kind}`);
      if (l.label) out.push(`    label: ${q(l.label)}`);
      out.push(`    url: ${q(l.url)}`);
    });
  }
  if (item.gallery.length) {
    out.push("gallery:");
    item.gallery.forEach((g) => {
      out.push(`  - src: ${g.src}`);
      out.push(`    alt: ${q(g.alt)}`);
      if (g.caption) out.push(`    caption: ${q(g.caption)}`);
    });
  }
  if (item.attachments.length) {
    out.push("attachments:");
    item.attachments.forEach((a) => {
      out.push(`  - label: ${q(a.label || a.file.split("/").pop())}`);
      out.push(`    file: ${a.file}`);
      if (a.note) out.push(`    note: ${q(a.note)}`);
    });
  }
  const dcKeys = Object.keys(item.dc);
  if (dcKeys.length) {
    out.push("dc:");
    dcKeys.forEach((k) => out.push(`  ${k}: ${flow(item.dc[k])}`));
  }
  out.push("---", "");
  const body = item.body.replace(/\s+$/, "");
  return out.join("\n") + (body ? `\n${body}\n` : "");
}

function parseMarkdown(slug, text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("This file has no front matter.");
  const fm = jsyaml.load(m[1]) || {};
  const s = blankState();
  const d = fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : String(fm.date || today()).slice(0, 10);
  Object.assign(s, {
    isNew: false, slugTouched: true, slug, title: fm.title || "", category: fm.category === "paper" ? "paper" : "project",
    date: d, description: fm.description || "", display_tag: fm.display_tag || "", ai_assisted: !!fm.ai_assisted,
    keywords: toList(fm.keywords).join(", "), thumbnail_alt: fm.thumbnail_alt || "", body: (m[2] || "").replace(/^\n+/, ""),
  });
  s.thumb = fm.thumbnail ? { src: fm.thumbnail, file: null } : null;
  s.gallery = (fm.gallery || []).map((g) => ({ id: nextId(), src: g.src, file: null, name: String(g.src).split("/").pop(), alt: g.alt || "", caption: g.caption || "" }));
  s.attachments = (fm.attachments || []).map((a) => ({ id: nextId(), src: a.file, file: null, name: String(a.file).split("/").pop(), label: a.label || "", note: a.note || "" }));
  s.links = (fm.links || []).map((l) => {
    const att = s.attachments.find((a) => a.src === l.url);
    return { id: nextId(), kind: l.kind || "other", label: l.label || "", url: att ? "" : l.url || "", fileRef: att ? att.id : null };
  });
  if (!s.links.length) s.links = [{ id: nextId(), kind: "live", label: "", url: "", fileRef: null }];
  s.dc = {};
  DC_FIELDS.forEach(([k]) => { if (fm.dc && fm.dc[k] !== undefined) s.dc[k] = toList(fm.dc[k]).join("\n"); });
  const prefix = `/assets/items/${slug}/`;
  s.originalPaths = [fm.thumbnail, ...s.gallery.map((g) => g.src), ...s.attachments.map((a) => a.src)]
    .filter((p) => p && String(p).startsWith(prefix));
  return s;
}

// ------------------------------------------------------------ form <-> state

function fillForm() {
  document.querySelector(`input[name=category][value=${state.category}]`).checked = true;
  $("#f-title").value = state.title;
  $("#f-slug").value = state.slug;
  $("#f-slug").disabled = !state.isNew;
  $("#f-date").value = state.date;
  $("#f-description").value = state.description;
  $("#f-tag").value = state.display_tag;
  $("#f-keywords").value = state.keywords;
  $("#f-ai").checked = state.ai_assisted;
  $("#f-thumb-alt").value = state.thumbnail_alt;
  $("#f-body").value = state.body;
  DC_FIELDS.forEach(([k]) => { $(`#dc-${k}`).value = state.dc[k] || ""; });
  document.querySelectorAll(".touched").forEach((el) => el.classList.remove("touched"));
  renderLinks(); renderThumb(); renderGallery(); renderAttachments(); updateSlugHint(); updateCount();
}

function updateSlugHint() {
  $("#slug-hint").textContent = state.isNew
    ? `${CFG.site.replace(/^https?:\/\//, "")}/items/${state.slug || "..."}/`
    : "The slug of a published item cannot change.";
}
function updateCount() { $("#desc-count").textContent = state.description.length; }

function bindBasics() {
  document.querySelectorAll("input[name=category]").forEach((r) => r.addEventListener("change", () => {
    state.category = r.value;
    if (state.isNew && state.category === "paper") {
      if (!state.dc.type) state.dc.type = "Text";
      if (!state.dc.format) state.dc.format = "application/pdf";
      if (state.links.length === 1 && !state.links[0].url && !state.links[0].fileRef) state.links[0].kind = "ssrn";
      fillForm();
    }
    changed();
  }));
  $("#f-title").addEventListener("input", (e) => {
    state.title = e.target.value;
    if (state.isNew && !state.slugTouched) { state.slug = slugify(state.title); $("#f-slug").value = state.slug; updateSlugHint(); }
    changed();
  });
  $("#f-slug").addEventListener("input", (e) => {
    state.slugTouched = true;
    state.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    e.target.value = state.slug;
    updateSlugHint(); changed();
  });
  const simple = [["#f-date", "date"], ["#f-description", "description"], ["#f-tag", "display_tag"], ["#f-keywords", "keywords"], ["#f-thumb-alt", "thumbnail_alt"], ["#f-body", "body"]];
  simple.forEach(([sel, key]) => $(sel).addEventListener("input", (e) => { state[key] = e.target.value; if (key === "description") updateCount(); changed(); }));
  $("#f-ai").addEventListener("change", (e) => { state.ai_assisted = e.target.checked; changed(); });
  document.querySelectorAll("input, textarea").forEach((el) => el.addEventListener("blur", () => el.classList.add("touched")));

  const dc = $("#dc");
  dc.innerHTML = DC_FIELDS.map(([k, label, ph]) => `<label class="field"><span>${label}</span><textarea id="dc-${k}" rows="${k === "subject" || k === "relation" ? 3 : 1}" placeholder="${esc(ph)}"${k === "type" ? ' list="dcmi-types"' : ""}></textarea></label>`).join("")
    + `<datalist id="dcmi-types">${DCMI_TYPES.map((t) => `<option value="${t}">`).join("")}</datalist>`;
  DC_FIELDS.forEach(([k]) => $(`#dc-${k}`).addEventListener("input", (e) => { state.dc[k] = e.target.value; changed(); }));
}

// ---------- links

function renderLinks() {
  const box = $("#links");
  box.innerHTML = "";
  state.links.forEach((l, i) => {
    const row = document.createElement("div");
    row.className = "rowcard";
    const kinds = Object.entries(LINK_KINDS).map(([k, v]) => `<option value="${k}"${k === l.kind ? " selected" : ""}>${v.name}</option>`).join("");
    const atts = state.attachments.map((a) => `<option value="${a.id}"${a.id === l.fileRef ? " selected" : ""}>${esc(a.label || a.name)}</option>`).join("");
    const useFile = !!l.fileRef;
    row.innerHTML = `
      <span class="lbl${i === 0 ? " main" : ""}">${i === 0 ? "Main link" : `Link ${i + 1}`}</span>
      <div class="tools">
        <button type="button" class="mini" data-act="up" title="Move up" aria-label="Move up">&uarr;</button>
        <button type="button" class="mini" data-act="down" title="Move down" aria-label="Move down">&darr;</button>
        <button type="button" class="mini del" data-act="del" title="Remove" aria-label="Remove link">&times;</button>
      </div>
      <div class="link-grid">
        <select data-k="kind" aria-label="Link type">${kinds}</select>
        <input data-k="label" placeholder="Button text (default: ${esc(LINK_KINDS[l.kind]?.label || "Link")})" value="${esc(l.label)}">
      </div>
      ${state.attachments.length ? `<div class="src-toggle"><label><input type="radio" name="src-${l.id}" value="url"${useFile ? "" : " checked"}> Web address</label><label><input type="radio" name="src-${l.id}" value="file"${useFile ? " checked" : ""}> Attached file</label></div>` : ""}
      ${useFile ? `<select data-k="fileRef" aria-label="Attached file">${atts}</select>` : `<input data-k="url" type="url" placeholder="https://..." value="${esc(l.url)}">`}`;
    row.querySelector("[data-k=kind]").addEventListener("change", (e) => { l.kind = e.target.value; renderLinks(); changed(); });
    row.querySelector("[data-k=label]").addEventListener("input", (e) => { l.label = e.target.value; changed(); });
    const url = row.querySelector("[data-k=url]");
    if (url) url.addEventListener("input", (e) => { l.url = e.target.value; changed(); });
    const ref = row.querySelector("[data-k=fileRef]");
    if (ref) ref.addEventListener("change", (e) => { l.fileRef = Number(e.target.value); changed(); });
    row.querySelectorAll(`input[name=src-${l.id}]`).forEach((r) => r.addEventListener("change", () => {
      l.fileRef = r.value === "file" ? (state.attachments[0] || {}).id || null : null;
      renderLinks(); changed();
    }));
    row.querySelector(".tools").addEventListener("click", (e) => {
      const act = e.target.dataset.act;
      if (!act) return;
      moveOrDelete(state.links, i, act);
      if (!state.links.length) state.links.push({ id: nextId(), kind: "live", label: "", url: "", fileRef: null });
      renderLinks(); changed();
    });
    box.appendChild(row);
  });
}

function moveOrDelete(arr, i, act) {
  if (act === "del") arr.splice(i, 1);
  if (act === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
  if (act === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
}

// ---------- thumbnail, gallery, attachments

function previewSrc(entry) {
  if (entry.objURL) return entry.objURL;
  return resolvePath(entry.src);
}

function renderThumb() {
  const has = !!state.thumb;
  $("#thumb-empty").hidden = has;
  $("#thumb-show").hidden = !has;
  if (has) $("#thumb-img").src = previewSrc(state.thumb);
}

function renderGallery() {
  const box = $("#gallery");
  box.innerHTML = "";
  state.gallery.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "rowcard img-row";
    row.innerHTML = `<img src="${esc(previewSrc(g))}" alt="">
      <div class="fields">
        <span class="file-name">${esc(g.name)}${g.file ? '<span class="new-pill">new</span>' : ""}</span>
        <input data-k="alt" placeholder="Alt text: what the image shows" value="${esc(g.alt)}">
        <input data-k="caption" placeholder="Caption (optional)" value="${esc(g.caption)}">
      </div>
      <div class="tools">
        <button type="button" class="mini" data-act="up" aria-label="Move up">&uarr;</button>
        <button type="button" class="mini" data-act="down" aria-label="Move down">&darr;</button>
        <button type="button" class="mini del" data-act="del" aria-label="Remove image">&times;</button>
      </div>`;
    row.querySelector("[data-k=alt]").addEventListener("input", (e) => { g.alt = e.target.value; changed(); });
    row.querySelector("[data-k=caption]").addEventListener("input", (e) => { g.caption = e.target.value; changed(); });
    row.querySelector(".tools").addEventListener("click", (e) => {
      if (!e.target.dataset.act) return;
      moveOrDelete(state.gallery, i, e.target.dataset.act);
      renderGallery(); changed();
    });
    box.appendChild(row);
  });
}

function renderAttachments() {
  const box = $("#attachments");
  box.innerHTML = "";
  state.attachments.forEach((a, i) => {
    const row = document.createElement("div");
    row.className = "rowcard file-row";
    row.innerHTML = `<span class="file-name">${esc(a.name)}${a.file ? `<span class="new-pill">new &middot; ${(a.file.size / 1e6).toFixed(1)} MB</span>` : ""}</span>
      <input data-k="label" placeholder="Label, for example: Full text (PDF)" value="${esc(a.label)}">
      <input data-k="note" placeholder="Note (optional), for example: Draft of March 2027" value="${esc(a.note)}">
      <div class="tools"><button type="button" class="mini del" data-act="del" aria-label="Remove file">&times;</button></div>`;
    row.querySelector("[data-k=label]").addEventListener("input", (e) => { a.label = e.target.value; changed(); renderLinksSoon(); });
    row.querySelector("[data-k=note]").addEventListener("input", (e) => { a.note = e.target.value; changed(); });
    row.querySelector(".tools").addEventListener("click", (e) => {
      if (e.target.dataset.act !== "del") return;
      state.attachments.splice(i, 1);
      state.links.forEach((l) => { if (l.fileRef === a.id) l.fileRef = null; });
      renderAttachments(); renderLinks(); changed();
    });
    box.appendChild(row);
  });
}
let linkTimer;
function renderLinksSoon() { clearTimeout(linkTimer); linkTimer = setTimeout(renderLinks, 400); }

function bindDrop(zoneSel, inputSel, onFiles) {
  const zone = $(zoneSel);
  const input = $(inputSel);
  zone.addEventListener("click", (e) => { if (e.target.tagName !== "BUTTON") input.click(); });
  zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("over"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("over"));
  zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("over"); onFiles([...e.dataTransfer.files]); });
  input.addEventListener("change", () => { onFiles([...input.files]); input.value = ""; });
}

function bindMedia() {
  bindDrop("#thumb-drop", "#thumb-input", async (files) => {
    const f = files.find((x) => x.type.startsWith("image/"));
    if (!f) return toast("Choose an image file.", true);
    const { blob, ext } = await processImage(f, 1600);
    state.thumb = { src: null, file: blob, ext, objURL: URL.createObjectURL(blob) };
    if (!state.thumbnail_alt) $("#f-thumb-alt").focus();
    renderThumb(); changed();
  });
  $("#thumb-remove").addEventListener("click", (e) => { e.stopPropagation(); state.thumb = null; renderThumb(); changed(); });

  bindDrop("#gal-drop", "#gal-input", async (files) => {
    const taken = takenNames();
    for (const f of files.filter((x) => x.type.startsWith("image/"))) {
      const { blob, ext } = await processImage(f, 2000);
      state.gallery.push({ id: nextId(), src: null, file: blob, name: uniqueName(fileBase(f.name), ext, taken), objURL: URL.createObjectURL(blob), alt: "", caption: "" });
    }
    renderGallery(); changed();
  });

  bindDrop("#att-drop", "#att-input", (files) => {
    const taken = takenNames();
    files.forEach((f) => {
      if (f.size > 50e6) return toast(`${f.name} is over 50 MB. GitHub Pages cannot serve it well.`, true);
      const a = { id: nextId(), src: null, file: f, name: uniqueName(fileBase(f.name), extOf(f.name), taken), objURL: URL.createObjectURL(f), label: "", note: "" };
      state.attachments.push(a);
    });
    renderAttachments(); renderLinks(); changed();
  });
}

// ------------------------------------------------------------ preview

let view = "item";
let renderTimer;
let lastBlobMap = new Map();

function resolvePath(p) {
  if (!p) return "";
  if (lastBlobMap.has(p)) return lastBlobMap.get(p);
  if (p.startsWith("/assets/items/")) return `/api/raw?path=${encodeURIComponent(p.slice(1))}&s=${encodeURIComponent(CFG.session)}`;
  if (p.startsWith("/")) return `/site${p}`;
  return p;
}

function changed() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 180);
}

function render() {
  const { item, blobFor } = buildItem();
  lastBlobMap = blobFor;
  const md = toMarkdown(item);
  const dirty = md !== savedMarkdown || buildItem().uploads.length > 0;
  const status = $("#status");
  status.textContent = state.isNew ? "New item, not published" : dirty ? "Unsaved changes" : "Published version";
  status.classList.toggle("dirty", dirty);
  render.dirty = dirty;

  if (view === "source") {
    $("#source").textContent = md;
    return;
  }
  const inner = view === "card" ? renderCard(item, resolvePath) : renderItem(item, resolvePath, ctx);
  const frame = $("#frame");
  const y = frame.contentWindow ? frame.contentWindow.scrollY : 0;
  frame.onload = () => { try { frame.contentWindow.scrollTo(0, y); } catch (e) { /* ignore */ } };
  frame.srcdoc = previewDocument(inner, ctx, view);
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    view = t.dataset.view;
    document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", String(x === t)));
    $("#frame").hidden = view === "source";
    $("#source").hidden = view !== "source";
    render();
  }));
}

// ------------------------------------------------------------ validation and publish

function validate(item) {
  const problems = [];
  const mark = (sel, bad) => $(sel).classList.toggle("invalid", bad);
  mark("#f-title", !item.title); if (!item.title) problems.push("a title");
  const slugBad = !/^[a-z0-9][a-z0-9-]*$/.test(state.slug);
  mark("#f-slug", slugBad); if (slugBad) problems.push("a slug (lowercase letters, numbers, hyphens)");
  mark("#f-date", !/^\d{4}-\d{2}-\d{2}$/.test(item.date)); if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) problems.push("a date");
  mark("#f-description", !item.description); if (!item.description) problems.push("a short description");
  state.links.forEach((l) => { if (!l.fileRef && l.url && !/^(https?:\/\/|\/|mailto:)/.test(l.url.trim())) problems.push(`a full web address for "${l.url}"`); });
  const noAlt = item.gallery.some((g) => !g.alt.trim());
  return { problems, warnings: noAlt ? ["Some gallery images have no alt text."] : [] };
}

function setSteps(list, activeIndex, failIndex = -1) {
  $("#steps").innerHTML = list.map((s, i) => {
    const cls = i === failIndex ? "fail" : i < activeIndex ? "done" : i === activeIndex ? "active" : "";
    return `<li class="${cls}">${s}</li>`;
  }).join("");
}

function showModal(title) {
  $("#modal-title").textContent = title;
  $("#modal-msg").innerHTML = "";
  $("#modal-actions").innerHTML = "";
  $("#modal").hidden = false;
}
function modalButton(label, cls, fn) {
  const b = document.createElement("button");
  b.type = "button"; b.className = `btn ${cls}`; b.textContent = label;
  b.addEventListener("click", fn);
  $("#modal-actions").appendChild(b);
  return b;
}

async function publish() {
  const { item, uploads } = buildItem();
  const { problems, warnings } = validate(item);
  if (problems.length) return toast(`Add ${problems.join(", ")}.`, true);
  if (warnings.length) toast(warnings[0]);

  const STEPS = ["Prepare files", "Commit to GitHub", "Build the website", "Live"];
  const btn = $("#btn-publish");
  btn.disabled = true;
  showModal(`Publishing “${item.title}”`);
  setSteps(STEPS, 0);

  try {
    const files = [];
    for (const u of uploads) files.push({ path: u.path.slice(1), content_b64: await blobToB64(u.blob) });
    const current = new Set([item.thumbnail, ...item.gallery.map((g) => g.src), ...item.attachments.map((a) => a.file)]);
    const del = state.originalPaths.filter((p) => !current.has(p)).map((p) => p.slice(1));
    setSteps(STEPS, 1);
    const markdown = toMarkdown(item);
    const res = await api("/api/publish", {
      method: "POST",
      body: JSON.stringify({ slug: state.slug, title: item.title, markdown, files, delete: del, is_new: state.isNew }),
    });

    // The item is now saved. Uploaded files become ordinary repository paths.
    savedMarkdown = markdown;
    state.isNew = false;
    if (state.thumb && state.thumb.file) { state.thumb.src = item.thumbnail; state.thumb.file = null; }
    state.gallery.forEach((g, i) => { if (g.file) { g.src = item.gallery[i].src; g.file = null; } });
    state.attachments.forEach((a, i) => { if (a.file) { a.src = item.attachments[i].file; a.file = null; } });
    state.originalPaths = [...current].filter((p) => p && p.startsWith(`/assets/items/${state.slug}/`));
    fillForm();
    await loadPicker(state.slug);
    render();

    setSteps(STEPS, 2);
    const itemUrl = `${CFG.site}/items/${state.slug}/`;
    $("#modal-msg").innerHTML = `Saved in commit <a href="${res.commit_url}" target="_blank">${res.commit.slice(0, 7)}</a>. GitHub Pages is building the site. This usually takes about a minute.`;
    modalButton("Close", "ghost", () => ($("#modal").hidden = true));

    const started = Date.now();
    while (Date.now() - started < 6 * 60 * 1000) {
      await new Promise((r) => setTimeout(r, 4000));
      let b;
      try { b = await api("/api/pages"); } catch (e) { continue; }
      if (b.commit === res.commit && b.status === "built") {
        setSteps(STEPS, 4);
        $("#modal-title").textContent = "Live!";
        $("#modal-msg").innerHTML = `“${esc(item.title)}” is on the website. It can take another minute for every page to update. Commit <a href="${res.commit_url}" target="_blank">${res.commit.slice(0, 7)}</a>.`;
        $("#modal-actions").innerHTML = "";
        modalButton("Close", "ghost", () => ($("#modal").hidden = true));
        modalButton("Open item page", "primary", () => window.open(itemUrl, "_blank"));
        return;
      }
      if (b.commit === res.commit && b.status === "errored") {
        setSteps(STEPS, 2, 2);
        $("#modal-msg").textContent = `The commit is saved, but the site build failed: ${b.error || "unknown error"}. The previous version of the site stays online.`;
        return;
      }
    }
    $("#modal-msg").innerHTML = `The commit is saved. The build is taking longer than usual. Check <a href="https://github.com/${CFG.repo}/actions" target="_blank">GitHub</a> later, or open the <a href="${itemUrl}" target="_blank">item page</a> in a few minutes.`;
  } catch (e) {
    setSteps(STEPS, 1, 1);
    $("#modal-title").textContent = "Not published";
    $("#modal-msg").textContent = e.message;
    modalButton("Close", "ghost", () => ($("#modal").hidden = true));
  } finally {
    btn.disabled = false;
  }
}

// ------------------------------------------------------------ items and startup

async function loadPicker(select = "") {
  const { items } = await api("/api/items");
  const p = $("#picker");
  p.innerHTML = `<option value="">New item</option>` + items.map((i) => `<option value="${esc(i.slug)}">${esc(i.slug)}</option>`).join("");
  p.value = select;
}

function confirmDiscard() {
  return !render.dirty || state.isNew && !state.title || confirm("Discard the unsaved changes to this item?");
}

async function openItem(slug) {
  if (!slug) return newItem();
  try {
    const { markdown } = await api(`/api/item?slug=${encodeURIComponent(slug)}`);
    state = parseMarkdown(slug, markdown);
    fillForm();
    savedMarkdown = toMarkdown(buildItem().item);
    render();
  } catch (e) {
    toast(e.message, true);
  }
}

function newItem() {
  state = blankState();
  savedMarkdown = "";
  $("#picker").value = "";
  fillForm();
  render();
  $("#f-title").focus();
}

async function boot() {
  $("#repo-name").textContent = CFG.repo;
  bindBasics(); bindMedia(); bindTabs();
  $("#add-link").addEventListener("click", () => { state.links.push({ id: nextId(), kind: "other", label: "", url: "", fileRef: null }); renderLinks(); changed(); });
  $("#btn-new").addEventListener("click", () => { if (confirmDiscard()) newItem(); });
  $("#picker").addEventListener("change", (e) => {
    const slug = e.target.value;
    if (!confirmDiscard()) { e.target.value = state.isNew ? "" : state.slug; return; }
    openItem(slug);
  });
  $("#btn-publish").addEventListener("click", publish);
  $("#btn-quit").addEventListener("click", async () => {
    if (!confirmDiscard()) return;
    try { await api("/api/quit", { method: "POST", body: "{}" }); } catch (e) { /* already stopped */ }
    render.dirty = false;
    document.body.innerHTML = '<div style="display:grid;place-items:center;height:100vh;color:#9aa3ad;font:1rem Inter,sans-serif">The editor has stopped. You can close this window.</div>';
    window.close();
  });
  window.addEventListener("beforeunload", (e) => { if (render.dirty && !(state.isNew && !state.title)) { e.preventDefault(); e.returnValue = ""; } });

  // Site partials for the preview, so the preview matches the real site.
  const [sprite, background, dcYml] = await Promise.all(
    ["/site/_includes/sprite.html", "/site/_includes/background.html", "/site/_data/dublin_core.yml"].map((u) => fetch(u).then((r) => r.text()).catch(() => ""))
  );
  ctx.sprite = sprite; ctx.background = background;
  try { ctx.dublinCore = jsyaml.load(dcYml) || []; } catch (e) { ctx.dublinCore = []; }

  newItem();

  try {
    const me = await api("/api/me");
    const who = $("#who");
    who.classList.add("ok");
    who.innerHTML = `${me.avatar ? `<img src="${esc(me.avatar)}" alt="">` : '<span class="dot"></span>'}<span>Signed in as <b>@${esc(me.login)}</b></span>`;
    $("#btn-publish").disabled = false;
    await loadPicker();
  } catch (e) {
    const who = $("#who");
    who.classList.add("bad");
    $("#who-text").textContent = e.message;
  }
}

boot();
