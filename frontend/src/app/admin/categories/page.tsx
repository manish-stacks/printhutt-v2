import Categories from "@/views/admin/categories/CategoryList"
import { Suspense } from "react";

const Page = () => {

  return (
    <>
      <Suspense fallback={<div>Loading categories...</div>}>
        <Categories />
      </Suspense>
    </>
  )
}

export default Page;