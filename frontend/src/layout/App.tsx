import Footer from '@/components/Footer';
import Header from '@/components/header/Header';
import AnnouncementBar from '@/components/AnnouncementBar';

import React, { ReactNode } from 'react'

interface LayoutProps {
    children: ReactNode;
}

const App = ({ children }: LayoutProps) => {
    return (
        <>
            <AnnouncementBar />
            <Header />
            {children}
            <Footer />
        </>
    )
}

export default App