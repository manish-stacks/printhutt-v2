import LoadingSpinner from '@/components/LoadingSpinner'
import React, { Suspense } from 'react'
import AdminUserCartPage from './AdminUserCartPage'

export default function CartPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AdminUserCartPage />
        </Suspense>
    )
}
