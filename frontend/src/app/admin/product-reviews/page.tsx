import ProductReviews from "@/pages/admin/ProductReviews";
import { Suspense } from "react";

const Page = () => {

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <ProductReviews />
      </Suspense>
    </>
  )
}

export default Page;