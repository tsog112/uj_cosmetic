import { Prisma } from '@prisma/client';
import { emptyAdminAnalytics, emptyAdminStats, emptyProductStats } from '@/lib/adminFallbacks';
import { LOW_STOCK_THRESHOLD } from '@/lib/constants/admin';
import { prisma } from '@/lib/prisma';
import { cached, invalidateCache } from '@/lib/serverCache';
import { normalizeOrderStatus, parseProductImages } from '@/lib/services/firestoreAdminService';

const PAID_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

function productImageJson(images: unknown) {
  if (Array.isArray(images)) return images;
  return parseProductImages(images);
}

function cleanText(value: unknown) {
  if (typeof value !== 'string') return '';
  if (!/[ÐÑÒÓ]/.test(value)) return value;
  try {
    return Buffer.from(value, 'latin1').toString('utf8');
  } catch {
    return value;
  }
}

function toProductDto(product: any) {
  const images = productImageJson(product.images);
  return {
    id: product.id,
    slug: product.slug,
    name: cleanText(product.nameMn || product.name),
    brand: cleanText(product.brand) || null,
    description: cleanText(product.descriptionMn || product.description) || null,
    ingredients: cleanText(product.ingredients) || null,
    howToUse: cleanText(product.howToUse) || null,
    price: Number(product.price || 0),
    salePrice: product.salePrice == null ? null : Number(product.salePrice),
    costPrice: product.costPrice == null ? null : Number(product.costPrice),
    stock: Number(product.stockQuantity ?? product.stock ?? 0),
    lowStockThreshold: Number(product.lowStockThreshold ?? LOW_STOCK_THRESHOLD),
    isVisible: product.isVisible !== false && product.published !== false,
    isFeatured: Boolean(product.featured),
    featuredSince: product.featuredSince ?? null,
    featuredUntil: product.featuredUntil ?? null,
    featuredPosition: product.featuredPosition === 'category' || product.featuredPosition === 'both' ? product.featuredPosition : 'home',
    showFeaturedBadge: product.showFeaturedBadge !== false,
    showOnHome: Boolean(product.showOnHome),
    showcaseFeatured: Boolean(product.showcaseFeatured),
    showcaseNewest: Boolean(product.showcaseNewest),
    showcaseSale: Boolean(product.showcaseSale),
    images,
    categoryId: product.categoryId,
    category: product.category ? { name: cleanText(product.category.nameMn || product.category.name) } : undefined,
    views: Number(product.views || 0),
    orderCount: Number(product.orderCount || 0),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function toPublicProductDto(product: any) {
  const images = productImageJson(product.images);
  const stock = Number(product.stockQuantity ?? product.stock ?? 0);
  return {
    id: product.id,
    slug: product.slug,
    name_mn: cleanText(product.nameMn || product.name),
    name_en: cleanText(product.nameEn),
    price: Number(product.price || 0),
    salePrice: product.salePrice == null ? null : Number(product.salePrice),
    saleEndDate: product.saleEndDate || null,
    category: product.category?.slug || product.categoryId || 'other',
    images,
    videoUrl: product.videoUrl || null,
    description_mn: cleanText(product.descriptionMn || product.description),
    ingredients: cleanText(product.ingredients),
    howToUse: cleanText(product.howToUse),
    featured: Boolean(product.featured),
    showcaseFeatured: Boolean(product.showcaseFeatured ?? product.featured),
    showcaseNewest: Boolean(product.showcaseNewest),
    showcaseSale: Boolean(product.showcaseSale),
    published: product.published !== false && product.isVisible !== false,
    inStock: stock > 0,
    stockQuantity: stock,
    views: Number(product.views || 0),
    orderCount: Number(product.orderCount || 0),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function toOrderDto(order: any) {
  const addressSnapshot = order.addressSnapshot || null;
  return {
    id: order.id,
    orderNumber: order.orderNumber || `#${order.createdAt.getFullYear()}-${order.id.slice(0, 4).toUpperCase()}`,
    userId: order.userId || null,
    customerName: cleanText(order.customerName || order.user?.name),
    customerPhone: order.customerPhone || order.phone || '',
    customerEmail: order.customerEmail || order.user?.email || '',
    shippingAddress: cleanText(order.shippingAddress || addressSnapshot?.full_address || addressSnapshot?.full),
    addressSnapshot,
    addressWarning: !addressSnapshot ? 'Хаяг тодорхойгүй' : '',
    market: order.market || 'MN',
    currency: order.currency || 'MNT',
    total: Number(order.total || 0),
    subtotal: Number(order.subtotal || order.total || 0),
    shippingCost: Number(order.shippingCost || 0),
    status: normalizeOrderStatus(order.status),
    items: (order.items || []).map((item: any, index: number) => {
      const images = productImageJson(item.product?.images);
      return {
        id: item.id || `${order.id}-item-${index}`,
        productId: item.productId,
        productSlug: item.product?.slug || '',
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        imageUrl: item.imageUrl || images[0] || '',
        product: {
          name: cleanText(item.name || item.product?.nameMn || item.product?.name),
          images,
          price: Number(item.product?.price || item.price || 0),
        },
      };
    }),
    user: order.user ? { name: order.user.name || '', phone: order.user.phone || '' } : null,
    archived: Boolean(order.archived),
    archivedAt: order.archivedAt || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function listPostgresPublicProducts(filters: {
  slug?: string | null;
  category?: string | null;
  featured?: string | null;
  page?: string | null;
  limit?: string | null;
}) {
  return cached(`public-products:${JSON.stringify(filters)}`, 60_000, async () => {
    const where: Prisma.ProductWhereInput = {
      published: true,
      isVisible: true,
      ...(filters.slug ? { slug: filters.slug } : {}),
      ...(filters.featured === 'true' ? { featured: true } : {}),
      ...(filters.category && filters.category !== 'all' ? { category: { slug: filters.category } } : {}),
    };
    const page = Math.max(1, parseInt(filters.page || '1', 10) || 1);
    const limit = Math.max(1, parseInt(filters.limit || '12', 10) || 12);
    const shouldPaginate = Boolean(filters.page || filters.limit);

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
        ...(shouldPaginate ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map(toPublicProductDto),
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: shouldPaginate ? page : 1,
    };
  });
}

export async function listPostgresAdminProducts(filters?: {
  category?: string;
  inStock?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  visibility?: string;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const sortBy = filters?.sortBy || 'newest';
  const sortDir = filters?.sortDir === 'asc' ? 'asc' : 'desc';
  const where: Prisma.ProductWhereInput = {
    ...(filters?.category && filters.category !== 'all' ? { categoryId: filters.category } : {}),
    ...(filters?.visibility === 'visible'
      ? { isVisible: true, published: true }
      : filters?.visibility === 'hidden'
        ? { OR: [{ isVisible: false }, { published: false }] }
        : {}),
    ...(filters?.inStock === 'inStock' || filters?.inStock === 'true' ? { stock: { gt: 0 } } : {}),
    ...(filters?.inStock === 'empty' || filters?.inStock === 'outOfStock' || filters?.inStock === 'false' ? { stock: 0 } : {}),
    ...(filters?.inStock === 'low' || filters?.inStock === 'lowStock' ? { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } : {}),
    ...(filters?.search ? {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { nameMn: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
      ],
    } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortBy === 'orders'
      ? { orderCount: sortDir }
      : sortBy === 'name'
        ? { nameMn: sortDir }
        : sortBy === 'stock'
          ? { stock: sortDir }
          : { createdAt: sortDir };

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map(toProductDto),
    totalCount,
    totalPages: Math.ceil(totalCount / limit) || 1,
    currentPage: page,
  };
}

function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `product-${Date.now()}`;
}

export async function getPostgresAdminProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  return product ? toProductDto(product) : null;
}

function buildPostgresProductUpdate(body: Record<string, unknown>, existing: { price: number; slug: string }) {
  const data: Prisma.ProductUpdateInput = { updatedAt: new Date() };
  const name = String(body.name || '').trim();

  if (name) {
    data.name = name;
    data.nameMn = name;
  }
  if (body.brand !== undefined) {
    data.brand = body.brand ? String(body.brand) : null;
    data.nameEn = body.brand ? String(body.brand) : name || undefined;
  }
  if (body.description !== undefined) {
    data.description = String(body.description);
    data.descriptionMn = String(body.description);
  }
  if (body.ingredients !== undefined) data.ingredients = String(body.ingredients);
  if (body.howToUse !== undefined) data.howToUse = String(body.howToUse);
  if (body.price !== undefined) data.price = parseFloat(String(body.price)) || 0;
  if (body.salePrice !== undefined) {
    data.salePrice = body.salePrice === null || body.salePrice === '' ? null : Number(body.salePrice);
  }
  if (body.costPrice !== undefined) {
    data.costPrice = body.costPrice === null || body.costPrice === '' ? null : Number(body.costPrice);
  }
  if (body.saleUntil) data.saleEndDate = new Date(String(body.saleUntil));
  if (body.slug) data.slug = String(body.slug).trim() || existing.slug;
  if ('stock' in body) {
    const stock = Math.max(0, parseInt(String(body.stock ?? '0'), 10) || 0);
    data.stock = stock;
    data.stockQuantity = stock;
  }
  if ('isVisible' in body) {
    const isVisible = Boolean(body.isVisible);
    data.isVisible = isVisible;
    data.published = isVisible;
  }
  if ('isFeatured' in body) {
    const isFeatured = Boolean(body.isFeatured);
    data.featured = isFeatured;
    if (!isFeatured) {
      data.featuredSince = null;
      data.featuredUntil = null;
    }
  }
  if ('featuredSince' in body) data.featuredSince = body.featuredSince ? new Date(String(body.featuredSince)) : null;
  if ('featuredUntil' in body) data.featuredUntil = body.featuredUntil ? new Date(String(body.featuredUntil)) : null;
  if ('featuredPosition' in body) {
    const pos = String(body.featuredPosition || 'home');
    data.featuredPosition = pos === 'category' || pos === 'both' ? pos : 'home';
  }
  if ('showFeaturedBadge' in body) data.showFeaturedBadge = Boolean(body.showFeaturedBadge);
  if ('showOnHome' in body) data.showOnHome = Boolean(body.showOnHome);
  if ('showcaseFeatured' in body) data.showcaseFeatured = Boolean(body.showcaseFeatured);
  if ('showcaseNewest' in body) data.showcaseNewest = Boolean(body.showcaseNewest);
  if ('showcaseSale' in body) data.showcaseSale = Boolean(body.showcaseSale);
  if ('lowStockThreshold' in body) {
    data.lowStockThreshold = Math.max(0, parseInt(String(body.lowStockThreshold ?? LOW_STOCK_THRESHOLD), 10) || LOW_STOCK_THRESHOLD);
  }
  if ('images' in body) data.images = productImageJson(body.images) as Prisma.InputJsonValue;
  if (body.categoryId) data.category = { connect: { id: String(body.categoryId) } };

  return data;
}

export async function upsertPostgresAdminProduct(id: string, body: Record<string, unknown>) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return null;

  const product = await prisma.product.update({
    where: { id },
    data: buildPostgresProductUpdate(body, { price: Number(existing.price || 0), slug: existing.slug }),
    include: { category: true },
  });
  invalidatePostgresAdminCache();
  return toProductDto(product);
}

export async function createPostgresAdminProduct(body: Record<string, unknown>) {
  const name = String(body.name || '').trim();
  const categoryId = String(body.categoryId || '');
  if (!name || !categoryId) return null;

  const stock = Math.max(0, parseInt(String(body.stock ?? '0'), 10) || 0);
  const slug = String(body.slug || '').trim() || slugifyProductName(name);
  const isFeatured = Boolean(body.isFeatured);

  const product = await prisma.product.create({
    data: {
      slug,
      name,
      nameMn: name,
      nameEn: body.brand ? String(body.brand) : name,
      brand: body.brand ? String(body.brand) : null,
      description: body.description ? String(body.description) : '',
      descriptionMn: body.description ? String(body.description) : '',
      ingredients: body.ingredients ? String(body.ingredients) : '',
      howToUse: body.howToUse ? String(body.howToUse) : '',
      price: parseFloat(String(body.price ?? '0')) || 0,
      salePrice: body.salePrice ? parseFloat(String(body.salePrice)) : null,
      costPrice: body.costPrice ? parseFloat(String(body.costPrice)) : null,
      saleEndDate: body.saleUntil ? new Date(String(body.saleUntil)) : null,
      stock,
      stockQuantity: stock,
      lowStockThreshold: parseInt(String(body.lowStockThreshold ?? LOW_STOCK_THRESHOLD), 10) || LOW_STOCK_THRESHOLD,
      isVisible: body.isVisible !== false,
      published: body.isVisible !== false,
      featured: isFeatured,
      featuredSince: isFeatured && body.featuredSince ? new Date(String(body.featuredSince)) : isFeatured ? new Date() : null,
      featuredUntil: body.featuredUntil ? new Date(String(body.featuredUntil)) : null,
      featuredPosition: body.featuredPosition === 'category' || body.featuredPosition === 'both' ? String(body.featuredPosition) : 'home',
      showFeaturedBadge: body.showFeaturedBadge !== false,
      showOnHome: body.showOnHome !== false,
      showcaseFeatured: Boolean(body.showcaseFeatured ?? isFeatured),
      showcaseNewest: Boolean(body.showcaseNewest),
      showcaseSale: Boolean(body.showcaseSale),
      images: productImageJson(body.images) as Prisma.InputJsonValue,
      categoryId,
    },
    include: { category: true },
  });
  invalidatePostgresAdminCache();
  return toProductDto(product);
}

export async function deletePostgresAdminProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  invalidatePostgresAdminCache();
}

export async function patchPostgresAdminProduct(id: string, body: Record<string, unknown>) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return null;

  const data: Prisma.ProductUpdateInput = { updatedAt: new Date() };

  if ('stock' in body) {
    const stock = Math.max(0, parseInt(String(body.stock ?? '0'), 10) || 0);
    data.stock = stock;
    data.stockQuantity = stock;
  }

  if ('isVisible' in body) {
    const isVisible = Boolean(body.isVisible);
    data.isVisible = isVisible;
    data.published = isVisible;
  }

  if ('categoryId' in body && body.categoryId) {
    data.category = { connect: { id: String(body.categoryId) } };
  }

  if ('salePrice' in body) {
    data.salePrice = body.salePrice === null || body.salePrice === '' ? null : Number(body.salePrice);
  }

  if ('discountPercent' in body) {
    const percent = Math.min(99, Math.max(0, Number(body.discountPercent) || 0));
    const basePrice = Number(existing.price || 0);
    data.salePrice = percent > 0 ? Math.round(basePrice * (1 - percent / 100)) : null;
  }

  if ('clearDiscount' in body && body.clearDiscount) {
    data.salePrice = null;
  }

  if ('isFeatured' in body) {
    const isFeatured = Boolean(body.isFeatured);
    data.featured = isFeatured;
    if (!isFeatured) {
      data.featuredSince = null;
      data.featuredUntil = null;
    }
  }

  if ('featuredSince' in body) {
    const raw = body.featuredSince;
    data.featuredSince = raw ? new Date(String(raw)) : null;
  }

  if ('featuredUntil' in body) {
    const raw = body.featuredUntil;
    data.featuredUntil = raw ? new Date(String(raw)) : null;
  }

  if ('featuredPosition' in body) {
    const pos = String(body.featuredPosition || 'home');
    data.featuredPosition = pos === 'category' || pos === 'both' ? pos : 'home';
  }

  if ('showFeaturedBadge' in body) {
    data.showFeaturedBadge = Boolean(body.showFeaturedBadge);
  }

  if ('showOnHome' in body) {
    data.showOnHome = Boolean(body.showOnHome);
  }

  if ('showcaseFeatured' in body) {
    data.showcaseFeatured = Boolean(body.showcaseFeatured);
  }

  if ('showcaseNewest' in body) {
    data.showcaseNewest = Boolean(body.showcaseNewest);
  }

  if ('showcaseSale' in body) {
    data.showcaseSale = Boolean(body.showcaseSale);
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: { category: true },
  });
  invalidatePostgresAdminCache();
  return toProductDto(product);
}

export async function bulkPatchPostgresProducts(ids: string[], body: Record<string, unknown>) {
  const updated = [];
  for (const id of ids) {
    const product = await patchPostgresAdminProduct(id, body);
    if (product) updated.push(product);
  }
  return updated;
}

function buildKrAddressWhere(filters?: {
  krZonecode?: string;
  krAddressQuery?: string;
}): Prisma.OrderWhereInput | undefined {
  if (!filters?.krZonecode && !filters?.krAddressQuery) return undefined;

  const parts: Prisma.OrderWhereInput[] = [];

  if (filters.krZonecode) {
    const zone = filters.krZonecode.trim();
    parts.push({
      OR: [
        { addressSnapshot: { path: ['zonecode'], equals: zone } },
        { shippingAddress: { contains: `[${zone}]`, mode: 'insensitive' } },
      ],
    });
  }

  if (filters.krAddressQuery) {
    const query = filters.krAddressQuery.trim();
    if (query) {
      parts.push({
        OR: [
          { shippingAddress: { contains: query, mode: 'insensitive' } },
          { customerName: { contains: query, mode: 'insensitive' } },
        ],
      });
    }
  }

  return parts.length === 1 ? parts[0] : { AND: parts };
}

function buildAddressSnapshotWhere(filters?: {
  regionId?: string;
  districtId?: string;
  khorooId?: string;
}): Prisma.OrderWhereInput | undefined {
  if (!filters?.regionId && !filters?.districtId && !filters?.khorooId) return undefined;

  const parts: Prisma.OrderWhereInput[] = [];

  if (filters.regionId) {
    parts.push({
      OR: [
        { addressSnapshot: { path: ['region_id'], equals: filters.regionId } },
        { addressSnapshot: { path: ['regionId'], equals: filters.regionId } },
      ],
    });
  }
  if (filters.districtId) {
    parts.push({
      OR: [
        { addressSnapshot: { path: ['district_id'], equals: filters.districtId } },
        { addressSnapshot: { path: ['districtId'], equals: filters.districtId } },
      ],
    });
  }
  if (filters.khorooId) {
    parts.push({
      OR: [
        { addressSnapshot: { path: ['khoroo_id'], equals: filters.khorooId } },
        { addressSnapshot: { path: ['khorooId'], equals: filters.khorooId } },
      ],
    });
  }

  return parts.length === 1 ? parts[0] : { AND: parts };
}

export async function listPostgresAdminOrders(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  archived?: boolean;
  regionId?: string;
  districtId?: string;
  khorooId?: string;
  market?: string;
  krZonecode?: string;
  krAddressQuery?: string;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const status = filters?.status && filters.status !== 'all' ? normalizeOrderStatus(filters.status) : undefined;
  const market = filters?.market && filters.market !== 'all' ? filters.market : undefined;
  const locationWhere = market === 'KR' ? undefined : buildAddressSnapshotWhere(filters);
  const krLocationWhere = market === 'MN' ? undefined : buildKrAddressWhere(filters);
  const where: Prisma.OrderWhereInput = {
    archived: filters?.archived ?? false,
    ...(status ? { status } : {}),
    ...(market ? { market } : {}),
    ...(filters?.dateFrom || filters?.dateTo ? {
      createdAt: {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {}),
      },
    } : {}),
    ...(filters?.search ? {
      OR: [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerPhone: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ],
    } : {}),
    ...(locationWhere ? locationWhere : {}),
    ...(krLocationWhere ? krLocationWhere : {}),
  };
  const baseCountWhere: Prisma.OrderWhereInput = {
    archived: filters?.archived ?? false,
    ...(market ? { market } : {}),
    ...(filters?.dateFrom || filters?.dateTo ? where.createdAt ? { createdAt: where.createdAt } : {} : {}),
    ...(filters?.search ? {
      OR: [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerPhone: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ],
    } : {}),
    ...(locationWhere ? locationWhere : {}),
    ...(krLocationWhere ? krLocationWhere : {}),
  };

  const [orders, totalCount, filteredAmountAgg, ...statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { total: true } }),
    ...ORDER_STATUSES.map((statusValue) => prisma.order.count({ where: { ...baseCountWhere, status: statusValue } })),
  ]);
  const counts = ORDER_STATUSES.reduce((acc: Record<string, number>, statusValue, index) => {
    acc[statusValue] = statusCounts[index] || 0;
    acc.all += statusCounts[index] || 0;
    return acc;
  }, { all: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });

  const orderDtos = orders.map(toOrderDto);
  return {
    orders: orderDtos,
    totalCount,
    totalPages: Math.ceil(totalCount / limit) || 1,
    currentPage: page,
    statusCounts: counts,
    summary: {
      totalOrders: counts.all,
      todayOrders: 0,
      pendingOrders: counts.pending,
      filteredAmount: Number(filteredAmountAgg._sum.total || 0),
      confirmedRevenue: orderDtos.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0),
    },
  };
}

export async function getPostgresAdminOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, items: { include: { product: true } } },
  });
  return order ? toOrderDto(order) : null;
}

/**
 * Захиалгын төлөв өөрчлөгдөхөд барааны нөөцийг зөв тохируулна:
 *  - идэвхтэй → cancelled: нөөцийг буцааж нэмнэ (sales орлогогүй болсон тул).
 *  - cancelled → идэвхтэй (буцааж сэргээх): нөөцийг дахин хасна.
 * Атомик байхын тулд transaction client дотор дуудна.
 */
async function adjustStockForStatusChange(
  tx: Prisma.TransactionClient,
  currentOrder: { status: string; items: Array<{ productId: string; quantity: number }> },
  nextStatus: string,
) {
  const prev = normalizeOrderStatus(currentOrder.status);
  const next = normalizeOrderStatus(nextStatus);
  if (prev === next) return;

  const toCancelled = next === 'cancelled' && prev !== 'cancelled';
  const fromCancelled = prev === 'cancelled' && next !== 'cancelled';
  if (!toCancelled && !fromCancelled) return;

  for (const item of currentOrder.items) {
    const q = Math.max(0, Math.floor(Number(item.quantity || 0)));
    if (!q) continue;

    if (toCancelled) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stockQuantity: { increment: q }, stock: { increment: q } },
      });
      await tx.product.updateMany({
        where: { id: item.productId, orderCount: { gte: q } },
        data: { orderCount: { decrement: q } },
      });
    } else {
      // cancelled → идэвхтэй: нөөц хүрэлцэх тохиолдолд л дахин хасна
      await tx.product.updateMany({
        where: { id: item.productId, stockQuantity: { gte: q } },
        data: { stockQuantity: { decrement: q }, stock: { decrement: q }, orderCount: { increment: q } },
      });
    }
  }
}

export async function updatePostgresAdminOrderStatus(id: string, status: string) {
  const normalized = normalizeOrderStatus(status);
  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (current) {
      await adjustStockForStatusChange(tx, current, normalized);
    }
    return tx.order.update({
      where: { id },
      data: { status: normalized },
      include: { user: true, items: { include: { product: true } } },
    });
  });
  invalidatePostgresAdminCache();
  return toOrderDto(order);
}

/**
 * Хэрэглэгч өөрийн захиалгаа цуцлах. Зөвхөн өөрийн, бэлтгэгдээгүй (pending/confirmed)
 * бөгөөд төлбөр төлөгдөөгүй захиалгыг цуцлах боломжтой. Нөөцийг буцаана.
 */
export async function cancelPostgresOrderByUser(orderId: string, userId: string) {
  const CANCELLABLE = new Set(['pending', 'confirmed']);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return { ok: false as const, reason: 'not_found' };
    if (order.userId !== userId) return { ok: false as const, reason: 'forbidden' };

    const status = normalizeOrderStatus(order.status);
    if (status === 'cancelled') return { ok: true as const, alreadyCancelled: true };
    if (!CANCELLABLE.has(status) || order.paymentStatus === 'paid') {
      return { ok: false as const, reason: 'not_cancellable' };
    }

    await adjustStockForStatusChange(tx, order, 'cancelled');
    await tx.order.update({ where: { id: orderId }, data: { status: 'cancelled' } });
    return { ok: true as const };
  });

  if (result.ok) invalidatePostgresAdminCache();
  return result;
}

const BULK_STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;
const BULK_ACTION_STATUS_MAP: Record<string, string> = {
  confirm_payment: 'confirmed',
  prepare: 'processing',
  ship: 'shipped',
  deliver: 'delivered',
  cancel: 'cancelled',
};

/** Хүргэлтийн жагсаалт — 'shipped' төлөвтэй захиалгууд. */
export async function listPostgresShippedOrders() {
  const orders = await prisma.order.findMany({
    where: { status: 'shipped', archived: false },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber || '',
    userId: order.userId || '',
    customerName: order.customerName || '',
    customerPhone: order.customerPhone || order.phone || '',
    customerEmail: order.customerEmail || '',
    status: order.status,
    total: Number(order.total || 0),
    subtotal: Number(order.subtotal || 0),
    shippingCost: Number(order.shippingCost || 0),
    shippingAddress: order.shippingAddress || '',
    addressSnapshot: order.addressSnapshot || null,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name || '',
      name_mn: item.name || '',
      quantity: item.quantity,
      price: Number(item.price || 0),
      imageUrl: item.imageUrl || '',
    })),
  }));
}

/** Хүргэлтийн API-аас захиалгыг 'delivered' болгоно. Олдохгүй бол null. */
export async function markPostgresOrderDelivered(orderId: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'delivered' },
      include: { items: true },
    });
    invalidatePostgresAdminCache();
    return order;
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';
    if (code === 'P2025') return null;
    throw error;
  }
}

export async function archivePostgresAdminOrder(id: string, archive: boolean) {
  const order = await prisma.order.update({
    where: { id },
    data: { archived: archive, archivedAt: archive ? new Date() : null },
    include: { user: true, items: { include: { product: true } } },
  });
  invalidatePostgresAdminCache();
  return toOrderDto(order);
}

export async function bulkUpdatePostgresAdminOrders(orderIds: string[], action: string) {
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: { user: true, items: { include: { product: true } } },
  });
  const orderMap = new Map(orders.map((order) => [order.id, order]));

  let updatedCount = 0;
  let skippedCount = 0;
  const updatedOrders: ReturnType<typeof toOrderDto>[] = [];

  for (const id of orderIds) {
    const order = orderMap.get(id);
    if (!order) {
      skippedCount++;
      continue;
    }

    if (action === 'archive') {
      const updated = await prisma.order.update({
        where: { id },
        data: { archived: true, archivedAt: new Date() },
        include: { user: true, items: { include: { product: true } } },
      });
      updatedOrders.push(toOrderDto(updated));
      updatedCount++;
      continue;
    }

    if (action === 'unarchive') {
      const updated = await prisma.order.update({
        where: { id },
        data: { archived: false, archivedAt: null },
        include: { user: true, items: { include: { product: true } } },
      });
      updatedOrders.push(toOrderDto(updated));
      updatedCount++;
      continue;
    }

    const currentStatus = normalizeOrderStatus(order.status);
    let nextStatus = '';

    if (action === 'advance') {
      const currentIndex = BULK_STATUS_FLOW.indexOf(currentStatus as typeof BULK_STATUS_FLOW[number]);
      if (currentIndex !== -1 && currentIndex < BULK_STATUS_FLOW.length - 1) {
        nextStatus = BULK_STATUS_FLOW[currentIndex + 1];
      } else {
        skippedCount++;
        continue;
      }
    } else {
      const mapped = BULK_ACTION_STATUS_MAP[action];
      if (mapped && currentStatus !== mapped) {
        nextStatus = mapped;
      } else {
        skippedCount++;
        continue;
      }
    }

    const normalizedNext = normalizeOrderStatus(nextStatus);
    const updated = await prisma.$transaction(async (tx) => {
      await adjustStockForStatusChange(tx, order, normalizedNext);
      return tx.order.update({
        where: { id },
        data: { status: normalizedNext },
        include: { user: true, items: { include: { product: true } } },
      });
    });
    updatedOrders.push(toOrderDto(updated));
    updatedCount++;
  }

  if (updatedCount > 0) {
    invalidatePostgresAdminCache();
  }

  return { updatedCount, skippedCount, updatedOrders };
}

export async function getPostgresOrderPayment(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      total: true,
      userId: true,
      phone: true,
      customerPhone: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      qpayInvoiceId: true,
      paymentMeta: true,
    },
  });
}

export async function savePostgresQPayInvoice(
  orderId: string,
  invoice: { invoice_id: string; qr_text?: string; qr_image?: string; qPay_shortUrl?: string },
) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentMethod: 'qpay',
      paymentStatus: 'pending',
      qpayInvoiceId: invoice.invoice_id,
      paymentMeta: {
        qpayQrText: invoice.qr_text || '',
        qpayQrImage: invoice.qr_image || '',
        qpayShortUrl: invoice.qPay_shortUrl || '',
      },
    },
  });
  invalidatePostgresAdminCache();
}

export async function markPostgresOrderPaid(
  orderId: string,
  payment: { paidAmount: number; paymentId?: string; paidAt?: Date },
) {
  const existing = await prisma.order.findUnique({ where: { id: orderId }, select: { paymentMeta: true } });
  const prevMeta = (existing?.paymentMeta && typeof existing.paymentMeta === 'object' ? existing.paymentMeta : {}) as Record<string, unknown>;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMeta: {
        ...prevMeta,
        qpayPaidAmount: payment.paidAmount,
        qpayPaymentId: payment.paymentId || '',
        paidAt: (payment.paidAt || new Date()).toISOString(),
      },
    },
  });
  invalidatePostgresAdminCache();
}

export async function getPostgresAdminStats() {
  return cached('admin-stats:postgres', 60_000, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalProducts, totalCustomers, pendingCount, lowStockCount, todayOrders, monthOrders] = await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: { not: 'admin' } } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.product.count({ where: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
      prisma.order.findMany({ where: { createdAt: { gte: today }, status: { not: 'cancelled' } }, select: { total: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: monthStart }, status: { in: PAID_STATUSES } }, select: { total: true } }),
    ]);

    return {
      ...emptyAdminStats(),
      todayRevenue: todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      todayOrderCount: todayOrders.length,
      pendingCount,
      lowStockCount,
      totalProducts,
      totalCustomers,
      monthlyRevenue: monthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      revenueChange: 0,
      warning: undefined,
    };
  });
}

export async function getPostgresAdminAnalytics() {
  return cached('admin-analytics:postgres', 60_000, async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const chartStart = new Date(today);
    chartStart.setDate(chartStart.getDate() - 6);

    const [orders, products, expenses, totalCustomers] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: monthStart } },
        include: { items: true },
      }),
      prisma.product.findMany({
        include: { category: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: monthStart } },
        orderBy: { date: 'desc' },
      }),
      prisma.user.count({ where: { role: { not: 'admin' } } }),
    ]);

    const activeOrders = orders.filter((order) => order.status !== 'cancelled');
    const paidOrders = orders.filter((order) => PAID_STATUSES.includes(order.status));
    const paidWeekOrders = paidOrders.filter((order) => order.createdAt >= weekStart);
    const pendingPayments = orders.filter((order) => order.status === 'pending');

    const revenueByDay = Array.from({ length: 7 }, (_, index) => {
      const cursor = new Date(chartStart);
      cursor.setDate(chartStart.getDate() + index);
      const nextDay = new Date(cursor);
      nextDay.setDate(cursor.getDate() + 1);
      const dayOrders = paidOrders.filter((order) => order.createdAt >= cursor && order.createdAt < nextDay);
      return {
        date: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
        orders: dayOrders.length,
      };
    });

    const productSales = new Map<string, { quantity: number; revenue: number }>();
    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = productSales.get(item.productId) || { quantity: 0, revenue: 0 };
        productSales.set(item.productId, {
          quantity: current.quantity + Number(item.quantity || 0),
          revenue: current.revenue + Number(item.quantity || 0) * Number(item.price || 0),
        });
      });
    });

    const productById = new Map(products.map((product) => [product.id, product]));
    const productPerformance = products
      .map((product) => {
        const sales = productSales.get(product.id) || { quantity: 0, revenue: 0 };
        const views = Number(product.views || 0);
        const conversion = views > 0
          ? Number(((sales.quantity / views) * 100).toFixed(1))
          : sales.quantity > 0
            ? 100
            : 0;
        return {
          id: product.id,
          name: cleanText(product.nameMn || product.name),
          views,
          orders: sales.quantity,
          conversion,
          stock: Number(product.stock ?? product.stockQuantity ?? 0),
        };
      })
      .sort((a, b) => b.orders - a.orders || b.views - a.views);

    const topProducts = Array.from(productSales.entries())
      .map(([id, sales]) => ({
        id,
        name: cleanText(productById.get(id)?.nameMn || productById.get(id)?.name || 'Тодорхойгүй'),
        category: productById.get(id)?.category?.slug || productById.get(id)?.categoryId || 'other',
        quantity: sales.quantity,
        revenue: sales.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const inventoryRisk = products
      .filter((product) => Number(product.stock ?? product.stockQuantity ?? 0) <= LOW_STOCK_THRESHOLD)
      .slice(0, 8)
      .map((product) => ({
        id: product.id,
        name: cleanText(product.nameMn || product.name),
        category: product.category?.slug || product.categoryId || 'other',
        stock: Number(product.stock ?? product.stockQuantity ?? 0),
        price: Number(product.price || 0),
        visible: product.isVisible !== false && product.published !== false,
        soldCount: Number(product.orderCount || 0),
      }));

    const customerOrderCounts = new Map<string, number>();
    activeOrders.forEach((order) => {
      if (order.userId) {
        customerOrderCounts.set(order.userId, (customerOrderCounts.get(order.userId) || 0) + 1);
      }
    });

    const monthRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const weekRevenue = paidWeekOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const lowStockCount = products.filter((product) => {
      const stock = Number(product.stock ?? product.stockQuantity ?? 0);
      return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
    }).length;

    return {
      ...emptyAdminAnalytics(),
      summary: {
        monthRevenue,
        weekRevenue,
        averageOrder: paidWeekOrders.length
          ? Math.round(paidWeekOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) / paidWeekOrders.length)
          : 0,
        paidOrderCount: paidWeekOrders.length,
        lowStockCount,
        repeatCustomers: Array.from(customerOrderCounts.values()).filter((count) => count > 1).length,
        customerValue: totalCustomers
          ? Math.round(activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) / totalCustomers)
          : 0,
        totalCustomers,
        productCount: products.length,
        pendingPaymentCount: pendingPayments.length,
        pendingPaymentAmount: pendingPayments.reduce((sum, order) => sum + Number(order.total || 0), 0),
        expenseTracked: true,
        totalExpenses,
        netProfit: monthRevenue - totalExpenses,
      },
      revenueByDay,
      statusBreakdown: ORDER_STATUSES.map((status) => ({
        status,
        count: orders.filter((order) => order.status === status).length,
      })),
      topProducts,
      inventoryRisk,
      productPerformance,
      expenses: expenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
      })),
      warning: undefined,
    };
  });
}

function toAdminReviewDto(review: any) {
  const status = review.status === 'visible' || review.status === 'hidden' || review.status === 'pending'
    ? review.status
    : review.approved
      ? 'visible'
      : 'pending';
  const imageUrls = Array.isArray(review.imageUrls) ? review.imageUrls : [];

  return {
    id: review.id,
    productId: review.productId || '',
    productSlug: review.productSlug || review.product?.slug || '',
    productName: cleanText(review.productName || review.product?.nameMn || review.product?.name || ''),
    userId: review.userId || '',
    userName: cleanText(review.userName || review.user?.name || review.user?.displayName || ''),
    userEmail: review.userEmail || review.user?.email || '',
    rating: Number(review.rating || 0),
    content: cleanText(review.content || review.body || ''),
    imageUrls,
    status,
    approved: status === 'visible',
    featured: Boolean(review.featured),
    orderId: review.orderId || '',
    verifiedPurchase: review.verifiedPurchase !== false && Boolean(review.orderId),
    editCount: Number(review.editCount || 0),
    adminReply: cleanText(review.adminReply || ''),
    createdAt: review.createdAt,
  };
}

export async function listPostgresAdminReviews(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const search = filters?.search?.trim() || '';
  const where: Prisma.ReviewWhereInput = {
    ...(filters?.status && filters.status !== 'all' ? { status: filters.status } : {}),
    ...(search
      ? {
          OR: [
            { productName: { contains: search, mode: 'insensitive' } },
            { userName: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [reviews, totalCount, pendingCount, visibleCount, hiddenCount, featuredCount] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
    prisma.review.count({ where: { status: 'pending' } }),
    prisma.review.count({ where: { status: 'visible' } }),
    prisma.review.count({ where: { status: 'hidden' } }),
    prisma.review.count({ where: { featured: true } }),
  ]);

  const withPhotosCount = reviews.filter((review) => Array.isArray(review.imageUrls) && review.imageUrls.length > 0).length;

  return {
    reviews: reviews.map(toAdminReviewDto),
    totalCount,
    totalPages: Math.ceil(totalCount / limit) || 1,
    currentPage: page,
    statusCounts: {
      total: pendingCount + visibleCount + hiddenCount,
      pending: pendingCount,
      approved: visibleCount,
      visible: visibleCount,
      hidden: hiddenCount,
      featured: featuredCount,
      withPhotos: withPhotosCount,
    },
  };
}

export async function updatePostgresAdminReview(
  id: string,
  patch: { status?: string; adminReply?: string; featured?: boolean },
) {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) return null;

  const data: Prisma.ReviewUpdateInput = { updatedAt: new Date() };
  if (typeof patch.adminReply === 'string') data.adminReply = patch.adminReply.trim();
  if (patch.status) {
    data.status = patch.status;
    data.approved = patch.status === 'visible';
    if (patch.status !== 'visible') data.featured = false;
  }
  if (typeof patch.featured === 'boolean') data.featured = patch.featured;

  return prisma.review.update({ where: { id }, data });
}

export async function deletePostgresAdminReview(id: string) {
  await prisma.review.delete({ where: { id } });
}

export async function notifyReviewReply(review: {
  id: string;
  userId: string;
  productName?: string | null;
  productSlug?: string | null;
  adminReply: string;
}) {
  if (!review.userId || !review.adminReply.trim()) return;

  const href = review.productSlug ? `/shop/${review.productSlug}` : '/reviews';
  const productName = cleanText(review.productName || 'Бүтээгдэхүүн');

  await prisma.notification.create({
    data: {
      type: 'REVIEW_REPLY',
      userId: review.userId,
      title: 'Сэтгэгдэлд хариу ирлээ',
      body: `${productName} бүтээгдэхүүний сэтгэгдэлд UJ хариуллаа.`,
      href,
      channel: 'in_app',
      status: 'unread',
    },
  });
}

function toAdminCustomerDto(user: any, orderCount = 0, totalSpent = 0) {
  return {
    id: user.id,
    name: cleanText(user.displayName || user.name || ''),
    email: user.email || '',
    phone: user.phone || '',
    role: user.role === 'admin' ? 'admin' : 'customer',
    createdAt: user.createdAt,
    orderCount,
    totalSpent,
  };
}

export async function listPostgresAdminCustomers(filters?: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  role?: string;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const search = filters?.search?.trim().toLowerCase() || '';
  const sortBy = filters?.sortBy || 'newest';

  const roleFilter = filters?.role || 'all';
  const where: Prisma.UserWhereInput = {
    ...(roleFilter === 'admin'
      ? { role: 'admin' }
      : roleFilter === 'customer'
        ? { role: { not: 'admin' } }
        : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,
    include: {
      orders: {
        where: { status: { not: 'cancelled' } },
        select: { total: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = users.map((user) => {
    const orderCount = user.orders.length;
    const totalSpent = user.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return toAdminCustomerDto(user, orderCount, totalSpent);
  });

  enriched.sort((a, b) => {
    if (sortBy === 'orders') return b.orderCount - a.orderCount || b.totalSpent - a.totalSpent;
    if (sortBy === 'spent') return b.totalSpent - a.totalSpent || b.orderCount - a.orderCount;
    if (roleFilter === 'all') {
      const adminRank = (user: { role: string }) => (user.role === 'admin' ? 1 : 0);
      const byAdmin = adminRank(b) - adminRank(a);
      if (byAdmin !== 0) return byAdmin;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalCount = enriched.length;
  const start = (page - 1) * limit;
  const customers = enriched.slice(start, start + limit);

  return {
    customers,
    totalCount,
    totalPages: Math.ceil(totalCount / limit) || 1,
    currentPage: page,
  };
}

export async function countPostgresAdmins(): Promise<{ count: number; ids: string[] }> {
  const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
  return { count: admins.length, ids: admins.map((a) => a.id) };
}

export async function updatePostgresAdminUserRole(
  userId: string,
  role: 'admin' | 'customer',
  fallback?: { email?: string | null; name?: string | null },
) {
  const prismaRole = role === 'admin' ? 'admin' : 'customer';
  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: { role: prismaRole, updatedAt: new Date() },
      create: {
        id: userId,
        role: prismaRole,
        email: (fallback?.email || `${userId}@no-email.local`).trim(),
        displayName: fallback?.name || null,
        name: fallback?.name || null,
      },
    });
    invalidatePostgresAdminCache();
    return { id: userId, role };
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';
    if (code === 'P2025' || code === 'P2002') {
      // email давхцал г.м. — id-аар л role-ийг шинэчлэхийг оролдоно
      await prisma.user.update({ where: { id: userId }, data: { role: prismaRole } }).catch(() => null);
      invalidatePostgresAdminCache();
      return { id: userId, role };
    }
    throw error;
  }
}

export async function notifyPostgresUsers(
  userIds: string[],
  payload: { title: string; message: string; type?: string; href?: string; couponCode?: string },
) {
  const body = payload.couponCode
    ? `${payload.message.trim()}\n\nКупон код: ${payload.couponCode.trim()}`
    : payload.message.trim();

  if (!userIds.length) return 0;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      type: payload.type || 'PROMO',
      userId,
      title: payload.title.trim(),
      body,
      href: payload.href || '/shop',
      channel: 'in_app',
      status: 'unread',
    })),
  });

  return userIds.length;
}

export async function upsertPostgresAdminMetric(key: string, value: unknown) {
  await prisma.$executeRaw`
    INSERT INTO "AdminMetric" ("key", "value", "createdAt", "updatedAt")
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
  `;
}

export function invalidatePostgresAdminCache() {
  invalidateCache('admin-');
  invalidateCache('public-products:');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `category-${Date.now()}`;
}

function toCategoryDto(category: any, productCount = 0) {
  return {
    id: category.id,
    slug: category.slug,
    name: cleanText(category.nameMn || category.name),
    name_mn: cleanText(category.nameMn || category.name),
    icon: category.icon || 'Tags',
    color: category.color || '#E91E8C',
    image: category.image || '/placeholder-product.svg',
    showOnHome: Boolean(category.showOnHome),
    sortOrder: Number(category.sortOrder ?? 0),
    productCount,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export async function listPostgresPublicCategories() {
  return cached('public-categories:postgres', 60_000, async () => {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map((category: any) => toCategoryDto(category, category._count.products));
  });
}

export async function listPostgresAdminCategories() {
  return cached('admin-categories:postgres', 60_000, async () => {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map((category: any) => toCategoryDto(category, category._count.products));
  });
}

export async function createPostgresAdminCategory(name: string, icon?: string, color?: string, showOnHome = true) {
  const category = await prisma.category.create({
    data: {
      slug: slugify(name),
      name,
      nameMn: name,
      icon: icon || 'Tags',
      color: color || '#E91E8C',
      showOnHome,
    },
  });
  invalidateCache('admin-categories:');
  return toCategoryDto(category);
}

export async function updatePostgresAdminCategory(id: string, name: string, icon?: string, color?: string, showOnHome = true) {
  const category = await prisma.category.update({
    where: { id },
    data: {
      name,
      nameMn: name,
      icon: icon || 'Tags',
      color: color || '#E91E8C',
      showOnHome,
    },
  });
  invalidateCache('admin-categories:');
  invalidateCache('public-products:');
  return toCategoryDto(category);
}

export async function deletePostgresAdminCategory(id: string) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) throw new Error('Cannot delete category with products.');
  await prisma.category.delete({ where: { id } });
  invalidateCache('admin-categories:');
  invalidateCache('public-products:');
}

export async function getPostgresAdminSettings() {
  return cached('admin-settings:postgres', 60_000, async () => {
    const row = await prisma.setting.findUnique({ where: { key: 'store_settings' } });
    return row?.value || null;
  });
}

export async function savePostgresAdminSettings(body: Record<string, unknown>) {
  const value = JSON.parse(JSON.stringify(body)) as Prisma.InputJsonValue;
  const saved = await prisma.setting.upsert({
    where: { key: 'store_settings' },
    create: { id: 'MAIN', key: 'store_settings', value },
    update: { value },
  });
  invalidateCache('admin-settings:');
  return saved.value;
}

function getRangeStart(range: string, now = new Date()) {
  let startDate = new Date(now);
  if (range === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    startDate.setDate(now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
  } else if (range === '30d' || range === '1m') {
    startDate.setDate(now.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
  } else if (range === '3m') {
    startDate.setMonth(now.getMonth() - 2);
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return startDate;
}

export async function getPostgresRevenueChart(range: string) {
  return cached(`admin-revenue-chart:${range}`, 60_000, async () => {
    const now = new Date();
    const startDate = getRangeStart(range, now);
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'cancelled' },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const labels: string[] = [];
    const revenue: number[] = [];
    const orderCounts: number[] = [];

    if (range === 'today') {
      for (let hour = 0; hour <= now.getHours(); hour += 1) {
        const hourOrders = orders.filter((order) => order.createdAt.getHours() === hour);
        labels.push(`${hour}:00`);
        revenue.push(hourOrders.reduce((sum, order) => sum + Number(order.total || 0), 0));
        orderCounts.push(hourOrders.length);
      }
    } else if (range === '3m') {
      for (let index = 0; index < 3; index += 1) {
        const month = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
        const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
        const monthOrders = orders.filter((order) => order.createdAt >= month && order.createdAt < nextMonth);
        labels.push(`${month.getMonth() + 1} sar`);
        revenue.push(monthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0));
        orderCounts.push(monthOrders.length);
      }
    } else {
      const days = range === '7d' ? 7 : (range === '30d' || range === '1m') ? 30 : now.getDate();
      const cursor = new Date(startDate);
      for (let index = 0; index < days; index += 1) {
        if (cursor > now) break;
        const nextDay = new Date(cursor);
        nextDay.setDate(cursor.getDate() + 1);
        const dayOrders = orders.filter((order) => order.createdAt >= cursor && order.createdAt < nextDay);
        labels.push(`${cursor.getMonth() + 1}/${cursor.getDate()}`);
        revenue.push(dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0));
        orderCounts.push(dayOrders.length);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return { labels, revenue, orders: orderCounts };
  });
}

export async function getPostgresProductStats() {
  return cached('admin-product-stats:postgres', 60_000, async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [orderItems, lowStockDbProducts, outOfStockDbProducts, categoriesDb] = await Promise.all([
      prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: thirtyDaysAgo },
            status: { not: 'cancelled' },
          },
        },
        include: {
          product: true,
        },
      }),
      prisma.product.findMany({
        where: {
          stock: { gt: 0, lte: LOW_STOCK_THRESHOLD },
        },
        select: {
          id: true,
          name: true,
          nameMn: true,
          stock: true,
        },
        take: 20,
      }),
      prisma.product.findMany({
        where: {
          stock: 0,
        },
        select: {
          id: true,
          name: true,
          nameMn: true,
        },
        take: 20,
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const item of orderItems) {
      const productId = item.productId;
      const quantity = item.quantity;
      const price = item.price;
      const name = item.product?.nameMn || item.product?.name || item.name || 'Тодорхойгүй';

      const current = productSales.get(productId) || { name, quantity: 0, revenue: 0 };
      productSales.set(productId, {
        name,
        quantity: current.quantity + quantity,
        revenue: current.revenue + quantity * price,
      });
    }

    const topProducts = Array.from(productSales.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const lowStockProducts = lowStockDbProducts.map((p) => ({
      id: p.id,
      name: p.nameMn || p.name || 'Тодорхойгүй',
      stock: p.stock,
    }));

    const outOfStockProducts = outOfStockDbProducts.map((p) => ({
      id: p.id,
      name: p.nameMn || p.name || 'Тодорхойгүй',
      stock: 0,
    }));

    const categories = categoriesDb.map((c) => ({
      name: c.nameMn || c.name,
      count: c._count.products,
    }));

    return {
      topProducts,
      lowStockProducts,
      outOfStockProducts,
      categories,
    };
  });
}
