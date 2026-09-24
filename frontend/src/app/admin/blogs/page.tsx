
import BlogList from "@/views/admin/blog/BlogList";
import { Suspense } from "react";

const Page = () => {

  return (
    <>
      <Suspense fallback={<div>Loading categories...</div>}>
        <BlogList />
      </Suspense>
    </>
  )
}

export default Page;