import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Catalog from './pages/Catalog';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import CustomerVerification from './pages/admin/CustomerVerification';
import HRManagement from './pages/admin/HRManagement';
import MyAttendance from './pages/employee/MyAttendance';
import Orders from './pages/customer/Orders';
import Checkout from './pages/customer/Checkout';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

import { Toaster } from 'react-hot-toast';

function DynamicTitle() {
  const location = useLocation();
  
  useEffect(() => {
    const path = location.pathname;
    let title = 'ChemiCrown CDMS';
    
    if (path === '/') title = 'Home | ChemiCrown CDMS';
    else if (path === '/about') title = 'About Us | ChemiCrown CDMS';
    else if (path === '/contact') title = 'Contact | ChemiCrown CDMS';
    else if (path === '/login') title = 'Log in | ChemiCrown CDMS';
    else if (path === '/register') title = 'Register | ChemiCrown CDMS';
    else if (path.startsWith('/dashboard')) {
      const subpath = path.replace('/dashboard', '');
      if (subpath === '') title = 'Dashboard | ChemiCrown CDMS';
      else if (subpath === '/catalog') title = 'Catalog | ChemiCrown CDMS';
      else if (subpath === '/inventory') title = 'Inventory | ChemiCrown CDMS';
      else if (subpath === '/orders') title = 'Orders | ChemiCrown CDMS';
      else if (subpath === '/hr') title = 'HR Management | ChemiCrown CDMS';
      else if (subpath === '/me') title = 'My Attendance | ChemiCrown CDMS';
      else if (subpath === '/settings') title = 'Settings | ChemiCrown CDMS';
      else if (subpath === '/verify') title = 'Verify Customers | ChemiCrown CDMS';
      else if (subpath === '/checkout') title = 'Checkout | ChemiCrown CDMS';
      else if (subpath === '/notifications') title = 'Notifications | ChemiCrown CDMS';
    }
    
    document.title = title;
  }, [location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <DynamicTitle />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <Routes>
        {/* Zone A: Public Website */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Zone B: Dashboard / App Shell (Protected) */}
        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'SALES', 'CUSTOMER']} />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            
            {/* Super Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="verify" element={<CustomerVerification />} />
            </Route>

            {/* Admin & Manager */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER']} />}>
              <Route path="inventory" element={<Inventory />} />
              <Route path="hr" element={<HRManagement />} />
            </Route>
            
            {/* Employees */}
            <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'SALES']} />}>
              <Route path="me" element={<MyAttendance />} />
            </Route>

            <Route path="catalog" element={<Catalog />} />
            <Route path="orders" element={<Orders />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
