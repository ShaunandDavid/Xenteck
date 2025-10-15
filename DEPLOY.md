# XenTeck Deployment Guide

This project is a static site: HTML, CSS, JS and media assets. It can be deployed to any static host (Netlify, Vercel, Cloudflare Pages, S3 + CloudFront, etc.). The hero also streams live projections from Gemini when an API key is provided. Follow the steps below to publish safely to `xenteck.com`.

---

## 1. Build & Verification Checklist

1. **Dependencies**  
   No build tooling is required. If you want to run a local web server for testing:  
   ```bash
   npx serve .
   # or
   python -m http.server 8080
   ```

2. **Smoke test locally**  
   - Open `http://localhost:8080/index.html` (or port from your dev server).  
   - Confirm the hero background video loads and the "AI Forecast Engine" mounts.  
   - Submit the contact form (without a Gemini key) to confirm validation and Formspree success state.  
   - Run through mobile and tablet widths (Chrome DevTools) to verify responsiveness.  
   - Validate there are no console errors.

3. **Gemini API key (optional but recommended)**  
   - Add your Gemini API key to `window.ENV.GEMINI_API_KEY` in `index.html` *or* leave it blank so users can paste their own.  
   - Never commit real keys to version control. Inject it via your hosting provider’s environment variable management if possible (e.g., Netlify environment injection + build step that rewrites `window.ENV`).

4. **Cache busting & headers**  
   - Ensure your host serves `index.html` and `404.html` with `Cache-Control: no-cache`.  
   - Serve assets (`assets/**`) with long-lived caching (`Cache-Control: public, max-age=31536000, immutable`).  
   - Force HTTPS at the CDN/edge; the JS will redirect from HTTP → HTTPS as a failsafe.

---

## 2. Netlify (recommended quick path)

1. Create a new Netlify site connected to your GitHub repository.  
2. Set **Publish directory** to the project root. No build command is required.  
3. Add a redirect rule so SPA-style routing still serves the 404 fallback:  
   ```
   /*    /404.html   404
   ```
4. (Optional) Add an environment variable `GEMINI_API_KEY` and wire it during build with a script that rewrites `window.ENV.GEMINI_API_KEY`. Example build command:
   ```bash
   node scripts/inject-gemini-key.js
   ```
   *(You would create the script to read `process.env.GEMINI_API_KEY` and replace the placeholder.)*
5. Deploy and map the custom domain `xenteck.com` in Netlify’s Domain settings. Point your DNS `A` and `CNAME` records as instructed by Netlify.

---

## 3. Vercel

1. Import the GitHub repository into Vercel.  
2. Leave build command empty; set **Output Directory** to `.`.  
3. Add a rewrite in `vercel.json` (create the file if it doesn’t exist) so 404 remains available:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   *(The `404.html` in the repo still handles hard 404s when deployed to static hosting services that respect it.)*
4. Configure an environment variable `GEMINI_API_KEY` if you plan to inject it.  
5. Deploy, add the `xenteck.com` domain, and update DNS per Vercel’s instructions.

---

## 4. Cloudflare Pages

1. Create a new Pages project from GitHub.  
2. **Build command**: leave empty. **Build output directory**: `/`.  
3. In Project Settings → Functions → 404 page, set `404.html`.  
4. Configure environment variable `GEMINI_API_KEY` if required.  
5. Connect the custom domain and update DNS records (typically `CNAME` to `<project>.pages.dev`).

---

## 5. AWS S3 + CloudFront (manual option)

1. Sync the project into an S3 bucket configured for static website hosting:
   ```bash
   aws s3 sync . s3://xenteck-site --exclude \".git/*\" --exclude \"*.ps1\" --exclude \"node_modules/*\"
   ```
2. Disable uploads of `.git`, `.ps1`, or other local files.  
3. Create a CloudFront distribution that points to the S3 static site endpoint.  
4. Add error responses mapping `404` and `403` to `/404.html`.  
5. Attach the ACM certificate for `xenteck.com` and update DNS `A` record to the CloudFront distribution.

---

## 6. Post-deploy QA

- `https://xenteck.com/` → loads hero video + forecast widget.  
- `https://xenteck.com/404.html` → branded 404 page.  
- Social share preview (use `https://www.opengraph.xyz`) shows the `og-image.png`.  
- Lighthouse scores in Chrome DevTools: target 90+ for Performance, Accessibility, Best Practices, SEO.  
- If Gemini key is deployed, trigger a few topics to confirm live data and monitor quota usage.

---

## 7. Maintenance Tips

- Version bump assets if making breaking visual updates (e.g., place under `assets/v2/...`).  
- Keep the CDN cache invalidated after deploying new hero JS (`assets/js/visualizer.js`).  
- Rotate Gemini keys regularly; environment variables make this easy without code changes.  
- Track Formspree submissions (they offer dashboard + Slack/email hooks).  
- Review analytics/observability tech (if any) for GDPR/CCPA compliance before launch.

---

Happy shipping!
