import { getNewsArticles, transformNewsData } from '@/lib/strapi';
import fallbackNewsData from '@/app/data/news&events/newsData.json';

export const dynamic = 'force-dynamic';

/**
 * Route handler for the AIRI @ UTCN news RSS feed (/rss.xml).
 * Generates a valid RSS 2.0 XML document containing the latest published news articles.
 * Falls back to local static news records if the CMS is offline.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://airi.utcluj.ro';
  let articles = [];

  try {
    const rawArticles = await getNewsArticles({ pageSize: 50 });
    if (rawArticles && rawArticles.length > 0) {
      articles = transformNewsData(rawArticles);
    }
  } catch (error) {
    console.error('Error fetching news articles for RSS feed:', error);
  }

  // Fallback to static news data if Strapi returned no items
  if (articles.length === 0 && Array.isArray(fallbackNewsData)) {
    const flattenedFallback = [];
    fallbackNewsData.forEach((category) => {
      if (Array.isArray(category.items)) {
        category.items.forEach((item) => {
          const year = item.date?.year || 2024;
          const month = item.date?.mouth || item.date?.month || 1;
          const day = item.date?.day || 1;
          const dateObj = new Date(year, month - 1, day);

          flattenedFallback.push({
            title: item.text || 'AIRI News Update',
            summary: item.text || '',
            linkUrl: item.url || siteUrl,
            slug: item.text ? encodeURIComponent(item.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) : '',
            date: dateObj.toISOString(),
          });
        });
      }
    });
    articles = flattenedFallback;
  }

  const itemsXml = articles.map((article) => {
    const link = article.slug
      ? `${siteUrl}/news&events/news/${article.slug}`
      : article.linkUrl || siteUrl;

    const pubDate = article.date
      ? new Date(article.date).toUTCString()
      : new Date().toUTCString();

    const title = article.title || 'AIRI News';
    const summary = article.summary || '';

    return `    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${summary}]]></description>
    </item>`;
  }).join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AIRi @ UTCN – News &amp; Updates</title>
    <link>${siteUrl}</link>
    <description>Latest research news, press releases, and announcements from the Artificial Intelligence Research Institute at Technical University of Cluj-Napoca.</description>
    <language>en</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new Response(rssXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
