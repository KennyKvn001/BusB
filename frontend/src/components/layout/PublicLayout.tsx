// src/components/layout/PublicLayout.tsx
import React from 'react';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showNavbar?: boolean;
  containerClassName?: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  showFooter = true,
  showNavbar = true,
  containerClassName = '',
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && <Navbar />}

      <main className={`flex-grow ${containerClassName}`}>
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
};

export default PublicLayout;