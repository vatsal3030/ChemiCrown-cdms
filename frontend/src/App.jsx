import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';
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
import ProductFormPage from './pages/admin/ProductFormPage';
import CustomerVerification from './pages/admin/CustomerVerification';
import HRManagement from './pages/admin/HRManagement';
import EmployeeDetails from './pages/admin/EmployeeDetails';
import StockHistory from './pages/admin/StockHistory';
import RecycleBin from './pages/admin/RecycleBin';
import Tasks from './pages/admin/Tasks';
import MyAttendance from './pages/employee/MyAttendance';
import Orders from './pages/customer/Orders';
import OrderDetails from './pages/customer/OrderDetails';
import Checkout from './pages/customer/Checkout';
import Wishlist from './pages/customer/Wishlist';
import Cart from './pages/customer/Cart';
import ProductDetails from './pages/ProductDetails';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Payroll from './pages/admin/Payroll';
import Finance from './pages/admin/Finance';
import MyPayroll from './pages/employee/MyPayroll';
import Support from './pages/Support';
import ReportIssue from './pages/ReportIssue';
import AuditLog from './pages/admin/AuditLog';
import TicketDashboard from './pages/admin/TicketDashboard';
import HolidayManagement from './pages/admin/HolidayManagement';
import NotFound from './pages/NotFound';

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
      else if (subpath.startsWith('/catalog/')) title = 'Product Details | ChemiCrown CDMS';
      else if (subpath === '/inventory') title = 'Inventory | ChemiCrown CDMS';
      else if (subpath === '/orders') title = 'Orders | ChemiCrown CDMS';
      else if (subpath.startsWith('/orders/')) title = 'Order Details | ChemiCrown CDMS';
      else if (subpath === '/hr') title = 'HR Management | ChemiCrown CDMS';
      else if (subpath === '/recycle-bin') title = 'Recycle Bin | ChemiCrown CDMS';
      else if (subpath === '/tasks') title = 'Tasks | ChemiCrown CDMS';
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
      <CartProvider>
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
                <Route path="catalog/:id" element={<ProductDetails />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
              </Route>

              {/* Zone B: Dashboard / App Shell (Protected) */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'CUSTOMER', 'MARKETING', 'DIGITAL_MARKETING', 'INVENTORY_MANAGER']} />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="catalog" element={<Catalog />} />
                  <Route path="catalog/:id" element={<ProductDetails />} />
                  
                  {/* Super Admin & Owner Only */}
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER']} />}>
                    <Route path="verify" element={<CustomerVerification />} />
                  </Route>

                  {/* Super Admin, Owner, & Manager */}
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER']} />}>
                    <Route path="recycle-bin" element={<RecycleBin />} />
                  </Route>

                  {/* Admin & Manager */}
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER']} />}>
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="inventory/product/new" element={<ProductFormPage />} />
                    <Route path="inventory/product/:id" element={<ProductFormPage />} />
                    <Route path="stock-history" element={<StockHistory />} />
                  </Route>
                  
                  {/* Orders - accessible by multiple roles */}
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'CUSTOMER', 'MARKETING', 'DIGITAL_MARKETING']} />}>
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                  </Route>
                  
                  {/* Customer Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="wishlist" element={<Wishlist />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'INVENTORY_MANAGER', 'MARKETING', 'DIGITAL_MARKETING']} />}>
                    <Route path="tasks" element={<Tasks />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER']} />}>
                    <Route path="hr" element={<HRManagement />} />
                    <Route path="hr/:id" element={<EmployeeDetails />} />
                    <Route path="payroll" element={<Payroll />} />
                    <Route path="holidays" element={<HolidayManagement />} />
                  </Route>

                  {/* Finance — Owner & Super Admin Only */}
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER']} />}>
                    <Route path="finance" element={<Finance />} />
                  </Route>
                  
                  {/* Employees */}
                  <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'SALES', 'INVENTORY_MANAGER', 'MARKETING', 'DIGITAL_MARKETING']} />}>
                    <Route path="me" element={<MyAttendance />} />
                    <Route path="my-payroll" element={<MyPayroll />} />
                  </Route>

                  <Route path="settings" element={<Settings />} />
                  <Route path="notifications" element={<Notifications />} />
                  {/* Support & Issue Reporting — all authenticated users */}
                  <Route path="support" element={<Support />} />
                  <Route path="report-issue" element={<ReportIssue />} />
                  {/* Audit Logs & Ticket Dashboard — SUPER_ADMIN & OWNER only */}
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER']} />}>
                    <Route path="tickets" element={<TicketDashboard />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER']} />}>
                    <Route path="audit-log" element={<AuditLog />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-All 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
