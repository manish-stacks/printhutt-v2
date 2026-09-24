import Products from '@/views/Products'
import { Metadata } from 'next';
import { Suspense } from 'react';


export const metadata: Metadata = {
  title: 'Products | Neon Lights| LED Lights | Neon Signs| LED Signs',
  description: 'Products-Page',
  keywords: ['Products', 'neon Products', 'led lights', 'neon lights'],
  openGraph: {
    title: 'Products  ',
    description: 'Products-page',
  },
}

const Page = () => {

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Products />
      </Suspense>
    </>
  )
}

export default Page;




