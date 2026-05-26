import { NextResponse } from 'next/server';
import { emptyProductStats } from '@/lib/adminFallbacks';
import { getAdminDb } from '@/lib/firebaseAdmin';

type ProductStatsDoc = {
  id: string;
  name_mn?: string;
  name?: string;
  stockQuantity?: number;
  category?: string;
};

export async function GET() {
  try {
    const db = getAdminDb();
    
    // Fetch products
    const productsSnap = await db.collection('products').get();
    const products = productsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ProductStatsDoc[];

    // Fetch recent orders for top products
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ordersSnap = await db.collection('orders')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const productSales = new Map<string, { quantity: number; revenue: number }>();
    
    ordersSnap.forEach(doc => {
      const order = doc.data();
      if (order.status !== 'cancelled' && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const pid = String(item.productId || '');
          const qty = Number(item.quantity || 0);
          const price = Number(item.price || 0);
          
          if (pid) {
            const current = productSales.get(pid) || { quantity: 0, revenue: 0 };
            productSales.set(pid, {
              quantity: current.quantity + qty,
              revenue: current.revenue + (qty * price)
            });
          }
        });
      }
    });

    // Compute top products
    const topProducts = Array.from(productSales.entries())
      .map(([id, stats]) => {
        const product: ProductStatsDoc = products.find(p => p.id === id) || { id, name_mn: 'Устгагдсан бараа' };
        return {
          id,
          name: product.name_mn || product.name || 'Тодорхойгүй',
          quantity: stats.quantity,
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Compute inventory stats
    const lowStockThreshold = 5;
    const lowStockProducts = products
      .filter(p => Number(p.stockQuantity || 0) > 0 && Number(p.stockQuantity || 0) <= lowStockThreshold)
      .map(p => ({
        id: p.id,
        name: p.name_mn || p.name || 'Тодорхойгүй',
        stock: Number(p.stockQuantity || 0)
      }));

    const outOfStockProducts = products
      .filter(p => Number(p.stockQuantity || 0) === 0)
      .map(p => ({
        id: p.id,
        name: p.name_mn || p.name || 'Тодорхойгүй',
        stock: Number(p.stockQuantity || 0)
      }));

    // Category breakdown
    const categoryBreakdown = new Map<string, number>();
    products.forEach(p => {
      const cat = p.category || 'other';
      categoryBreakdown.set(cat, (categoryBreakdown.get(cat) || 0) + 1);
    });

    const categories = Array.from(categoryBreakdown.entries()).map(([name, count]) => ({
      name,
      count
    }));

    return NextResponse.json({
      topProducts,
      lowStockProducts,
      outOfStockProducts,
      categories
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    return NextResponse.json(emptyProductStats());
  }
}
