import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function ReviewModal({ isOpen, onClose, orderItem, token, onSuccess, existingReview }) {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [fetchedReview, setFetchedReview] = useState(existingReview || null);
  const isEdit = !!fetchedReview;

  useEffect(() => {
    if (isOpen && orderItem && !existingReview) {
      fetch(`${import.meta.env.VITE_API_URL}/api/reviews/my/${orderItem.product.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.review) {
          setFetchedReview(data.review);
          setRating(data.review.rating);
          setComment(data.review.comment || '');
        }
      })
      .catch(() => {});
    }
  }, [isOpen, orderItem, existingReview, token]);

  if (!isOpen || !orderItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: orderItem.product.id,
          orderId: orderItem.orderId,
          rating,
          comment
        })
      });

      const json = await res.json();
      
      if (res.ok) {
        toast.success(json.isEdit ? 'Review updated successfully!' : 'Review submitted successfully!');
        if (onSuccess) onSuccess(json.isEdit);
        onClose();
      } else {
        toast.error(json.message || json.error || 'Failed to submit review');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border flex justify-between items-center bg-muted/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {isEdit ? 'Edit Your Review' : 'Write a Review'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
            <div className="w-16 h-16 bg-card rounded-lg overflow-hidden border border-border">
              {orderItem.product.imageUrls && orderItem.product.imageUrls.length > 0 ? (
                <img src={orderItem.product.imageUrls[0]} alt={orderItem.product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-slate-300">
                  No Image
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-50 line-clamp-1">{orderItem.product.name}</p>
              <p className="text-sm text-slate-500">Ordered on {new Date(orderItem.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block text-center">How would you rate this product?</label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 rounded-full transition-transform hover:scale-110 focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`}
                >
                  <Star className={`w-10 h-10 ${star <= rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Share your experience (Optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              className="w-full h-32 px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : isEdit ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
