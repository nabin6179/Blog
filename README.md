# Cybersecurity Blog

Static site: HTML, CSS, vanilla JS only. No build step, no backend — deploy directly to Vercel.

## Add a new article

1. Create a folder: `articles/your-article-name/`
2. Add your `index.html` inside it (copy `articles/network-analysis-web-shell/index.html` as a starting point — keep the small header bar at the top, replace everything below it with your content).
3. Copy one `<article class="article-card">...</article>` block in `index.html`'s article grid, update the link, title, description, and meta fields.

Nothing else needs to change.

## Run locally

```bash
python3 -m http.server 8080
```

## Deploy

Push to GitHub, import into Vercel, framework preset "Other," no build command. Done.
