import CouponPage from "@/views/admin/CouponPage";
import { Suspense } from "react";

const Page = () => {

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <CouponPage />
      </Suspense>
    </>
  )
}

export default Page;