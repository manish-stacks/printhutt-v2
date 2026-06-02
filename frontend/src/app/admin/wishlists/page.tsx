import LoadingSpinner from '@/components/LoadingSpinner'
import React, { Suspense } from 'react'
import AdminWishlistsPage from './AdminWishlistsPage'

export default function Wishlists() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AdminWishlistsPage />
        </Suspense>
    )
}
