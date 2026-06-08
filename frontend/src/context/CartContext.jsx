import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

/**
 * Cart is stored per-user in sessionStorage (tab-isolated).
 * Key format: chemicrown_cart_{userId}
 *
 * This ensures:
 * - Tab 1 (Customer A) and Tab 2 (Customer B) never share cart items ✅
 * - Cart clears automatically when the tab/browser closes ✅
 * - Admins/staff who have no CUSTOMER role will never see a cart ✅
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const cartKey = user?.id ? `chemicrown_cart_${user.id}` : null;

  const [cartItems, setCartItems] = useState([]);

  // Load cart when user changes (login / switch account)
  useEffect(() => {
    if (!cartKey) {
      setCartItems([]);
      return;
    }
    try {
      const saved = sessionStorage.getItem(cartKey);   // tab-isolated ✅
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch {
      setCartItems([]);
    }
  }, [cartKey]);

  // Persist cart whenever it changes
  useEffect(() => {
    if (!cartKey) return;
    sessionStorage.setItem(cartKey, JSON.stringify(cartItems)); // tab-isolated ✅
  }, [cartItems, cartKey]);

  const addToCart = (product, quantity = 1) => {
    if (!product?.id) return;
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + quantity > (product.inventory?.quantity || 0)) {
          toast.error(`Cannot add more. Only ${product.inventory?.quantity || 0} in stock.`);
          return prev;
        }
        toast.success(`Updated ${product.name} quantity in cart`);
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast.success(`Added ${product.name} to cart`);
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        if (newQuantity > (item.product.inventory?.quantity || 0)) {
          toast.error(`Cannot exceed stock limit of ${item.product.inventory?.quantity || 0}`);
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.product.price * item.quantity), 0
  );
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity,
      clearCart, cartTotal, cartCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
