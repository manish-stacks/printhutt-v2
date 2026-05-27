import { FaBroom, FaCartPlus, FaGifts, FaHome, FaLayerGroup, FaRssSquare, FaStar, FaTag, FaTasks, FaUsers } from "react-icons/fa";
import { RiLuggageCartFill, RiReceiptFill } from "react-icons/ri";


export const menuItems = {
  categories: [
    { id: 'categories', label: 'Categories', path: '/admin/categories' },
    { id: 'sub-categories', label: 'Sub Categories', path: '/admin/sub-categories' },
  ],
  subcategories: [
    { id: 'categories', label: 'Categories', path: '/admin/sub-categories' },
    { id: 'addcategories', label: 'Add Categories', path: '/admin/sub-categories/add' },
  ],
  products: [
    { id: 'products-list', label: 'Products List', path: '/admin/products' },
    { id: 'add-product', label: 'Add Product', path: '/admin/products/new' },
    { id: 'product-reviews', label: 'Product Reviews', path: '/admin/product-reviews' },
  ],
  ecommerce: [
    { id: 'warranty', label: 'Warranty', path: '/admin/warranty' },
    { id: 'shipping', label: 'Shipping', path: '/admin/shipping' },
    { id: 'return', label: 'Return', path: '/admin/return-policy' },
    { id: 'offers', label: 'Offers', path: '/admin/offers' },
    { id: 'coupons', label: 'Coupons', path: '/admin/coupons' },
  ],
  orders: [
    { id: 'all-orders', label: 'All Orders', path: '/admin/orders?status=all' },
    { id: 'confirmed-orders', label: 'Confirmed', path: '/admin/orders?status=confirmed' },
    { id: 'pending-orders', label: 'Pending', path: '/admin/orders?status=pending' },
    { id: 'shipped-orders', label: 'Shipped', path: '/admin/orders?status=shipped' },
    { id: 'delivered-orders', label: 'Delivered', path: '/admin/orders?status=delivered' },
    { id: 'refunded-orders', label: 'RTO', path: '/admin/orders?status=refunded' },
  ],
  blog: [
    { id: 'blog-categories', label: 'Categories', path: '/admin/blog-categories' },
    { id: 'blogs', label: 'Blogs', path: '/admin/blogs' },
  ],
  manageGift: [
    { id: 'personalized-gifts', label: 'Personalized Gifts', path: '/admin/personalized-gifts' }
  ],
  manageSite: [
    { id: 'slider', label: 'Slider', path: '/admin/hero-banner' },
    { id: 'testimonials', label: 'Testimonials', path: '/admin/testimonials' },
    // { id: 'banner', label: 'Banner', path: '/admin/banner' },
  ]
};
// Ecommerce
export const mainMenuItems = [
  {
    id: 'dashboard',
    icon: FaHome,
    label: 'Dashboard',
    path: '/admin/dashboard',
  },
  {
    id: 'categories',
    icon: FaTag,
    label: 'Categories',
    submenu: menuItems.categories,
  },
  {
    id: 'products',
    icon: FaLayerGroup,
    label: 'Products',
    submenu: menuItems.products,
  },

  {
    id: 'orders',
    icon: RiLuggageCartFill,
    label: 'Manage Orders',
    submenu: menuItems.orders,
  },
  {
    id: 'ecommerce',
    icon: RiReceiptFill,
    label: 'Ecommerce',
    submenu: menuItems.ecommerce,
  },
  {
    id: 'blog',
    icon: FaRssSquare,
    label: 'Blog',
    submenu: menuItems.blog,
  },
  {
    id: 'personalized-gifts',
    icon: FaGifts,
    label: 'Personalized Gifts',
    submenu: menuItems.manageGift,
  },
  {
    id: 'Cart',
    icon: FaCartPlus,
    label: 'User Cart',
    path: '/admin/se_cart',
  },
  {
    id: 'manage-site',
    icon: FaTasks,
    label: 'Manage Site',
    submenu: menuItems.manageSite,
  },
  {
    id: 'customer',
    icon: FaUsers,
    label: 'Customer List',
    path: '/admin/customer-list',
  },
  {
    id: 'reviews',
    icon: FaStar,
    label: 'Product Reviews',
    path: '/admin/product-reviews',
  },
  // {
  //   id: 'page',
  //   icon: FaBook,
  //   label: 'Manages Pages',
  //   path: '/admin/manage-page',
  // },
  // {
  //   id: 'transactions',
  //   icon: FaRandom,
  //   label: 'Transactions',
  //   path: '/admin/transactions',
  // },
  {
    id: 'cache-clear',
    icon: FaBroom,
    label: 'Cache Clear',
    path: '/admin/cache-clear',
  },

];

