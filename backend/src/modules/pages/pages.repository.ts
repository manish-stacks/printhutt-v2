import Page from '@/db/models/pageModel';
import { PAGE_DEFAULTS } from './pages.defaults';

export const pagesRepo = {
  findBySlug: (slug: string) => Page.findOne({ slug }).lean(),

  list: () => Page.find().sort({ slug: 1 }).lean(),

  /** Get-or-create — first request seeds the default content. */
  findOrCreate: async (slug: string) => {
    const existing = await Page.findOne({ slug });
    if (existing) return existing.toObject();

    const def = PAGE_DEFAULTS[slug];
    if (!def) return null;

    const created = await Page.create({
      slug,
      title: def.title,
      content: def.content,
      metaTitle: def.metaTitle,
      metaDescription: def.metaDescription,
      metaKeywords: '',
    });
    return created.toObject();
  },

  update: (slug: string, patch: Record<string, unknown>) =>
    Page.findOneAndUpdate({ slug }, patch, { new: true, upsert: true }).lean(),
};