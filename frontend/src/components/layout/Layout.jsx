import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
    <Sidebar />
    <Navbar />
    <main className="ml-[220px] pt-24 p-8">
      {children}
    </main>
  </div>
);

export default Layout;
