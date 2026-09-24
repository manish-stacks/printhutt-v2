"use client"
import CategoryListing from '@/components/products/CategoryListing';

const Category = ({ slug }: { slug: string }) => <CategoryListing slug={slug} />;

export default Category;
