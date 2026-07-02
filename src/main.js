import { Actor } from 'apify';
import { CheerioCrawler, log, enqueueLinks } from 'crawlee';
import { gotScraping } from 'got-scraping';

await Actor.init();

try {
    const input = await Actor.getInput();
    if (!input || !input.startUrls || input.startUrls.length === 0) {
        throw new Error('startUrls is required!');
    }

    const { startUrls, maxPagesPerCrawl = 100, checkExternalImages = true } = input;
    
    // Global cache for checked image URLs to avoid duplicate network requests
    const checkedImages = new Set();
    
    let pagesScanned = 0;
    let brokenImagesFound = 0;

    const crawler = new CheerioCrawler({
        maxRequestsPerCrawl: maxPagesPerCrawl,
        
        async requestHandler({ request, $, enqueueLinks, log }) {
            const pageUrl = request.loadedUrl || request.url;
            const pageDomain = new URL(pageUrl).hostname;
            
            // Extract all image tags
            const imgElements = $('img').toArray();
            const imagesToTest = [];

            for (const el of imgElements) {
                let src = $(el).attr('src');
                const altText = $(el).attr('alt') || '';
                
                if (!src) continue;
                
                // Ignore base64 images
                if (src.startsWith('data:')) continue;
                
                // Convert relative URLs to absolute
                try {
                    src = new URL(src, pageUrl).href;
                } catch (e) {
                    // Invalid URL format
                    continue;
                }
                
                // Handle external image check logic
                if (!checkExternalImages) {
                    const imgDomain = new URL(src).hostname;
                    if (imgDomain !== pageDomain) {
                        continue;
                    }
                }
                
                // Check cache to avoid duplicate work
                if (checkedImages.has(src)) continue;
                checkedImages.add(src);
                
                imagesToTest.push({ src, altText });
            }

            // Ping each image
            for (const img of imagesToTest) {
                let isBroken = false;
                let statusCode = null;
                let errorReason = '';

                try {
                    // Send lightweight HEAD request first
                    let response = await gotScraping({
                        url: img.src,
                        method: 'HEAD',
                        timeout: { request: 10000 },
                        retry: { limit: 1 }
                    });
                    
                    // Some servers reject HEAD requests with 405 Method Not Allowed or 403. 
                    // Fallback to GET if we get a suspicious error.
                    if (response.statusCode >= 400 && response.statusCode !== 404) {
                        response = await gotScraping({
                            url: img.src,
                            method: 'GET',
                            timeout: { request: 10000 },
                            retry: { limit: 1 }
                        });
                    }

                    if (response.statusCode >= 400) {
                        isBroken = true;
                        statusCode = response.statusCode;
                        errorReason = `HTTP ${statusCode}`;
                    }
                } catch (err) {
                    isBroken = true;
                    statusCode = err.response ? err.response.statusCode : null;
                    errorReason = err.code || err.message;
                }

                if (isBroken) {
                    brokenImagesFound++;
                    log.info(`❌ Broken Image Found: ${img.src} on ${pageUrl} (Error: ${errorReason})`);
                    
                    await Actor.pushData({
                        pageUrl,
                        imgUrl: img.src,
                        altText: img.altText,
                        statusCode,
                        errorReason,
                        scrapedAt: new Date().toISOString()
                    });
                }
            }

            // PPE Monetization: Charge per page scanned
            await Actor.charge({ eventName: 'page-scanned', count: 1 });
            pagesScanned++;
            
            // Enqueue links on the same domain to continue crawling
            await enqueueLinks({
                strategy: 'same-domain',
            });
            
            log.info(`✅ Scanned page ${pageUrl} and tested ${imagesToTest.length} new unique images.`);
        },
        
        async failedRequestHandler({ request, log }) {
            log.error(`Request ${request.url} failed too many times.`);
        },
    });

    log.info('Starting crawler...');
    await crawler.addRequests(startUrls);
    await crawler.run();

    log.info(`🎉 Finished! Scanned ${pagesScanned} pages and found ${brokenImagesFound} broken unique images.`);
} catch (error) {
    log.error('Actor failed:', error);
    throw error;
}

await Actor.exit();
