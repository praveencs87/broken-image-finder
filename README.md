# Broken Image Finder

**Automatically crawl any website to detect and report broken images (404s, 500s). Keep your site looking professional and boost SEO.**

Broken images ruin the user experience and negatively impact your website's SEO rankings. This lightweight, blazing-fast actor will scan your entire website, discover every `<img>` tag, and ping the image sources to ensure they load successfully. 

## What can this Actor do?

- ✅ **Deep Crawling** - Start with a single URL and the actor will automatically follow all internal links on the same domain to scan your entire site.
- ✅ **Lightning Fast HTML Parsing** - Built on Cheerio, it parses HTML instantly without the heavy overhead of a headless browser.
- ✅ **Global Image Cache** - Uses an internal cache to remember which images have already been tested. If your site's logo is broken, it will only test it once, saving massive amounts of compute time.
- ✅ **External Image Support** - Can test images hosted on CDNs, Amazon S3, or third-party domains.
- ✅ **Rich Output** - Reports the exact page URL where the broken image was found, the broken image's URL, its `alt` text, and the HTTP status code (e.g., 404 Not Found).

## Why find broken images?

- 🎯 **SEO Optimization** - Search engines penalize sites with broken assets. Clean up your site to improve rankings.
- 📊 **User Experience** - Prevent users from seeing ugly missing-image icons on your beautiful web app.
- 📍 **Site Migrations** - Run a full scan after moving to a new domain or CMS to ensure all media links were updated correctly.

## How to use it

1. Enter your website URL into the **Start URLs** field.
2. Set the **Max Pages to Scan** to limit how deep the crawler goes (e.g., 100 pages).
3. Choose whether you want to check external images.
4. Click Start!

## How much does it cost?

This actor uses a **Pay-Per-Event (PPE)** pricing model. You only pay for the pages successfully scanned!
- **$0.50 per 1,000 pages scanned.**

## Output Example

When a broken image is found, the actor pushes this data to your dataset:

```json
{
  "pageUrl": "https://example.com/blog/my-awesome-post",
  "imgUrl": "https://example.com/assets/images/missing-hero.jpg",
  "altText": "A beautiful sunset over the mountains",
  "statusCode": 404,
  "errorReason": "Not Found",
  "scrapedAt": "2023-10-25T15:00:00.000Z"
}
```
