# tins ::: Rick Klau's weblog — static archive

A frozen, read-only static copy of the WordPress blog that ran at
[tins.rklau.com](https://tins.rklau.com) from September 2001 to February 2024
(2,918 posts). It was crawled from the live site in October 2026 before the
original hosting was retired.

- Every original post URL is preserved (`/YYYY/MM/slug/` → `/YYYY/MM/slug/index.html`),
  along with category, tag, and date archives, pages, and the main RSS feed (`/feed/`).
- Comment forms, search, login links, and other dynamic WordPress features were removed.
  Existing comments are kept as read-only text.
- Images that were hosted on other rklau.com hosts were pulled into the archive
  (third-party hosts live under `_ext/`).

Deployed with GitHub Actions (`.github/workflows/pages.yml`). The `CNAME` file records
the intended custom domain; set it under Settings → Pages → Custom domain when cutting
DNS over.
