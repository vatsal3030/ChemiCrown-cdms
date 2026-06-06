import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Package, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from '@/components/ui/button';

export default function Cart() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-primary" /> My Cart
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Review your selected products and proceed to checkout
          </p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your cart is empty</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Looks like you haven't added any chemicals to your cart yet. Browse our catalog to find what you need.
          </p>
          <Button onClick={() => navigate('/dashboard/catalog')} size="lg" className="rounded-xl">
            Browse Catalog
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Cart Items ({cartItems.length})</h3>
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All
                </Button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cartItems.map(item => (
                  <div key={item.product.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                      {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                        <img src={item.product.imageUrls[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="text-slate-400 w-8 h-8" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link to={`/dashboard/catalog/${item.product.id}`} className="font-bold text-lg text-slate-900 dark:text-white hover:text-primary transition-colors line-clamp-1">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{item.product.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="font-bold text-primary">₹{item.product.price.toLocaleString('en-IN')}</span>
                        <span className="text-sm text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                          {item.product.packageSize} {item.product.unit}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900 dark:text-white">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>GST (18%)</span>
                  <span className="font-medium text-slate-900 dark:text-white">₹{(cartTotal * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Delivery</span>
                  <span className="text-xs text-muted-foreground self-center ml-2">(Calculated at checkout)</span>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">Total Estimate</span>
                    <span className="text-2xl font-bold text-primary">₹{(cartTotal * 1.18).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/dashboard/checkout')} 
                className="w-full mt-8 rounded-xl py-6 text-lg shadow-md hover:shadow-lg transition-all"
              >
                Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <div className="mt-4 text-center">
                <Link to="/dashboard/catalog" className="text-sm text-primary hover:underline font-medium">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
