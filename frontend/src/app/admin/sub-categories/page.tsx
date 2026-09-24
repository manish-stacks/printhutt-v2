import SubCategoryList from "@/views/admin/categories/SubCategoryList";
import { Suspense } from "react";

const Page = () => {

    return (
        <>
            <Suspense fallback={<div>Loading...</div>}>
                <SubCategoryList />
            </Suspense>
        </>
    )
}

export default Page;