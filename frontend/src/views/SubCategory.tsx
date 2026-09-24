"use client"
import CategoryListing from '@/components/products/CategoryListing';

const SubCategory = ({ slug, subslug }: { slug: string; subslug: string }) => <CategoryListing slug={slug} subslug={subslug} />;

export default SubCategory;
