import { Metadata } from 'next';
import { pageService } from '@/_services/admin/page';
import Breadcrumb from '@/components/Breadcrumb';

const SLUG = 'return-policy';

async function getPage() {
  try {
    const res: any = await pageService.getBySlug(SLUG);
    return res?.page;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage();
  return {
    title: page?.metaTitle || page?.title || 'Return Policy',
    description: page?.metaDescription || '',
    keywords: page?.metaKeywords || '',
  };
}

export default async function ReturnPolicyPage() {
  const page = await getPage();

  return (
    <>
      <Breadcrumb title={page?.title || 'Return Policy'} />
      <section className="py-[40px] max-[1199px]:py-[25px]">
        <div className="mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] min-[576px]:max-w-[540px] px-[12px]">
          <div
            className="prose prose-lg max-w-none ql-editor"
            dangerouslySetInnerHTML={{ __html: page?.content || '<p>No content yet.</p>' }}
          />
        </div>
      </section>
    </>
  );
}