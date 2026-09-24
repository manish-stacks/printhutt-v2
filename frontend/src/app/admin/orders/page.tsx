import OrderPage from "@/views/admin/OrderPage";
import { Suspense } from "react";

const Page = () => {

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <OrderPage />
      </Suspense>
    </>
  )
}

export default Page;