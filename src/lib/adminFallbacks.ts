export function emptyAdminOrders(page = 1) {
  return {
    orders: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: page,
    statusCounts: {},
    summary: {
      totalOrders: 0,
      todayOrders: 0,
      pendingOrders: 0,
      confirmedRevenue: 0,
    },
    warning: 'Admin data is temporarily unavailable.',
  };
}

export function emptyAdminStats() {
  return {
    todayRevenue: 0,
    todayOrderCount: 0,
    pendingCount: 0,
    lowStockCount: 0,
    totalProducts: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    revenueChange: 0,
    warning: 'Admin data is temporarily unavailable.',
  };
}

export function emptyAdminAnalytics() {
  return {
    summary: {
      monthRevenue: 0,
      weekRevenue: 0,
      averageOrder: 0,
      paidOrderCount: 0,
      lowStockCount: 0,
      repeatCustomers: 0,
      customerValue: 0,
      totalCustomers: 0,
      productCount: 0,
      pendingPaymentCount: 0,
      pendingPaymentAmount: 0,
      expenseTracked: false,
    },
    revenueByDay: [],
    statusBreakdown: [],
    topProducts: [],
    inventoryRisk: [],
    productPerformance: [],
    warning: 'Admin data is temporarily unavailable.',
  };
}

export function emptyRevenueChart() {
  return {
    labels: [],
    revenue: [],
    orders: [],
    warning: 'Admin data is temporarily unavailable.',
  };
}

export function emptyProductStats() {
  return {
    topProducts: [],
    lowStockProducts: [],
    outOfStockProducts: [],
    categories: [],
    warning: 'Admin data is temporarily unavailable.',
  };
}

export function emptyAdminProducts(page = 1) {
  return {
    products: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: page,
    warning: 'Admin data is temporarily unavailable.',
  };
}

export function emptyAdminCustomers(page = 1) {
  return {
    customers: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: page,
    warning: 'Admin data is temporarily unavailable.',
  };
}

export function emptyAdminSettings() {
  return {
    storeName: 'UJ Cosmetic',
    freeShippingThreshold: 0,
    shippingCost: 0,
    notificationSettings: {},
    warning: 'Admin data is temporarily unavailable.',
  };
}
