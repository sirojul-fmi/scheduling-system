const PDFDocument = require('pdfkit');

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Generate class schedule PDF
 * @param {Response} res - Express response (writable stream)
 * @param {object} data - { schedules, cls, timeSlots, job }
 */
async function generateClassSchedulePDF(res, data) {
  const { schedules, cls, timeSlots, job } = data;

  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
  });

  doc.pipe(res);

  // ---- HEADER ----
  doc.fontSize(14).font('Helvetica-Bold').text('MADRASAH IBTIDAIYAH SWASTA AT-TAQWA', { align: 'center' });
  doc.fontSize(11).font('Helvetica').text('Jadwal Pelajaran', { align: 'center' });

  const year = job?.academicYear?.year || '-';
  const semester = job?.academicYear?.semester || '-';
  doc.fontSize(10).text(`Tahun Ajaran ${year} | Semester ${semester} | Kelas ${cls.name}`, { align: 'center' });

  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.5);

  // ---- BUILD SCHEDULE GRID ----
  // Get unique slot indices
  const lessonSlots = timeSlots.filter(s => s.category === 'lesson');
  const uniqueSlotIndices = [...new Set(lessonSlots.map(s => s.slot_index))].sort((a, b) => a - b);

  // Get days that appear in schedule
  const usedDays = [...new Set(timeSlots.map(s => s.day_index))].sort();

  // Build lookup: dayIndex-slotIndex -> { subject, teacher }
  const scheduleMap = {};
  for (const s of schedules) {
    scheduleMap[`${s.day_index}-${s.slot_index}`] = s;
  }

  // Get start/end times per slot
  const slotTimes = {};
  for (const ts of timeSlots) {
    if (!slotTimes[ts.slot_index]) slotTimes[ts.slot_index] = ts;
  }

  // Table dimensions
  const colWidth = (doc.page.width - 80 - 80) / usedDays.length;
  const rowHeight = 36;
  const timeColWidth = 80;
  const startX = 40;
  let startY = doc.y;

  // Header row
  doc.rect(startX, startY, timeColWidth, rowHeight).fillAndStroke('#1e3a5f', '#999');
  doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
    .text('Jam / Hari', startX + 2, startY + 12, { width: timeColWidth - 4, align: 'center' });

  for (let di = 0; di < usedDays.length; di++) {
    const x = startX + timeColWidth + di * colWidth;
    doc.rect(x, startY, colWidth, rowHeight).fillAndStroke('#1e3a5f', '#999');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text(DAY_NAMES[usedDays[di]], x + 2, startY + 12, { width: colWidth - 4, align: 'center' });
  }
  startY += rowHeight;

  // Data rows
  for (let si = 0; si < uniqueSlotIndices.length; si++) {
    const slotIdx = uniqueSlotIndices[si];
    const slotInfo = slotTimes[slotIdx];
    const startTime = slotInfo ? formatTime(slotInfo.start_time) : '-';
    const endTime = slotInfo ? formatTime(slotInfo.end_time) : '-';
    const isBreak = slotInfo && slotInfo.category !== 'lesson';
    const bgColor = isBreak ? '#f0f0f0' : (si % 2 === 0 ? '#ffffff' : '#f8fafc');

    // Time column
    doc.rect(startX, startY, timeColWidth, rowHeight).fillAndStroke(bgColor, '#cccccc');
    doc.fillColor('#333').fontSize(8).font('Helvetica-Bold')
      .text(`Jam ${slotIdx + 1}`, startX + 2, startY + 4, { width: timeColWidth - 4, align: 'center' });
    doc.fontSize(7).font('Helvetica')
      .text(`${startTime}-${endTime}`, startX + 2, startY + 16, { width: timeColWidth - 4, align: 'center' });

    if (isBreak) {
      const label = slotInfo.category === 'prayer' ? '🕌 Sholat' : '☕ Istirahat';
      for (let di = 0; di < usedDays.length; di++) {
        const x = startX + timeColWidth + di * colWidth;
        doc.rect(x, startY, colWidth, rowHeight).fillAndStroke('#e8e8e8', '#cccccc');
        doc.fillColor('#888').fontSize(8).font('Helvetica')
          .text(label, x + 2, startY + 13, { width: colWidth - 4, align: 'center' });
      }
    } else {
      for (let di = 0; di < usedDays.length; di++) {
        const dayIdx = usedDays[di];
        const x = startX + timeColWidth + di * colWidth;
        const entry = scheduleMap[`${dayIdx}-${slotIdx}`];

        doc.rect(x, startY, colWidth, rowHeight).fillAndStroke(bgColor, '#cccccc');

        if (entry && entry.subject) {
          const isReligion = entry.subject.type === 'keagamaan';
          doc.fillColor(isReligion ? '#1e3a5f' : '#111').fontSize(8).font('Helvetica-Bold')
            .text(entry.subject.name, x + 3, startY + 5, { width: colWidth - 6, align: 'center', lineBreak: false });
          if (entry.teacher) {
            doc.fillColor('#555').fontSize(7).font('Helvetica')
              .text(entry.teacher.name, x + 3, startY + 18, { width: colWidth - 6, align: 'center', lineBreak: false });
          }
        }
      }
    }
    startY += rowHeight;
  }

  // ---- FOOTER ----
  doc.moveDown(1);
  const footerY = doc.page.height - 80;
  doc.fontSize(8).fillColor('#666')
    .text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, 40, footerY);
  doc.text('Mengetahui, Kepala Madrasah', doc.page.width - 200, footerY, { width: 160, align: 'center' });
  doc.moveDown(3);
  doc.text('(________________________)', doc.page.width - 200, doc.y, { width: 160, align: 'center' });

  doc.end();
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  return timeStr.substring(0, 5);
}

module.exports = { generateClassSchedulePDF };
