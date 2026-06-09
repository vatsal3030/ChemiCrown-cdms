import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Package, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from '@/components/ui/button';

export default function Cart() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
          My Cart
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Review your selected products and proceed to checkout
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-4xl mx-auto px-4">
            Browse our catalog to find chemicals you need.
          </p>
          <Button onClick={() => navigate('/dashboard/catalog')} className="rounded-xl">
            Browse Catalog
          </Button>
        </div>
      ) : (
        // Stack on mobile, side-by-side on lg
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">

          {/* ── Cart Items (takes 2/3 on desktop) ── */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              {/* Card header */}
              <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Cart Items ({cartItems.length})
                </h3>
                <button
                  onClick={clearCart}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              </div>

              {/* Items list */}
              <div className="divide-y divide-border">
                {cartItems.map(item => (
                  <div key={item.product.id} className="px-4 py-3 sm:px-5 sm:py-4 flex gap-3 sm:gap-4 items-center">
                    {/* Product image */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-xl overflow-hidden shrink-0 border border-border">
                      {item.product.imageUrls?.length > 0 ? (
                        <img src={item.product.imageUrls[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="text-muted-foreground w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Name + price */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/dashboard/catalog/${item.product.id}`}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-bold text-sm text-primary">
                          ₹{item.product.price.toLocaleString('en-IN')}
                        </span>
                        {item.product.packageSize && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {item.product.packageSize} {item.product.unit}
                          </span>
                        )}
                      </div>
                      {/* Subtotal on mobile */}
                      <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                        Subtotal: ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Qty controls + delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden h-8">
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="w-7 h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Order Summary (sidebar on desktop, stacked on mobile) ── */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm">
              <h3 className="font-bold text-sm sm:text-base text-foreground mb-4">Order Summary</h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (18%)</span>
                  <span className="font-medium text-foreground">₹{Math.round(cartTotal * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-xs text-muted-foreground/70">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-border mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-foreground">Estimated Total</span>
                  <span className="text-xl font-extrabold text-primary">
                    ₹{Math.round(cartTotal * 1.18).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/dashboard/checkout')}
                className="w-full mt-5 rounded-xl"
              >
                Checkout <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>

              <div className="mt-3 text-center">
                <Link to="/dashboard/catalog" className="text-xs text-primary hover:underline font-medium">
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
