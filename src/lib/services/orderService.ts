// Legacy service — redirects to the unified firestoreService.
// Kept for backwards compatibility with any admin pages that might import from here.
export {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} from './firestoreService';
