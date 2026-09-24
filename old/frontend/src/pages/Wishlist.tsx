import WishListcart from "@/components/products/WishListcart";
import { Product } from "@/lib/types/product";
import React from "react";

interface PopupProps {
  products: {
    items: { productId: Product }[];
  }
  deleteWishlist: (productId: string) => void;

}

const Wishlist = ({ data, deleteWishlist }: PopupProps) => {


  return (
    <>
      <section className="section-wishlist py-[50px] max-[1199px]:py-[35px]">
        <div className="flex flex-wrap justify-between relative items-center mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] min-[576px]:max-w-[540px]">
          <div className="flex flex-wrap w-full mb-[-24px] bb-wish-rightside">
            {
              data && data?.length > 0 ? (
                data.map((product, index) => (
                  <div key={index} className="min-[992px]:w-[25%] min-[768px]:w-[50%] w-full px-[12px] mb-[24px] bb-wishlist">
                    <WishListcart product={product} deleteWishlist={deleteWishlist} />
                  </div>
                ))
              ) : (
                <div className="flex min-h-[60vh] w-full items-center justify-center text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
                      <svg
                        className="h-7 w-7 text-pink-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 21.657 3.172 10.828a4 4 0 010-5.656z"
                        />
                      </svg>
                    </div>

                    <h2 className="font-Poppins text-lg font-semibold text-gray-800">
                      Your wishlist is empty
                    </h2>

                    <p className="mt-2 max-w-md text-sm text-gray-500">
                      Looks like you haven’t added anything yet. Start exploring and save your favorite items.
                    </p>

                    <button className="mt-6 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
                      Continue Shopping
                    </button>
                  </div>
                </div>

              )
            }
          </div>
        </div>
      </section>
    </>
  );
};

export default Wishlist;
