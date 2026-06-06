import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('chemicrown_cart');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        setCartItems([]);
      }
    }
  }, []);

  // Save to local storage whenever cart changes
  useEffect(() => {
    localStorage.setItem('chemicrown_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    if (!product || !product.id) return;
    
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        // Check inventory limit
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

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
