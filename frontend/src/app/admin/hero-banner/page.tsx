import HeroBanner from "@/views/admin/HeroBanner";
import { Suspense } from "react";

const Page = () => {

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <HeroBanner />
      </Suspense>
    </>
  )
}

export default Page;