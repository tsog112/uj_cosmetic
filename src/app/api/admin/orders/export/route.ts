import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { listPostgresAdminOrders } from '@/lib/services/postgresAdminService';
import { formatDateTimeMN } from '@/lib/utils/format';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';

const STATUS_LABELS: Record<string, string> = {
  all: 'Бүх',
  pending: 'Төлбөр хүлээж байгаа',
  confirmed: 'Төлбөр баталгаажуулсан',
  processing: 'Захиалга бэлдэж байгаа',
  shipped: 'Хүргэлтэнд гарсан',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

const FILENAME_LABELS: Record<string, string> = {
  pending: 'хүлээгдэж_буй',
  confirmed: 'баталгаажсан',
  processing: 'бэлтгэгдэж_буй',
  shipped: 'хүргэлтэнд_гарсан',
  delivered: 'хүргэгдсэн',
  cancelled: 'цуцлагдсан',
};

// Grouping and Address Helper
function getOrderRegionInfo(order: any) {
  if (order.addressWarning) {
    return {
      regionName: 'Хаяг тодорхойгүй',
      districtName: 'Хаяг тодорхойгүй',
      districtShort: 'Тодорхойгүй',
      khoroo: '',
      detail: order.shippingAddress || '',
      isUB: false
    };
  }

  if (order.addressSnapshot) {
    try {
      const snap = typeof order.addressSnapshot === 'string'
        ? JSON.parse(order.addressSnapshot)
        : order.addressSnapshot;
      const region = snap.region || '';
      const district = snap.district || '';
      const isUB = region.includes('Улаанбаатар') || region.includes('УБ');
      return {
        regionName: isUB ? 'Улаанбаатар' : region,
        districtName: district,
        districtShort: snap.district_short || district,
        khoroo: snap.khoroo || '',
        detail: snap.detail || '',
        isUB
      };
    } catch (err) {
      console.error('Error parsing address snapshot:', err);
    }
  }

  const addr = String(order.shippingAddress || '');
  const isUB = addr.includes('Улаанбаатар') || addr.includes('УБ') || addr.includes('БЗД') || addr.includes('СБД') || addr.includes('ХУД') || addr.includes('ЧД') || addr.includes('БГД') || addr.includes('СХД') || addr.includes('НД') || addr.includes('ЗД');

  let regionName = 'Орон нутаг';
  let districtName = '';
  let districtShort = '';
  
  if (isUB) {
    regionName = 'Улаанбаатар';
    if (addr.includes('Баянзүрх') || addr.includes('БЗД')) { districtName = 'Баянзүрх дүүрэг'; districtShort = 'БЗД'; }
    else if (addr.includes('Сүхбаатар') || addr.includes('СБД')) { districtName = 'Сүхбаатар дүүрэг'; districtShort = 'СБД'; }
    else if (addr.includes('Хан-Уул') || addr.includes('ХУД')) { districtName = 'Хан-Уул дүүрэг'; districtShort = 'ХУД'; }
    else if (addr.includes('Чингэлтэй') || addr.includes('ЧД')) { districtName = 'Чингэлтэй дүүрэг'; districtShort = 'ЧД'; }
    else if (addr.includes('Баянгол') || addr.includes('БГД')) { districtName = 'Баянгол дүүрэг'; districtShort = 'БГД'; }
    else if (addr.includes('Сонгинохайрхан') || addr.includes('СХД')) { districtName = 'Сонгинохайрхан дүүрэг'; districtShort = 'СХД'; }
    else if (addr.includes('Налайх') || addr.includes('НД')) { districtName = 'Налайх дүүрэг'; districtShort = 'НД'; }
    else if (addr.includes('Зайсан') || addr.includes('ЗД')) { districtName = 'Зайсан дүүрэг'; districtShort = 'ЗД'; }
    else if (addr.includes('Хэнтий') || addr.includes('ХЭД')) { districtName = 'Хэнтий дүүрэг'; districtShort = 'ХЭД'; }
    else { districtName = 'Бусад дүүрэг'; districtShort = 'Бусад'; }
  } else {
    const aimags = ['Дархан', 'Орхон', 'Эрдэнэт', 'Сэлэнгэ', 'Завхан', 'Хөвсгөл', 'Өвөрхангай', 'Өмнөговь', 'Баянхонгор', 'Архангай', 'Баян-Өлгий', 'Булган', 'Говь-Алтай', 'Говьсүмбэр', 'Дорнод', 'Дорноговь', 'Дундговь', 'Сүхбаатар', 'Төв', 'Увс', 'Ховд', 'Хэнтий'];
    for (const aimag of aimags) {
      if (addr.toLowerCase().includes(aimag.toLowerCase())) {
        regionName = aimag.includes('аймаг') ? aimag : `${aimag} аймаг`;
        break;
      }
    }
    const parts = addr.split(',');
    if (parts.length > 1) {
      districtName = parts[1].trim();
      districtShort = districtName;
    } else {
      districtName = 'Бусад сум';
      districtShort = 'Бусад';
    }
  }

  return {
    regionName,
    districtName,
    districtShort,
    khoroo: '',
    detail: addr,
    isUB
  };
}

export async function GET(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const regionId = searchParams.get('region_id') || searchParams.get('regionId') || undefined;
    const districtId = searchParams.get('district_id') || searchParams.get('districtId') || undefined;
    const khorooId = searchParams.get('khoroo_id') || searchParams.get('khorooId') || undefined;
    const dateFrom = searchParams.get('date_from') || searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('date_to') || searchParams.get('dateTo') || undefined;
    const sheetMode = searchParams.get('sheet_mode') || searchParams.get('sheetMode') || 'single';
    const market = searchParams.get('market') || undefined;
    const krZonecode = searchParams.get('kr_zonecode') || searchParams.get('krZonecode') || undefined;
    const krAddressQuery = searchParams.get('kr_address') || searchParams.get('krAddressQuery') || undefined;

    // Fetch matching orders (identical to listAdminOrders filtering)
    const archived = searchParams.get('archived') === 'true';

    const result = await listPostgresAdminOrders({
      status,
      search,
      regionId: market === 'KR' ? undefined : regionId,
      districtId: market === 'KR' ? undefined : districtId,
      khorooId: market === 'KR' ? undefined : khorooId,
      dateFrom,
      dateTo,
      market,
      krZonecode: market === 'MN' ? undefined : krZonecode,
      krAddressQuery: market === 'MN' ? undefined : krAddressQuery,
      archived,
      page: 1,
      limit: 10000,
    });

    const orders = result.orders || [];

    // Grouping orders
    const groups: Record<string, {
      regionName: string;
      districtName: string;
      districtShort: string;
      isUB: boolean;
      orders: any[];
      totalAmount: number;
    }> = {};

    for (const order of orders) {
      const info = getOrderRegionInfo(order);
      const key = info.regionName === 'Хаяг тодорхойгүй'
        ? 'Хаяг тодорхойгүй'
        : (info.isUB ? `UB-${info.districtName}` : info.regionName);
      if (!groups[key]) {
        groups[key] = {
          regionName: info.regionName,
          districtName: info.districtName,
          districtShort: info.districtShort,
          isUB: info.isUB,
          orders: [],
          totalAmount: 0
        };
      }
      groups[key].orders.push(order);
      groups[key].totalAmount += order.total;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UJ Beauty & Wellness';
    workbook.lastModifiedBy = 'UJ Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    const dateStr = new Date().toISOString().split('T')[0];

    const columnsConfig = [
      { header: 'Захиалга №', key: 'orderNumber', width: 15 },
      { header: 'Хэрэглэгч', key: 'customer', width: 22 },
      { header: 'Утас', key: 'phone', width: 14 },
      { header: 'Аймаг / Хот', key: 'region', width: 16 },
      { header: 'Дүүрэг / Сум', key: 'district', width: 16 },
      { header: 'Хороо / Баг', key: 'khoroo', width: 14 },
      { header: 'Дэлгэрэнгүй хаяг', key: 'detail', width: 38 },
      { header: 'Бараа', key: 'product', width: 28 },
      { header: 'Тоо', key: 'qty', width: 8 },
      { header: 'Нэгж үнэ', key: 'price', width: 14 },
      { header: 'Нийт дүн', key: 'total', width: 16 },
      { header: 'Статус', key: 'status', width: 18 },
      { header: 'Огноо', key: 'date', width: 18 }
    ];

    // ==========================================
    // OPTION A: Single Sheet Export
    // ==========================================
    if (sheetMode === 'single') {
      const sheet = workbook.addWorksheet('Хүргэлтийн жагсаалт');
      sheet.columns = columnsConfig;

      // Title & Date Info Rows
      sheet.insertRow(1, ['UJ Beauty & Wellness — Хүргэлтийн жагсаалт']);
      sheet.insertRow(2, [`Огноо: ${dateStr}  |  Шүүсэн: ${orders.length} захиалга`]);
      sheet.addRow([]); // Blank row

      sheet.mergeCells('A1:M1');
      const titleCell = sheet.getCell('A1');
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1A1A1A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
      sheet.getRow(1).height = 32;

      sheet.mergeCells('A2:M2');
      const subCell = sheet.getCell('A2');
      subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'left' };
      sheet.getRow(2).height = 20;

      // Column Headers Row
      const headerRowValues = columnsConfig.map(c => c.header);
      sheet.getRow(4).values = headerRowValues;
      sheet.getRow(4).height = 26;

      sheet.getRow(4).eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2D3748' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          bottom: { style: 'medium', color: { argb: 'FF4A5568' } }
        };
      });

      sheet.views = [{ state: 'frozen', ySplit: 4 }];

      let currentRowNum = 5;
      const groupKeys = Object.keys(groups);

      for (const groupKey of groupKeys) {
        const group = groups[groupKey];
        
        let secText = '';
        let headerColor = 'FFA32D2D'; // Red for unknown
        
        if (group.regionName === 'Хаяг тодорхойгүй') {
          secText = `▶ ХАЯГ ТОДОРХОЙГҮЙ (${group.orders.length} захиалга)`;
        } else {
          secText = group.isUB 
            ? `▶ УЛААНБААТАР — ${group.districtName.toUpperCase()} (${group.orders.length} захиалга)` 
            : `▶ ${group.regionName.toUpperCase()} (${group.orders.length} захиалга)`;
          headerColor = group.isUB ? 'FF217346' : 'FFE65100'; // Green for UB, Orange for aimag
        }
          
        sheet.addRow([secText]);
        sheet.mergeCells(`A${currentRowNum}:M${currentRowNum}`);
        const secCell = sheet.getCell(`A${currentRowNum}`);
        
        secCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        secCell.alignment = { vertical: 'middle', horizontal: 'left' };
        secCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: headerColor }
        };
        
        sheet.getRow(currentRowNum).height = 28;
        currentRowNum++;

        let index = 0;
        for (const order of group.orders) {
          const addrInfo = getOrderRegionInfo(order);
          const firstItem = order.items?.[0];
          const dateFormatted = formatDateTimeMN(order.createdAt);
          
          sheet.addRow({
            orderNumber: order.orderNumber,
            customer: order.customerName,
            phone: order.customerPhone,
            region: addrInfo.regionName,
            district: addrInfo.districtName,
            khoroo: addrInfo.khoroo || '-',
            detail: addrInfo.detail,
            product: firstItem?.product?.name || 'Бүтээгдэхүүн',
            qty: firstItem?.quantity || 1,
            price: firstItem?.price || 0,
            total: order.total,
            status: STATUS_LABELS[order.status] || order.status,
            date: dateFormatted
          });

          const row = sheet.getRow(currentRowNum);
          row.height = 22;

          const rowBg = index % 2 === 0 ? 'FFFFFFFF' : 'FFF7FAFC';
          row.eachCell((cell, colNum) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
            
            if (colNum === 3) {
              cell.numFmt = '@'; // Phone as text
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            if (colNum === 9) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            if (colNum === 10 || colNum === 11) {
              cell.numFmt = '#,##0"₮"';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
          });

          currentRowNum++;
          index++;

          // Secondary items
          if (order.items.length > 1) {
            for (let i = 1; i < order.items.length; i++) {
              const subItem = order.items[i];
              sheet.addRow({
                orderNumber: '',
                customer: '',
                phone: '',
                region: '',
                district: '',
                khoroo: '',
                detail: '',
                product: subItem.product?.name || 'Нэмэлт бараа',
                qty: subItem.quantity,
                price: subItem.price,
                total: subItem.price * subItem.quantity,
                status: '',
                date: ''
              });

              const subRow = sheet.getRow(currentRowNum);
              subRow.height = 20;
              subRow.eachCell((cell, colNum) => {
                cell.font = { name: 'Arial', size: 9, italic: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
                
                if (colNum === 9) {
                  cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
                if (colNum === 10 || colNum === 11) {
                  cell.numFmt = '#,##0"₮"';
                  cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
              });
              
              currentRowNum++;
            }
          }
        }

        // Region Subtotal
        sheet.addRow([]);
        sheet.mergeCells(`A${currentRowNum}:J${currentRowNum}`);
        sheet.getCell(`A${currentRowNum}`).value = `▶ ДЭД ДҮН (${group.regionName === 'Хаяг тодорхойгүй' ? 'Тодорхойгүй хаяг' : group.regionName.split(' (')[0]}):`;
        sheet.getCell(`A${currentRowNum}`).alignment = { horizontal: 'right', vertical: 'middle' };
        sheet.getCell(`K${currentRowNum}`).value = group.totalAmount;
        
        const subRow = sheet.getRow(currentRowNum);
        subRow.height = 24;
        subRow.eachCell((cell, colNum) => {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2D3748' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }; // Light green
          
          if (colNum === 11) {
            cell.numFmt = '#,##0"₮"';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        });

        currentRowNum++;
        sheet.addRow([]); // Blank spacer
        currentRowNum++;
      }

      // Grand Total
      const grandAmount = orders.reduce((sum, o) => sum + o.total, 0);
      sheet.addRow([]);
      sheet.mergeCells(`A${currentRowNum}:J${currentRowNum}`);
      sheet.getCell(`A${currentRowNum}`).value = 'НИЙТ ДҮН (GRAND TOTAL):';
      sheet.getCell(`A${currentRowNum}`).alignment = { horizontal: 'right', vertical: 'middle' };
      sheet.getCell(`K${currentRowNum}`).value = grandAmount;

      const grandRow = sheet.getRow(currentRowNum);
      grandRow.height = 28;
      grandRow.eachCell((cell, colNum) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFE65100' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } }; // Light orange
        
        if (colNum === 11) {
          cell.numFmt = '#,##0"₮"';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });
    }
    
    // ==========================================
    // OPTION B: Multi-Sheet Export
    // ==========================================
    else {
      // Cover Sheet
      const cover = workbook.addWorksheet('Нэгдсэн тайлан');
      cover.columns = [
        { header: 'Бүс / Хүргэлтийн чиглэл', key: 'area', width: 35 },
        { header: 'Нийт захиалга', key: 'count', width: 18 },
        { header: 'Нийт дүн', key: 'amount', width: 22 }
      ];

      cover.insertRow(1, ['UJ Beauty & Wellness — Бүсийн нэгдсэн тайлан']);
      cover.mergeCells('A1:C1');
      cover.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1A1A1A' } };
      cover.getRow(1).height = 30;

      cover.getRow(3).values = ['Бүс / Хүргэлтийн чиглэл', 'Нийт захиалга', 'Нийт дүн'];
      cover.getRow(3).height = 24;
      cover.getRow(3).eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF217346' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      let coverRowNum = 4;
      const groupKeys = Object.keys(groups);

      for (const groupKey of groupKeys) {
        const group = groups[groupKey];
        const label = group.regionName === 'Хаяг тодорхойгүй'
          ? 'Хаяг тодорхойгүй'
          : (group.isUB ? `Улаанбаатар — ${group.districtName}` : group.regionName);
          
        cover.addRow({
          area: label,
          count: group.orders.length,
          amount: group.totalAmount
        });

        const r = cover.getRow(coverRowNum);
        r.height = 22;
        r.getCell(1).font = { name: 'Arial', size: 10, bold: true };
        r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        r.getCell(3).numFmt = '#,##0"₮"';
        r.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
        
        coverRowNum++;
      }

      const grandAmount = orders.reduce((sum, o) => sum + o.total, 0);
      cover.addRow({
        area: 'НИЙТ ДҮН (GRAND TOTAL):',
        count: orders.length,
        amount: grandAmount
      });
      
      const cGrandRow = cover.getRow(coverRowNum);
      cGrandRow.height = 26;
      cGrandRow.eachCell((cell, colNum) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFE65100' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
        if (colNum === 3) {
          cell.numFmt = '#,##0"₮"';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });

      // Individual Sheets
      for (const groupKey of groupKeys) {
        const group = groups[groupKey];
        
        let tabName = '';
        if (group.regionName === 'Хаяг тодорхойгүй') {
          tabName = 'Тодорхойгүй';
        } else {
          tabName = group.isUB 
            ? `УБ-${group.districtShort}` 
            : group.regionName.replace(' аймаг', '');
        }
        tabName = tabName.slice(0, 30); // 31 limit

        const sheet = workbook.addWorksheet(tabName);
        sheet.columns = columnsConfig;

        sheet.insertRow(1, [`Хүргэлт: ${group.regionName === 'Хаяг тодорхойгүй' ? 'Хаяг тодорхойгүй' : (group.isUB ? `Улаанбаатар — ${group.districtName}` : group.regionName)}`]);
        sheet.insertRow(2, [`Огноо: ${dateStr}  |  Захиалгын тоо: ${group.orders.length}`]);
        sheet.addRow([]);

        sheet.mergeCells('A1:M1');
        sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getCell('A1').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: group.regionName === 'Хаяг тодорхойгүй' ? 'FFA32D2D' : (group.isUB ? 'FF217346' : 'FFE65100') }
        };
        sheet.getRow(1).height = 30;

        sheet.mergeCells('A2:M2');
        sheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true };
        sheet.getRow(2).height = 20;

        sheet.getRow(4).values = columnsConfig.map(c => c.header);
        sheet.getRow(4).height = 24;
        sheet.getRow(4).eachCell((cell) => {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        sheet.views = [{ state: 'frozen', ySplit: 4 }];

        let rowNum = 5;
        let index = 0;
        for (const order of group.orders) {
          const addrInfo = getOrderRegionInfo(order);
          const firstItem = order.items?.[0];
          const dateFormatted = formatDateTimeMN(order.createdAt);
          
          sheet.addRow({
            orderNumber: order.orderNumber,
            customer: order.customerName,
            phone: order.customerPhone,
            region: addrInfo.regionName,
            district: addrInfo.districtName,
            khoroo: addrInfo.khoroo || '-',
            detail: addrInfo.detail,
            product: firstItem?.product?.name || 'Бүтээгдэхүүн',
            qty: firstItem?.quantity || 1,
            price: firstItem?.price || 0,
            total: order.total,
            status: STATUS_LABELS[order.status] || order.status,
            date: dateFormatted
          });

          const row = sheet.getRow(rowNum);
          row.height = 22;
          const bg = index % 2 === 0 ? 'FFFFFFFF' : 'FFF7FAFC';
          
          row.eachCell((cell, colNum) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
            
            if (colNum === 3) {
              cell.numFmt = '@';
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            if (colNum === 9) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            if (colNum === 10 || colNum === 11) {
              cell.numFmt = '#,##0"₮"';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
          });

          rowNum++;
          index++;

          if (order.items.length > 1) {
            for (let i = 1; i < order.items.length; i++) {
              const subItem = order.items[i];
              sheet.addRow({
                orderNumber: '',
                customer: '',
                phone: '',
                region: '',
                district: '',
                khoroo: '',
                detail: '',
                product: subItem.product?.name || 'Нэмэлт бараа',
                qty: subItem.quantity,
                price: subItem.price,
                total: subItem.price * subItem.quantity,
                status: '',
                date: ''
              });

              const subRow = sheet.getRow(rowNum);
              subRow.height = 20;
              subRow.eachCell((cell, colNum) => {
                cell.font = { name: 'Arial', size: 9, italic: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                
                if (colNum === 9) {
                  cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
                if (colNum === 10 || colNum === 11) {
                  cell.numFmt = '#,##0"₮"';
                  cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
              });
              
              rowNum++;
            }
          }
        }

        // Subtotal row for sheet
        sheet.addRow([]);
        sheet.mergeCells(`A${rowNum}:J${rowNum}`);
        sheet.getCell(`A${rowNum}`).value = 'СУУРЬ НИЙТ ДҮН (SUBTOTAL):';
        sheet.getCell(`A${rowNum}`).alignment = { horizontal: 'right', vertical: 'middle' };
        sheet.getCell(`K${rowNum}`).value = group.totalAmount;

        const subRow = sheet.getRow(rowNum);
        subRow.height = 26;
        subRow.eachCell((cell, colNum) => {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2D3748' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
          if (colNum === 11) {
            cell.numFmt = '#,##0"₮"';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().slice(0, 10);
    const statusName = status ? (FILENAME_LABELS[status] || status) : 'бүх';

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`UJ_Захиалга_${statusName}_${date}.xlsx`)}`,
      }
    });

  } catch (error: any) {
    console.error('Excel export failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to export Excel' }, { status: 500 });
  }
}
