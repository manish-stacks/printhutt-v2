import UserPage from "@/views/admin/UserPage";
import { Suspense } from "react";

const Page = () => {

  return (
    <>
      <Suspense fallback={<div>Loading ...</div>}>
        <UserPage />
      </Suspense>
    </>
  )
}

export default Page;