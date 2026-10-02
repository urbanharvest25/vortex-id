import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { StoreProvider, useStore } from './context/StoreContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { WhatsAppButton } from './components/WhatsAppButton.js';

// Customer Pages
import { HomePage } from './pages/HomePage.js';
import { ProductsPage } from './pages/ProductsPage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrdersPage } from './pages/OrdersPage.js';
import { InvoicePage } from './pages/InvoicePage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminProducts } from './pages/admin/AdminProducts.js';
import { AdminOrders } from './pages/admin/AdminOrders.js';
import { AdminCustomers } from './pages/admin/AdminCustomers.js';
import { AdminVouchers } from './pages/admin/AdminVouchers.js';
import { AdminDiscounts } from './pages/admin/AdminDiscounts.js';
import { AdminRatings } from './pages/admin/AdminRatings.js';
import { AdminAnalytics } from './pages/admin/AdminAnalytics.js';
import { AdminQris } from './pages/admin/AdminQris.js';
import { AdminEmail } from './pages/admin/AdminEmail.js';
import { AdminSettings } from './pages/admin/AdminSettings.js';
import { AdminAuditLog } from './pages/admin/AdminAuditLog.js';
import { AdminReset } from './pages/admin/AdminReset.js';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    () => new URLSearchParams(window.location.search)
  );

  const navigate = (to: string) => {
    const url = new URL(to, window.location.origin);
    window.history.pushState({}, '', to);
    setCurrentPath(url.pathname);
    setSearchParams(new URLSearchParams(url.search));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const isAdminRoute = currentPath.startsWith('/admin');

  // Match Dynamic Routes
  let activeComponent: React.ReactNode = null;

  if (isAdminRoute) {
    let adminContent: React.ReactNode = null;
    switch (currentPath) {
      case '/admin':
        adminContent = <AdminDashboard navigate={navigate} />;
        break;
      case '/admin/products':
        adminContent = <AdminProducts navigate={navigate} />;
        break;
      case '/admin/orders':
        adminContent = <AdminOrders navigate={navigate} />;
        break;
      case '/admin/customers':
        adminContent = <AdminCustomers />;
        break;
      case '/admin/vouchers':
        adminContent = <AdminVouchers />;
        break;
      case '/admin/discounts':
        adminContent = <AdminDiscounts />;
        break;
      case '/admin/ratings':
        adminContent = <AdminRatings />;
        break;
      case '/admin/analytics':
        adminContent = <AdminAnalytics />;
        break;
      case '/admin/qris':
        adminContent = <AdminQris />;
        break;
      case '/admin/email':
        adminContent = <AdminEmail />;
        break;
      case '/admin/settings':
        adminContent = <AdminSettings />;
        break;
      case '/admin/audit-log':
        adminContent = <AdminAuditLog />;
        break;
      case '/admin/reset':
        adminContent = <AdminReset />;
        break;
      default:
        adminContent = <AdminDashboard navigate={navigate} />;
        break;
    }

    return (
      <AdminLayout currentPath={currentPath} navigate={navigate}>
        {adminContent}
      </AdminLayout>
    );
  }

  // Customer Dynamic Route Matching
  if (currentPath === '/' || currentPath === '') {
    activeComponent = <HomePage navigate={navigate} />;
  } else if (currentPath === '/produk') {
    activeComponent = (
      <ProductsPage
        navigate={navigate}
        initialSearch={searchParams.get('search') || ''}
        initialGame={searchParams.get('game') || ''}
      />
    );
  } else if (currentPath.startsWith('/produk/')) {
    const prodId = currentPath.replace('/produk/', '');
    activeComponent = <ProductDetailPage productId={prodId} navigate={navigate} />;
  } else if (currentPath === '/checkout') {
    activeComponent = <CheckoutPage navigate={navigate} />;
  } else if (currentPath === '/pesanan') {
    activeComponent = <OrdersPage navigate={navigate} />;
  } else if (currentPath.startsWith('/invoice/')) {
    const invNum = currentPath.replace('/invoice/', '');
    activeComponent = <InvoicePage invoiceNumber={invNum} navigate={navigate} />;
  } else if (currentPath === '/profile') {
    activeComponent = <ProfilePage navigate={navigate} />;
  } else if (currentPath === '/login') {
    activeComponent = (
      <LoginPage navigate={navigate} redirectPath={searchParams.get('redirect') || undefined} />
    );
  } else if (currentPath === '/register') {
    activeComponent = <RegisterPage navigate={navigate} />;
  } else {
    // Fallback to Home if unknown route
    activeComponent = <HomePage navigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <Navbar currentPath={currentPath} navigate={navigate} />
      <main className="flex-1">{activeComponent}</main>
      <Footer navigate={navigate} />

      {/* Official Floating WhatsApp Contact Button */}
      <WhatsAppButton variant="floating" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
}
