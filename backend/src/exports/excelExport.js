const ExcelJS = require('exceljs');

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const COLORS = {
  headerBg: '1E3A5F',
  headerFont: 'FFFFFF',
  subjectBg: 'EBF5FB',
  religionBg: 'FEF9E7',
  breakBg: 'F2F3F4',
  altRow: 'F8FAFC',
  border: '999999',
};

/**
 * Generate full schedule Excel workbook
 * @param {Response} res
 * @param {object} data - { schedules, classes, timeSlots, teachers, job }
 */
async function generateScheduleExcel(res, data) {
  const { schedules, classes, timeSlots, teachers, job } = data;
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'MIS At-Taqwa Scheduling System';
  workbook.created = new Date();

  const year = job?.academicYear?.year || '-';
  const semester = job?.academicYear?.semester || '-';

  // Build schedule lookup: classId -> dayIndex -> slotIndex -> entry
  const schedMap = {};
  for (const s of schedules) {
    if (!schedMap[s.class_id]) schedMap[s.class_id] = {};
    if (!schedMap[s.class_id][s.day_index]) schedMap[s.class_id][s.day_index] = {};
    schedMap[s.class_id][s.day_index][s.slot_index] = s;
  }

  const lessonSlots = timeSlots.filter(s => s.category === 'lesson');
  const uniqueSlotIndices = [...new Set(lessonSlots.map(s => s.slot_index))].sort((a, b) => a - b);
  const allSlotIndices = [...new Set(timeSlots.map(s => s.slot_index))].sort((a, b) => a - b);
  const usedDays = [...new Set(timeSlots.map(s => s.day_index))].sort();

  const slotInfo = {};
  for (const ts of timeSlots) {
    if (!slotInfo[ts.slot_index]) slotInfo[ts.slot_index] = ts;
  }

  // ---- ONE SHEET PER CLASS ----
  for (const cls of classes) {
    const gradeNames = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
    const sheetName = `Kelas ${gradeNames[cls.grade] || cls.grade}${cls.name.includes('-') ? '' : ''}`;
    const ws = workbook.addWorksheet(sheetName, {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });

    // Title rows
    ws.mergeCells('A1', `${colLetter(1 + usedDays.length)}1`);
    ws.getCell('A1').value = 'MADRASAH IBTIDAIYAH SWASTA AT-TAQWA';
    styleTitle(ws.getCell('A1'), 14);

    ws.mergeCells('A2', `${colLetter(1 + usedDays.length)}2`);
    ws.getCell('A2').value = `JADWAL PELAJARAN - KELAS ${cls.name.toUpperCase()} | TA ${year} Semester ${semester}`;
    styleTitle(ws.getCell('A2'), 11);

    ws.addRow([]);

    // Header row
    const headerRow = ws.addRow(['Jam / Waktu', ...usedDays.map(d => DAY_NAMES[d])]);
    headerRow.height = 30;
    styleHeaderRow(headerRow, usedDays.length);

    // Data rows
    for (const slotIdx of allSlotIndices) {
      const info = slotInfo[slotIdx];
      const isBreak = info && info.category !== 'lesson';
      const startT = info ? info.start_time.substring(0, 5) : '-';
      const endT = info ? info.end_time.substring(0, 5) : '-';

      const rowData = [`Jam ${slotIdx + 1}\n${startT}-${endT}`];

      for (const dayIdx of usedDays) {
        if (isBreak) {
          rowData.push(info.category === 'prayer' ? 'Sholat' : 'Istirahat');
        } else {
          const entry = schedMap[cls.id]?.[dayIdx]?.[slotIdx];
          if (entry && entry.subject) {
            rowData.push(`${entry.subject.name}\n${entry.teacher?.name || ''}`);
          } else {
            rowData.push('');
          }
        }
      }

      const row = ws.addRow(rowData);
      row.height = 40;
      row.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };

      // Style time cell
      row.getCell(1).font = { bold: true, size: 9 };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } };

      for (let ci = 2; ci <= usedDays.length + 1; ci++) {
        const cell = row.getCell(ci);
        const dayIdx = usedDays[ci - 2];
        if (isBreak) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.breakBg } };
          cell.font = { italic: true, color: { argb: '888888' }, size: 9 };
        } else {
          const entry = schedMap[cls.id]?.[dayIdx]?.[slotIdx];
          const isReligion = entry?.subject?.type === 'keagamaan';
          cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: isReligion ? COLORS.religionBg : COLORS.subjectBg },
          };
          if (entry) cell.font = { size: 9 };
        }
        applyBorder(cell);
      }
      applyBorder(row.getCell(1));
    }

    // Column widths
    ws.getColumn(1).width = 14;
    for (let i = 2; i <= usedDays.length + 1; i++) {
      ws.getColumn(i).width = 20;
    }

    ws.getRow(1).height = 24;
    ws.getRow(2).height = 20;
    ws.getRow(4).height = 28;
    ws.views = [{ state: 'frozen', ySplit: 4 }];
  }

  // ---- TEACHER RECAP SHEET ----
  const recapWs = workbook.addWorksheet('Rekap Guru');
  recapWs.mergeCells('A1', `${colLetter(1 + usedDays.length)}1`);
  recapWs.getCell('A1').value = 'REKAP JADWAL GURU - MIS AT-TAQWA';
  styleTitle(recapWs.getCell('A1'), 12);
  recapWs.addRow([]);

  const recapHeader = recapWs.addRow(['Guru', ...usedDays.map(d => `${DAY_NAMES[d]} (jam)`)]);
  recapHeader.height = 28;
  styleHeaderRow(recapHeader, usedDays.length);

  // Build teacher schedule summary
  const teacherDaySummary = {};
  for (const s of schedules) {
    if (!teacherDaySummary[s.teacher_id]) teacherDaySummary[s.teacher_id] = {};
    teacherDaySummary[s.teacher_id][s.day_index] = (teacherDaySummary[s.teacher_id][s.day_index] || 0) + 1;
  }

  for (const teacher of teachers) {
    const rowData = [teacher.name];
    for (const d of usedDays) {
      rowData.push(teacherDaySummary[teacher.id]?.[d] || 0);
    }
    const row = recapWs.addRow(rowData);
    row.getCell(1).font = { size: 9 };
    for (let i = 2; i <= usedDays.length + 1; i++) {
      row.getCell(i).alignment = { horizontal: 'center' };
      applyBorder(row.getCell(i));
    }
    applyBorder(row.getCell(1));
  }

  recapWs.getColumn(1).width = 28;
  for (let i = 2; i <= usedDays.length + 1; i++) recapWs.getColumn(i).width = 14;

  // Footer info sheet
  const infoWs = workbook.addWorksheet('Info');
  infoWs.addRow(['Diekspor oleh', 'MIS At-Taqwa Scheduling System']);
  infoWs.addRow(['Tanggal Ekspor', new Date().toLocaleString('id-ID')]);
  infoWs.addRow(['Tahun Ajaran', year]);
  infoWs.addRow(['Semester', semester]);
  infoWs.getColumn(1).width = 20;
  infoWs.getColumn(2).width = 35;

  await workbook.xlsx.write(res);
}

function colLetter(n) {
  let result = '';
  while (n > 0) {
    result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function styleTitle(cell, fontSize) {
  cell.font = { bold: true, size: fontSize, color: { argb: '1E3A5F' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

function styleHeaderRow(row, dayCount) {
  for (let i = 1; i <= dayCount + 1; i++) {
    const cell = row.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.font = { bold: true, size: 10, color: { argb: COLORS.headerFont } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyBorder(cell);
  }
}

function applyBorder(cell) {
  const side = { style: 'thin', color: { argb: COLORS.border } };
  cell.border = { top: side, left: side, bottom: side, right: side };
}

module.exports = { generateScheduleExcel };
