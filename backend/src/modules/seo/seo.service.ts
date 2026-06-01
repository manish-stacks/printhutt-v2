import Product from '@/db/models/productModel';
import Category from '@/db/models/categoryModel';
import SubCategory from '@/db/models/subCategoryModel';
import Blog from '@/db/models/blogModel';
import { cacheGet, cacheSet } from '@/redis/client';
import { settingsRepo } from '@/modules/settings/settings.repository';

const CACHE_KEY = 'seo:sitemap';
const TTL = 3600; // 1 hour — sitemap har ghante refresh

interface Url {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

const escapeXml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const urlToXml = (u: Url): string =>
  `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority !== undefined ? `\n    <priority>${u.priority}</priority>` : ''}
  </url>`;

export async function generateSitemap(): Promise<string> {
  const cached = await cacheGet<string>(CACHE_KEY);
  if (cached) return cached;

  const baseSetting = (await settingsRepo.byKey('siteUrl')) as { value?: string } | null;
  const base = (baseSetting?.value as string) || 'http://localhost:3000';
  const baseClean = base.replace(/\/$/, '');

  // static URLs
  const urls: Url[] = [
    { loc: `${baseClean}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseClean}/about`, changefreq: 'monthly', priority: 0.5 },
    { loc: `${baseClean}/contact`, changefreq: 'monthly', priority: 0.5 },
    { loc: `${baseClean}/blog`, changefreq: 'weekly', priority: 0.7 },
    { loc: `${baseClean}/shop`, changefreq: 'daily', priority: 0.9 },
  ];

  // dynamic
  const [products, categories, subcategories, blogs] = await Promise.all([
    Product.find({ status: true }).select('slug updatedAt').lean(),
    Category.find().select('slug updatedAt').lean(),
    SubCategory.find().select('slug parentCategory updatedAt')
      .populate({ path: 'parentCategory', select: 'slug' })
      .lean(),
    Blog.find().select('slug updatedAt').lean(),
  ]);

  for (const p of products as Array<{ slug: string; updatedAt: Date }>) {
    urls.push({
      loc: `${baseClean}/product-details/${p.slug}`,
      lastmod: new Date(p.updatedAt).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8,
    });
  }
  for (const c of categories as unknown as Array<{ slug: string; updatedAt: Date }>) {
    urls.push({
      loc: `${baseClean}/category/${c.slug}`,
      lastmod: new Date(c.updatedAt).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7,
    });
  }
  for (const s of subcategories as Array<{
    slug: string;
    parentCategory?: { slug?: string };
    updatedAt: Date;
  }>) {
    if (s.parentCategory?.slug) {
      urls.push({
        loc: `${baseClean}/category/${s.parentCategory.slug}/${s.slug}`,
        lastmod: new Date(s.updatedAt).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.6,
      });
    }
  }
  for (const b of blogs as unknown as Array<{ slug: string; updatedAt: Date }>) {
    urls.push({
      loc: `${baseClean}/blog-details/${b.slug}`,
      lastmod: new Date(b.updatedAt).toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.6,
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(urlToXml).join('\n')}
</urlset>`;

  await cacheSet(CACHE_KEY, xml, TTL);
  return xml;
}

export async function generateRobots(): Promise<string> {
  const setting = (await settingsRepo.byKey('robotsTxt')) as { value?: string } | null;
  const baseSetting = (await settingsRepo.byKey('siteUrl')) as { value?: string } | null;
  const base = ((baseSetting?.value as string) || 'http://localhost:3000').replace(/\/$/, '');

  // Default agar admin ne kuch set nahi kiya
  const defaultRobots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /user
Disallow: /login

Sitemap: ${base}/sitemap.xml`;

  return (setting?.value as string) || defaultRobots;
}