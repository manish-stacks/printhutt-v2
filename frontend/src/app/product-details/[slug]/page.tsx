import { productService } from '@/_services/common/productService';
import ProductDetails from '@/views/ProductDetails';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{
    slug: string;
  }>;
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;

    const productResp: any = await productService.getBySlug(slug);
    const product = productResp?.product || productResp;
    if (!product) {
      return {
        title: 'Product Details',
        description: 'Product information',
      };
    }

    return {
      title: product?.meta?.meta_title || 'Product Details',
      description: product?.meta?.meta_description || '',
      keywords: product?.meta?.meta_keywords || '',
      openGraph: {
        images: product.thumbnail?.url ? [product.thumbnail.url] : [],
      },
    };
  } catch {
    return {
      title: 'Product Details',
      description: 'Product information',
    };
  }
}

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: Props) {
  try {
    const { slug } = await params;

    const productResp: any = await productService.getBySlug(slug);
    const product = productResp?.product || productResp;
    if (!product) {
      return notFound();
    }
    // Same category ke random products (har visit pe alag, current product exclude)
    const catId = String(product.category?._id || product.category || '');
    let relatedProduct: any[] = [];
    try {
      const res: any = await productService.getTopProducts(12, catId || 'all', { random: true, exclude: String(product._id) });
      relatedProduct = res?.products || [];
      if (relatedProduct.length < 4) {
        const more: any = await productService.getTopProducts(12, 'all', { random: true, exclude: String(product._id) });
        relatedProduct = [...relatedProduct, ...(more?.products || []).filter((p: any) => !relatedProduct.some((r) => r._id === p._id))].slice(0, 12);
      }
    } catch { relatedProduct = []; }
    return (
      <ProductDetails
        product={product}
        relatedProduct={relatedProduct}
      />
    );
  } catch (error) {
    console.log(error);
    return notFound();
  }
}