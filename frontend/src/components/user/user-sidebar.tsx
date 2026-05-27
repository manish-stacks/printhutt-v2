import { useUserStore } from '@/store/useUserStore';
import Link from 'next/link';
// import { useRouter } from 'next/navigation';
import React from 'react'
import { RiBankCard2Fill, RiHeart2Fill, RiHome2Fill, RiLogoutCircleRFill, RiMap2Fill, RiMessage2Fill, RiShoppingCartFill, RiStarHalfFill, RiUser2Fill } from 'react-icons/ri'
import { toast } from 'react-toastify';


interface Props {
    activemenu: string;
}
const UserSidebar = ({ activemenu }: Props) => {

    // const router = useRouter();
    const logoutStore = useUserStore((state) => state.logout);

    const logOut = async () => {
        await logoutStore();
        toast("logout successfully");
        // return router.push("/login");
        window.localStorage.removeItem('user-store');
        window.location.reload();
    };

    return (
        <>
            <aside className="w-full bg-white p-4 shadow-md border rounded-lg">

                <div className="text-center mb-6">
                    <h2 className="text-lg font-semibold">Welcome</h2>
                </div>

                <nav className="flex flex-col space-y-2 text-sm sm:text-base">

                    <Link href="/user/dashboard"
                        className={`flex items-center p-2 rounded-md hover:bg-purple-50 ${activemenu == 'dashboard'
                                ? 'text-purple-600 font-semibold bg-purple-50'
                                : 'text-gray-600'
                            }`}
                    >
                        <RiHome2Fill className="mr-2" />
                        Dashboard
                    </Link>

                    <Link href="/user/profile"
                        className={`flex items-center p-2 rounded-md hover:bg-purple-50 ${activemenu == 'profile'
                                ? 'text-purple-600 font-semibold bg-purple-50'
                                : 'text-gray-600'
                            }`}
                    >
                        <RiUser2Fill className="mr-2" />
                        My Profile
                    </Link>

                    <Link href="/user/address"
                        className={`flex items-center p-2 rounded-md hover:bg-purple-50 ${activemenu == 'address'
                                ? 'text-purple-600 font-semibold bg-purple-50'
                                : 'text-gray-600'
                            }`}
                    >
                        <RiMap2Fill className="mr-2" />
                        My Address
                    </Link>

                    <Link href="/wishlist"
                        className={`flex items-center p-2 rounded-md hover:bg-purple-50 ${activemenu == 'wishlist'
                                ? 'text-purple-600 font-semibold bg-purple-50'
                                : 'text-gray-600'
                            }`}
                    >
                        <RiHeart2Fill className="mr-2" />
                        Wishlist
                    </Link>

                    <Link href="/user/orders"
                        className={`flex items-center p-2 rounded-md hover:bg-purple-50 ${activemenu == 'orders'
                                ? 'text-purple-600 font-semibold bg-purple-50'
                                : 'text-gray-600'
                            }`}
                    >
                        <RiShoppingCartFill className="mr-2" />
                        Order History
                    </Link>

                </nav>

                <div className="mt-6 border-t pt-4">
                    <button
                        onClick={logOut}
                        className="flex items-center text-gray-600 hover:text-purple-600"
                    >
                        <RiLogoutCircleRFill className="mr-2" />
                        Log-out
                    </button>
                </div>

            </aside>
        </>
    )
}

export default UserSidebar