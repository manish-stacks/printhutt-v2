import Header from '@/components/admin/header/Header';
import { MainContent } from '@/components/admin/MainContent';
import { Sidebar } from '@/components/admin/sidebar/Sidebar';
import React, { ReactNode, useState } from 'react'

interface LayoutProps {
    children: ReactNode;
}

const Admin = ({ children }: LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <>

            <div className="ph-admin min-h-screen bg-[#f5f6fa] text-[#1f2433]">
                <Header isSidebarCollapsed={sidebarCollapsed} onMenuClick={() => setSidebarOpen(true)} />

                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onCollapsedChange={setSidebarCollapsed}
                />

                <MainContent isSidebarCollapsed={sidebarCollapsed}>
                    {children}
                </MainContent>
            </div>
        </>
    )
}

export default Admin