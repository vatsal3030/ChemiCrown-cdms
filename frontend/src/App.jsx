import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
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
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

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
import AddEmployeePage from './pages/admin/AddEmployeePage';
import EmployeeDetails from './pages/admin/EmployeeDetails';
import PayrollConfig from './pages/admin/PayrollConfig';
import AttendanceCalendar from './pages/admin/AttendanceCalendar';
import StockHistory from './pages/admin/StockHistory';
import StockHistoryDetails from './pages/admin/StockHistoryDetails';
import RecycleBin from './pages/admin/RecycleBin';
import Tasks from './pages/admin/Tasks';
import AssignTask from './pages/admin/AssignTask';
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
import PayrollDetails from './pages/admin/PayrollDetails';
import PayrollPaymentPage from './pages/admin/PayrollPaymentPage';
import OvertimeDetails from './pages/admin/OvertimeDetails';
import LeaveDetails from './pages/admin/LeaveDetails';
import IncentiveDetails from './pages/admin/IncentiveDetails';
import HolidayManagement from './pages/admin/HolidayManagement';
import Finance from './pages/admin/Finance';
import LogExpense from './pages/admin/LogExpense';
import LedgerDetails from './pages/admin/LedgerDetails';
import MyPayroll from './pages/employee/MyPayroll';
import TaskDetails from './pages/admin/TaskDetails';
import CustomerProfile from './pages/admin/CustomerProfile';
import Support from './pages/Support';
import ReportIssue from './pages/ReportIssue';
import AuditLog from './pages/admin/AuditLog';
import AuditLogDetails from './pages/admin/AuditLogDetails';
import TicketDashboard from './pages/admin/TicketDashboard';
import SupportTicketReview from './pages/admin/SupportTicketReview';
import NotFound from './pages/NotFound';

import { Toaster, ToastBar, toast as hotToast } from 'react-hot-toast';

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
            <ScrollToTop />
            <Toaster
              position="top-right"
              containerStyle={{ top: 70 }}
              toastOptions={{
                duration: 3000,
                style: { maxWidth: '340px', fontSize: '14px', cursor: 'pointer', paddingRight: '8px' },
                success: { duration: 3000 },
                error: { duration: 4500 },
              }}
            >
              {(t) => (
                <ToastBar toast={t}>
                  {({ icon, message }) => (
                    <div
                      className="flex items-start gap-2 w-full"
                      onClick={() => hotToast.dismiss(t.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {icon}
                      <span className="flex-1 text-sm">{message}</span>
                      {/* × dismiss button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); hotToast.dismiss(t.id); }}
                        style={{ color: '#9ca3af', marginLeft: '4px', lineHeight: 1, flexShrink: 0 }}
                        aria-label="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </ToastBar>
              )}
            </Toaster>
            <Routes>
              {/* Zone A: Public Website */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="catalog/:id" element={<ProductDetails />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="terms" element={<TermsOfService />} />
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
                    <Route path="customers/:id" element={<CustomerProfile />} />
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
                    <Route path="stock-history/:id" element={<StockHistoryDetails />} />
                  </Route>
                  
                  {/* Orders - accessible by multiple roles */}
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'CUSTOMER', 'MARKETING', 'DIGITAL_MARKETING']} />}>
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                  </Route>
                  
                  {/* Customer-style shopping routes — also accessible by in-company roles */}
                  <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'MARKETING', 'DIGITAL_MARKETING', 'INVENTORY_MANAGER']} />}>
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="wishlist" element={<Wishlist />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'INVENTORY_MANAGER', 'MARKETING', 'DIGITAL_MARKETING']} />}>
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="tasks/assign" element={<AssignTask />} />
                    <Route path="tasks/:id" element={<TaskDetails />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER']} />}>
                    <Route path="hr" element={<HRManagement />} />
                    <Route path="hr/add-employee" element={<AddEmployeePage />} />
                    <Route path="hr/:id" element={<EmployeeDetails />} />
                    <Route path="hr/attendance" element={<AttendanceCalendar />} />
                    <Route path="hr/payroll-config/:id" element={<PayrollConfig />} />
                    <Route path="payroll" element={<Payroll />} />
                    <Route path="payroll/:id" element={<PayrollDetails />} />
                    <Route path="payroll/pay/:id" element={<PayrollPaymentPage />} />
                    <Route path="hr/overtime/:id" element={<OvertimeDetails />} />
                    <Route path="hr/incentive/:id" element={<IncentiveDetails />} />
                    <Route path="hr/leaves/:id" element={<LeaveDetails />} />
                    <Route path="holidays" element={<HolidayManagement />} />
                  </Route>

                  {/* Finance — Owner & Super Admin Only */}
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER']} />}>
                    <Route path="finance" element={<Finance />} />
                    <Route path="finance/log-expense" element={<LogExpense />} />
                    <Route path="finance/ledger/:id" element={<LedgerDetails />} />
                  </Route>
                  
                  {/* Employees + Owner self-service */}
                  <Route element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'SALES', 'INVENTORY_MANAGER', 'MARKETING', 'DIGITAL_MARKETING']} />}>
                    <Route path="me" element={<MyAttendance />} />
                    <Route path="my-payroll" element={<MyPayroll />} />
                  </Route>

                  <Route path="settings" element={<Settings />} />
                  <Route path="notifications" element={<Notifications />} />
                  {/* Support & Issue Reporting — all authenticated users */}
                  <Route path="support" element={<Support />} />
                  <Route path="report-issue" element={<ReportIssue />} />
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER']} />}>
                    <Route path="tickets" element={<TicketDashboard />} />
                    <Route path="tickets/:id" element={<SupportTicketReview />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER']} />}>
                    <Route path="audit-log" element={<AuditLog />} />
                    <Route path="audit-log/:id" element={<AuditLogDetails />} />
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
