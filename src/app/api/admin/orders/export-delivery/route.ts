import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { listAdminOrders } from '@/lib/services/firestoreAdminService';
import { formatDateTimeMN } from '@/lib/utils/format';

export const runtime = 'nodejs';

// Grouping and Address Helper
function getOrderRegionInfo(order: any) {
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
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const priceMin = searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined;
    const priceMax = searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined;
    const city = searchParams.get('city') || undefined;
    const option = searchParams.get('option') || 'single'; // 'single' | 'multi'

    // Fetch matching orders (large limit to capture all matches)
    const result = await listAdminOrders({
      status,
      page: 1,
      limit: 1000,
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      city
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
      const key = info.isUB ? `UB-${info.districtName}` : info.regionName;
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
      { header: 'Захиалга №', key: 'orderNumber', width: 14 },
      { header: 'Хэрэглэгч', key: 'customer', width: 22 },
      { header: 'Утас', key: 'phone', width: 14 },
      { header: 'Аймаг / Хот', key: 'region', width: 16 },
      { header: 'Дүүрэг / Сум', key: 'district', width: 16 },
      { header: 'Хороо / Баг', key: 'khoroo', width: 14 },
      { header: 'Дэлгэрэнгүй хаяг', key: 'detail', width: 38 },
      { header: 'Бараа', key: 'product', width: 26 },
      { header: 'Тоо ширхэг', key: 'qty', width: 11 },
      { header: 'Нэгж үнэ', key: 'price', width: 14 },
      { header: 'Нийт дүн', key: 'total', width: 16 },
      { header: 'Захиалгын огноо', key: 'date', width: 18 },
      { header: 'Тэмдэглэл', key: 'note', width: 22 },
    ];

    // ==========================================
    // OPTION A: Single Sheet Export
    // ==========================================
    if (option === 'single') {
      const sheet = workbook.addWorksheet('Хүргэлтийн жагсаалт');
      
      // Setup Columns
      sheet.columns = columnsConfig;

      // Title & Date Info Rows
      sheet.insertRow(1, ['UJ Beauty & Wellness — Хүргэлтийн жагсаалт']);
      sheet.insertRow(2, [`Огноо: ${dateStr}  |  Нийт: ${orders.length} захиалга`]);
      sheet.addRow([]); // Blank row

      // Format Title Row
      sheet.mergeCells('A1:M1');
      const titleCell = sheet.getCell('A1');
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1A1A1A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
      sheet.getRow(1).height = 32;

      // Format Subtitle Row
      sheet.mergeCells('A2:M2');
      const subCell = sheet.getCell('A2');
      subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'left' };
      sheet.getRow(2).height = 20;

      // Add Table Column Headers at Row 4
      const headerRowValues = columnsConfig.map(c => c.header);
      sheet.getRow(4).values = headerRowValues;
      sheet.getRow(4).height = 26;

      // Format Column Headers
      sheet.getRow(4).eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2D3748' } // Dark gray theme
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          bottom: { style: 'medium', color: { argb: 'FF4A5568' } }
        };
      });

      // Freezing Panes (Freeze top 4 rows)
      sheet.views = [{ state: 'frozen', ySplit: 4 }];

      let currentRowNum = 5;

      // Loop through region groups
      const groupKeys = Object.keys(groups);
      for (const groupKey of groupKeys) {
        const group = groups[groupKey];
        
        // Group section header row
        const secText = group.isUB 
          ? `▶ УЛААНБААТАР — ${group.districtName.toUpperCase()} (${group.orders.length} захиалга)` 
          : `▶ ${group.regionName.toUpperCase()} (${group.orders.length} захиалга)`;
          
        sheet.addRow([secText]);
        sheet.mergeCells(`A${currentRowNum}:M${currentRowNum}`);
        const secCell = sheet.getCell(`A${currentRowNum}`);
        
        secCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        secCell.alignment = { vertical: 'middle', horizontal: 'left' };
        secCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: group.isUB ? 'FF217346' : 'FFE65100' } // Green for UB, Orange for Aimag
        };
        
        sheet.getRow(currentRowNum).height = 28;
        currentRowNum++;

        // Add Group Orders
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
            date: dateFormatted,
            note: order.note || '-'
          });

          // Row formatting
          const row = sheet.getRow(currentRowNum);
          row.height = 22;

          // Zebra striping
          const rowBg = index % 2 === 0 ? 'FFFFFFFF' : 'FFF7FAFC';
          row.eachCell((cell, colNum) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
            
            // Format phone numbers explicitly as text
            if (colNum === 3) {
              cell.numFmt = '@';
              cell.alignment = { horizontal: 'center' };
            }
            
            // Format currency fields
            if (colNum === 10 || colNum === 11) {
              cell.numFmt = '#,##0"₮"';
              cell.alignment = { horizontal: 'right' };
            }
          });

          currentRowNum++;
          index++;

          // If there are multiple items, add the remaining items in secondary rows
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
                date: '',
                note: ''
              });

              const subRow = sheet.getRow(currentRowNum);
              subRow.height = 20;
              subRow.eachCell((cell, colNum) => {
                cell.font = { name: 'Arial', size: 9, italic: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
                
                if (colNum === 10 || colNum === 11) {
                  cell.numFmt = '#,##0"₮"';
                  cell.alignment = { horizontal: 'right' };
                }
              });
              
              currentRowNum++;
            }
          }
        }

        // Subtotal row for region group
        sheet.addRow([]);
        sheet.mergeCells(`A${currentRowNum}:J${currentRowNum}`);
        sheet.getCell(`A${currentRowNum}`).value = `▶ ${secText.replace('▶ ', '').split(' (')[0]} - ДҮН:`;
        sheet.getCell(`A${currentRowNum}`).alignment = { horizontal: 'right', vertical: 'middle' };
        sheet.getCell(`K${currentRowNum}`).value = group.totalAmount;
        
        // Format subtotal row
        const subRow = sheet.getRow(currentRowNum);
        subRow.height = 24;
        subRow.eachCell((cell, colNum) => {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2D3748' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }; // Light green subtotals
          
          if (colNum === 11) {
            cell.numFmt = '#,##0"₮"';
            cell.alignment = { horizontal: 'right' };
          }
        });

        currentRowNum++;
        sheet.addRow([]); // Blank spacer row
        currentRowNum++;
      }

      // GRAND TOTAL ROW at very bottom
      const grandAmount = orders.reduce((sum, o) => sum + o.total, 0);
      sheet.addRow([]);
      sheet.mergeCells(`A${currentRowNum}:J${currentRowNum}`);
      sheet.getCell(`A${currentRowNum}`).value = 'НӨӨЦИЙН НИЙТ ДҮН (GRAND TOTAL):';
      sheet.getCell(`A${currentRowNum}`).alignment = { horizontal: 'right', vertical: 'middle' };
      sheet.getCell(`K${currentRowNum}`).value = grandAmount;

      const grandRow = sheet.getRow(currentRowNum);
      grandRow.height = 28;
      grandRow.eachCell((cell, colNum) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFE65100' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } }; // Orange grand total
        
        if (colNum === 11) {
          cell.numFmt = '#,##0"₮"';
          cell.alignment = { horizontal: 'right' };
        }
      });
    }
    
    // ==========================================
    // OPTION B: Multi-Sheet (One per region)
    // ==========================================
    else {
      // 1. Cover / Summary Sheet
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
        const label = group.isUB 
          ? `Улаанбаатар — ${group.districtName}`
          : group.regionName;
          
        cover.addRow({
          area: label,
          count: group.orders.length,
          amount: group.totalAmount
        });

        const r = cover.getRow(coverRowNum);
        r.height = 22;
        r.getCell(1).font = { name: 'Arial', size: 10, bold: true };
        r.getCell(2).alignment = { horizontal: 'center' };
        r.getCell(3).numFmt = '#,##0"₮"';
        r.getCell(3).alignment = { horizontal: 'right' };
        
        coverRowNum++;
      }

      // Grand Total Row on Cover
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
        if (colNum === 3) cell.numFmt = '#,##0"₮"';
      });

      // 2. Individual Region Sheets
      for (const groupKey of groupKeys) {
        const group = groups[groupKey];
        
        // Tab names strictly limited to 30 characters
        let tabName = group.isUB 
          ? `УБ-${group.districtShort}` 
          : group.regionName.replace(' аймаг', '');
        tabName = tabName.slice(0, 30); // Excel limit is 31

        const sheet = workbook.addWorksheet(tabName);
        sheet.columns = columnsConfig;

        // Title and Column Header Rows
        sheet.insertRow(1, [`Хүргэлт: ${group.isUB ? `Улаанбаатар — ${group.districtName}` : group.regionName}`]);
        sheet.insertRow(2, [`Огноо: ${dateStr}  |  Захиалгын тоо: ${group.orders.length}`]);
        sheet.addRow([]);

        sheet.mergeCells('A1:M1');
        sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getCell('A1').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: group.isUB ? 'FF217346' : 'FFE65100' }
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
            date: dateFormatted,
            note: order.note || '-'
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
              cell.alignment = { horizontal: 'center' };
            }
            if (colNum === 10 || colNum === 11) {
              cell.numFmt = '#,##0"₮"';
              cell.alignment = { horizontal: 'right' };
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
                date: '',
                note: ''
              });

              const subRow = sheet.getRow(rowNum);
              subRow.height = 20;
              subRow.eachCell((cell, colNum) => {
                cell.font = { name: 'Arial', size: 9, italic: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                if (colNum === 10 || colNum === 11) {
                  cell.numFmt = '#,##0"₮"';
                  cell.alignment = { horizontal: 'right' };
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
            cell.alignment = { horizontal: 'right' };
          }
        });
      }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="UJ_Delivery_${dateStr}.xlsx"`
      }
    });

  } catch (error: any) {
    console.error('Excel export failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to export Excel' }, { status: 500 });
  }
}
