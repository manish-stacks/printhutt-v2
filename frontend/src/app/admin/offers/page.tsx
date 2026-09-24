import OfferPage from "@/views/admin/OfferPage";
import { Suspense } from "react";

const Page = () => {

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <OfferPage />
      </Suspense>
    </>
  )
}

export default Page;