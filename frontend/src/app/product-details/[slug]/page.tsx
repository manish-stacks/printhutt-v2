import { productService } from '@/_services/common/productService';
import ProductDetails from '@/pages/ProductDetails';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    slug: string;
  };
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

export default async function ProductPage({ params }: Props) {
  try {
    const { slug } = await params;

    const productResp: any = await productService.getBySlug(slug);
    const product = productResp?.product || productResp;
    if (!product) {
      return notFound();
    }
    const catId = String(product.category?.slug || '');
    const res = await productService.getProductsByCategory(10, catId);
    const relatedProduct = res?.products || [];
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