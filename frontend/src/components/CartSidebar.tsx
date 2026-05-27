import { formatCurrency } from "@/helpers/helpers";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { RiArrowRightSLine, RiCloseLine } from "react-icons/ri";
import { toast } from "react-toastify";
// import CheckOutPopUp from "./CheckOutPopUp";
import CheckOutPopUpV2 from "./CheckOutPopUpV2";
import confetti from "canvas-confetti";
import GiftCustomizeModal from "./GiftCustomizeModal";
import { get_product_by_id } from "@/_services/admin/product";
import { Product } from "@/lib/types/product";
import { productService } from "@/_services/common/productService";

const CartSidebar = ({ onClose }: { onClose: () => void }) => {
  const popupRef = useRef(null);
  const [totalPrice, setTotalPrice] = useState({ totalPrice: 0, discountPrice: 0, shippingTotal: 0 });
  const { items, updateQuantity, removeFromCart, getTotalPrice } = useCartStore();
  const [showMailModal, setShowMailModal] = useState(false);
  const addToCart = useCartStore(state => state.addToCart);
  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [product, setProduct] = useState<Product>();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
    toast.info('Updated quantity');
  };


  useEffect(() => {
    setTotalPrice(getTotalPrice());
  }, [items]);


  useEffect(() => {
    (async () => {
      try {
        const productResp = await productService.getById('67b4756b5e05b7be01d85ea2');
        setProduct(productResp?.product || productResp);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!product) return;

    const FREE_THRESHOLD = 1000;
    const FREE_ID = "67b4756b5e05b7be01d85ea2";

    const { discountPrice = 0 } = getTotalPrice();
    const hasFreeGift = items.some(i => i._id === FREE_ID);

    if (discountPrice >= FREE_THRESHOLD && !hasFreeGift) {
      addToCart(
        {
          ...product,
          thumbnail: { ...product.thumbnail, url: "https://cdn.shopify.com/app-store/listing_images/08313cab5d04fcc9a59ffc39eefa1521/icon/CPuHmrL0lu8CEAE=.png" },
          title: "Free Acrylic photo Keychain With NFC tag",
          price: 0,
          discountPrice: 0,
          isGift: true,
          quantity: 1,
        },
        1
      );

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      toast.success("🎁 Free gift unlocked!");
    }

    if (discountPrice < FREE_THRESHOLD && hasFreeGift) {
      removeFromCart(FREE_ID);
    }
  }, [items, product]);
  // getTotalPrice().discountPrice, product


  // const cartPage = () => {
  //   onClose();
  //   return router.push('/cart');
  // }
  const checkoutPage = () => {
    if (!items.length) {
      toast.error('Please add items to cart');
      return;
    }
    setShowMailModal(true);
    // onClose();
    //return router.push('/checkout');

  }
  // console.log("cart items",items)

  return (
    <>
      {/* Cart sidebar */}
      <div className="bb-side-cart-overlay  w-full h-screen fixed top-[0] left-[0] bg-[#00000080] z-[17]" />
      <div className="bb-side-cart w-[770px] h-[calc(100%-30px)] my-[15px] ml-[15px] pt-[15px] px-[8px] text-[14px] font-normal fixed z-[99] top-[0] right-[0] left-[auto] block transition-all duration-[0.5s] ease delay-[0s] translate-x-[100%] bg-[#fff] overflow-auto opacity-[0] rounded-tl-[20px] rounded-bl-[20px] max-[991px]:w-[740px] max-[767px]:w-[350px] max-[575px]:w-[300px] bb-open-cart">
        <div className="flex flex-wrap h-full" ref={popupRef}>
          <div className="min-[768px]:w-[41.66%] w-full px-[12px] max-[767px]:hidden">
            <div className="bb-top-contact">
              <div className="bb-cart-title w-full mb-[20px] flex flex-wrap justify-between">
                <h4 className="font-quicksand text-[18px] font-extrabold text-[#3d4750] tracking-[0.03rem] leading-[1.2]">
                  Related Items
                </h4>
              </div>
            </div>
            <div className="bb-cart-box cart-related bb-border-right flex flex-col pr-[24px] border-r-[1px] border-solid border-[#eee] overflow-auto mb-[-24px]">

              <div className="bb-cart-banner mb-[24px]">
                <div className="banner rounded-[20px] relative overflow-hidden">
                  <img src="https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/loi5p36j7ezhhgk32ply_dek6kp.png"
                    alt="cart-banner"
                    className="w-full transition-all duration-[0.3s] ease-in-out"
                  />
                  <div className="detail w-full p-[15px] absolute left-[0] bottom-[0] bg-[#000000b3] flex flex-col">
                    <h4 className="font-Poppins text-[15px] mb-[5px] leading-[22px] font-light text-[#fff] tracking-[0.03rem]">
                      Couple &amp; Lamp
                    </h4>
                    <h3 className="font-quicksand font-semibold tracking-[0.03rem] text-[#fff] text-[22px] leading-[30px]">
                      Customize
                    </h3>
                    <Link
                      href="/category/lamps"
                      className="transition-all duration-[0.3s] ease-in-out w-[100px] mt-[15px] py-[5px] px-[10px] border-[1px] border-solid border-[#fff] rounded-[10px] text-[#fff] font-Poppins text-[15px] font-light leading-[28px] tracking-[0.03rem] flex items-center justify-center hover:bg-[#fff] hover:text-[#3d4750]"
                    >
                      Buy Now
                    </Link>
                  </div>
                </div>
              </div>
              <div className="bb-cart-banner mb-[24px]">
                <div className="banner rounded-[20px] relative overflow-hidden">
                  <img src="https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/aaabwgrbbmfnd6km1ksq_vpndun.jpg"
                    alt="cart-banner"
                    className="w-full transition-all duration-[0.3s] ease-in-out"
                  />
                  <div className="detail w-full p-[15px] absolute left-[0] bottom-[0] bg-[#000000b3] flex flex-col">
                    <h4 className="font-Poppins text-[15px] mb-[5px] leading-[22px] font-light text-[#fff] tracking-[0.03rem]">
                      Neon &amp; Light
                    </h4>
                    <h3 className="font-quicksand font-semibold tracking-[0.03rem] text-[#fff] text-[22px] leading-[30px]">
                      Customize
                    </h3>
                    <Link
                      href="/category/neon"
                      className="transition-all duration-[0.3s] ease-in-out w-[100px] mt-[15px] py-[5px] px-[10px] border-[1px] border-solid border-[#fff] rounded-[10px] text-[#fff] font-Poppins text-[15px] font-light leading-[28px] tracking-[0.03rem] flex items-center justify-center hover:bg-[#fff] hover:text-[#3d4750]"
                    >
                      Buy Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="min-[768px]:w-[58.33%] w-full px-[12px]">
            <div className="bb-inner-cart relative z-[9] flex flex-col h-full justify-between">
              <div className="bb-top-contact">
                <div className="bb-cart-title w-full mb-[20px] flex flex-wrap justify-between">
                  <h4 className="font-quicksand text-[18px] font-extrabold text-[#3d4750] tracking-[0.03rem] leading-[1.2]">
                    My cart
                  </h4>
                  {/* <a onClick={onClose} className="bb-cart-close transition-all duration-[0.3s] ease-in-out w-[16px] h-[20px] absolute top-[-20px] right-[0] bg-[#e04e4eb3] rounded-[10px] cursor-pointer" title="Close Cart" /> */}

                  <button
                    onClick={onClose}
                    title="Close Cart"
                    className="absolute -top-4 right-0 z-20 flex items-center justify-center w-10 h-10  text-red-500 transition-all duration-300"
                  >
                    <RiCloseLine size={24} className="text-rose-500 w-16 h-16" />
                  </button>
                </div>
              </div>
              <div className="bb-cart-box item h-full flex flex-col max-[767px]:justify-start">
                <ul className="bb-cart-items mb-[-24px]">

                  {items.length === 0 ? (
                    <li className="cart-sidebar-list mb-[24px] p-[20px] flex bg-[#f8f8fb] rounded-[20px] border-[1px] border-solid border-[#eee] relative max-[575px]:p-[10px]">
                      Your cart is empty
                    </li>
                  ) : (
                    items.map(item => (
                      <li className="cart-sidebar-list mb-[24px] p-[20px] flex bg-[#f8f8fb] rounded-[20px] border-[1px] border-solid border-[#eee] relative max-[575px]:p-[10px]" key={item._id}>
                        <button
                          // onClick={() => removeFromCart(item._id)}
                          onClick={() => !item.isGift && removeFromCart(item._id)}
                          disabled={item.isGift}
                          className="cart-remove-item transition-all duration-[0.3s] ease-in-out bg-[#3d4750] w-[20px] h-[20px] text-[#fff] absolute top-[-3px] right-[-3px] rounded-[50%] flex items-center justify-center opacity-[0.5] text-[15px]"
                        >
                          <i className="ri-close-line" />
                        </button>
                        <Link href={`/product-details/${item.slug}`}

                          className="bb-cart-pro-img flex grow-[1] shrink-[0] basis-[25%] items-center max-[575px]:flex-[initial]"
                        >
                          <Image
                            src={item.thumbnail.url}
                            alt={item.title}
                            width={100} height={100}
                            className="w-[85px] rounded-[10px] border-[1px] border-solid border-[#eee] max-[575px]:w-[50px]"
                          />
                        </Link>
                        <div className="bb-cart-contact pl-[15px] relative grow-[1] shrink-[0] basis-[70%] overflow-hidden">
                          {item.isGift ? (
                            <div className="mb-2">
                              <div className="font-medium text-[#3d4750] text-sm">
                                {item.title}
                              </div>

                              <button
                                onClick={() => setShowGiftModal(true)}
                                className="text-blue-500 underline text-xs mt-1"
                              >
                                Customize / Upload Photo
                              </button>

                            </div>
                          ) : (
                            <Link
                              href={`/product-details/${item.slug}`}
                              className="bb-cart-sub-title w-full mb-[8px] font-Poppins tracking-[0.03rem] text-[#3d4750] whitespace-nowrap overflow-hidden text-ellipsis block text-[14px] leading-[18px] font-medium"
                            >
                              <div dangerouslySetInnerHTML={{ __html: item.title }} />
                            </Link>
                          )}
                          {
                            item.price !== 0 &&
                            <p className="cart-price mb-[8px] text-[14px] leading-[18px] block font-Poppins text-[#686e7d] font-light tracking-[0.03rem]">
                              <span className="new-price px-[3px] text-[15px] leading-[18px] text-[#686e7d] font-bold">
                                {item?.price &&
                                  item?.discountType &&
                                  item?.discountPrice
                                  ? item.discountType === 'percentage'
                                    ? formatCurrency(
                                      item.price -
                                      (item.price * item.discountPrice) / 100
                                    )
                                    : formatCurrency(item.price - item.discountPrice)
                                  : ""
                                }
                              </span>

                              <span className="text-[15px] line-through">{formatCurrency(item.price)}</span>
                            </p>
                          }
                          {!item.isGift ? (
                            <div className="qty-plus-minus h-[28px] w-[85px] py-[7px] border-[1px] border-solid border-[#eee] overflow-hidden relative flex items-center justify-between bg-[#fff] rounded-[10px]">
                              <div className="dec bb-qtybtn" onClick={() => handleQuantityChange(item._id, item.quantity - 1)}>-</div>
                              <input
                                className="qty-input text-center"
                                type="text"
                                name="bb-qtybtn"
                                min="1"
                                readOnly
                                value={item.quantity}
                              />
                              <div className="inc bb-qtybtn" onClick={() => handleQuantityChange(item._id, item.quantity + 1)}>+</div>
                            </div>
                          ) : (
                            <div className="text-sm italic text-amber-700">Free gift</div>
                          )}
                        </div>
                      </li>
                    )))}
                </ul>
              </div>
              <div className="bb-bottom-cart">
                <div className="cart-sub-total mt-[20px] pb-[8px] flex flex-wrap justify-between border-t-[1px] border-solid border-[#eee]">
                  <table className="table cart-table mt-[10px] w-full align-top">
                    <tbody>
                      <tr>
                        <td className="title font-medium text-[#777] p-[.5rem]">
                          Sub-Total :
                        </td>
                        <td className="price text-[#777] text-right p-[.5rem] text-green-800">
                          <span className="text-[15px] line-through text-rose-600">{formatCurrency(totalPrice.totalPrice)}</span> {formatCurrency(totalPrice.discountPrice)}
                        </td>
                      </tr>
                      <tr>
                        <td className="title font-medium text-[#777] p-[.5rem]">
                          Shipping :
                        </td>
                        <td className="price text-[#777] text-right p-[.5rem]">
                          {totalPrice.shippingTotal > 0 ? `${formatCurrency(totalPrice.shippingTotal)}` : 'Free'}
                        </td>
                      </tr>
                      <tr>
                        <td className="title font-medium text-[#777] p-[.5rem]">
                          Total :
                        </td>
                        <td className="price text-right p-[.5rem] text-green-800">
                          {formatCurrency(totalPrice.discountPrice + totalPrice.shippingTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="cart-btn flex justify-between mb-[20px]">
                  {/* <button
                    onClick={cartPage}
                    className="bb-btn-1 transition-all duration-[0.3s] ease-in-out font-Poppins leading-[28px] tracking-[0.03rem] py-[5px] px-[15px] text-[14px] font-normal text-[#3d4750] bg-transparent rounded-[10px] border-[1px] border-solid border-[#3d4750] hover:bg-[#6c7fd8] hover:border-[#6c7fd8] hover:text-[#fff]"
                  >
                    View Cart
                  </button> */}
                  <button
                    onClick={checkoutPage}
                    className="w-full flex items-center justify-center bb-btn-2 transition-all duration-[0.3s] ease-in-out font-Poppins leading-[28px] tracking-[0.03rem] py-[10px] px-[20px] text-[18px] font-normal text-[#fff] bg-[#000000] rounded-[5px] border-[1px] border-solid border-[#000000] hover:bg-transparent hover:border-[#3d4750] hover:text-[#3d4750]"
                  >
                    CHECKOUT &nbsp;&nbsp;<Image src={"/img/shape/upi_options.svg"} alt="arrow" width={40} height={40} /> <RiArrowRightSLine className="text-[20px] ml-[5px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >


      {
        showMailModal && (
          // <CheckOutPopUp isOpen={showMailModal} onClose={() => setShowMailModal(false)} />
          <CheckOutPopUpV2 isOpen={showMailModal} onClose={() => setShowMailModal(false)} />
        )
      }
      {showGiftModal && (
        <GiftCustomizeModal onClose={() => setShowGiftModal(false)} />
      )}
    </>
  );
};

export default CartSidebar;
