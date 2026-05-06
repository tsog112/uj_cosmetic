import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Order } from '../../types';

export const adminService = {
  /**
   * Calculate total sales revenue from all 'paid' and 'shipped' orders.
   */
  async calculateTotalSales(): Promise<number> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', 'in', ['paid', 'shipped'])
      );
      const querySnapshot = await getDocs(q);
      
      let totalSales = 0;
      querySnapshot.forEach((doc) => {
        const order = doc.data() as Order;
        totalSales += order.total;
      });
      
      return totalSales;
    } catch (error) {
      console.error('Error calculating total sales:', error);
      throw error;
    }
  },

  /**
   * Calculate total sales revenue for a specific time period.
   */
  async calculateSalesByPeriod(startDate: Date, endDate: Date): Promise<number> {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      const q = query(
        collection(db, 'orders'),
        where('status', 'in', ['paid', 'shipped']),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );
      
      const querySnapshot = await getDocs(q);
      
      let periodSales = 0;
      querySnapshot.forEach((doc) => {
        const order = doc.data() as Order;
        periodSales += order.total;
      });
      
      return periodSales;
    } catch (error) {
      console.error('Error calculating period sales:', error);
      throw error;
    }
  },

  /**
   * Get products that are running low on stock (stock <= threshold).
   * Default threshold is 5 units.
   */
  async getInventoryAlerts(threshold: number = 5): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('stock', '<=', threshold)
      );
      
      const querySnapshot = await getDocs(q);
      const lowStockProducts: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        lowStockProducts.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      return lowStockProducts;
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      throw error;
    }
  }
};
