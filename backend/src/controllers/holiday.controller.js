const prisma = require('../config/prisma');

// Pre-seeded 2025 Indian government + major festival holidays
const INDIA_HOLIDAYS_2025 = [
  // National Holidays (read-only)
  { name: 'Republic Day', date: new Date('2025-01-26'), type: 'NATIONAL', isReadOnly: true, description: 'National Holiday' },
  { name: 'Independence Day', date: new Date('2025-08-15'), type: 'NATIONAL', isReadOnly: true, description: 'National Holiday' },
  { name: 'Gandhi Jayanti', date: new Date('2025-10-02'), type: 'NATIONAL', isReadOnly: true, description: 'National Holiday' },
  // Major Festivals
  { name: 'Makar Sankranti', date: new Date('2025-01-14'), type: 'FESTIVAL', description: 'Festival' },
  { name: 'Vasant Panchami', date: new Date('2025-02-02'), type: 'FESTIVAL', description: 'Festival' },
  { name: 'Maha Shivaratri', date: new Date('2025-02-26'), type: 'FESTIVAL', description: 'Festival' },
  { name: 'Holi', date: new Date('2025-03-14'), type: 'FESTIVAL', description: 'Festival' },
  { name: 'Good Friday', date: new Date('2025-04-18'), type: 'FESTIVAL', description: 'Christian Festival' },
  { name: 'Eid ul-Fitr', date: new Date('2025-03-31'), type: 'FESTIVAL', description: 'Islamic Festival' },
  { name: 'Ram Navami', date: new Date('2025-04-06'), type: 'FESTIVAL', description: 'Hindu Festival' },
  { name: 'Mahavir Jayanti', date: new Date('2025-04-10'), type: 'FESTIVAL', description: 'Jain Festival' },
  { name: 'Buddha Purnima', date: new Date('2025-05-12'), type: 'FESTIVAL', description: 'Buddhist Festival' },
  { name: 'Eid ul-Adha', date: new Date('2025-06-07'), type: 'FESTIVAL', description: 'Islamic Festival' },
  { name: 'Muharram', date: new Date('2025-07-06'), type: 'FESTIVAL', description: 'Islamic Festival' },
  { name: 'Janmashtami', date: new Date('2025-08-16'), type: 'FESTIVAL', description: 'Hindu Festival' },
  { name: 'Ganesh Chaturthi', date: new Date('2025-08-27'), type: 'FESTIVAL', description: 'Hindu Festival' },
  { name: 'Milad-un-Nabi', date: new Date('2025-09-05'), type: 'FESTIVAL', description: 'Islamic Festival' },
  { name: 'Dussehra', date: new Date('2025-10-02'), type: 'FESTIVAL', description: 'Hindu Festival' },
  { name: 'Diwali', date: new Date('2025-10-20'), type: 'FESTIVAL', description: 'Hindu Festival' },
  { name: 'Diwali (Lakshmi Puja)', date: new Date('2025-10-21'), type: 'FESTIVAL', description: 'Hindu Festival' },
  { name: 'Govardhan Puja', date: new Date('2025-10-22'), type: 'FESTIVAL', description: 'Hindu Festival' },
  { name: 'Bhai Dooj', date: new Date('2025-10-23'), type: 'FESTIVAL', description: 'Hindu Festival' },
  { name: 'Guru Nanak Jayanti', date: new Date('2025-11-05'), type: 'FESTIVAL', description: 'Sikh Festival' },
  { name: 'Christmas', date: new Date('2025-12-25'), type: 'FESTIVAL', description: 'Christian Festival' },
];

/**
 * GET /api/holidays
 * Fetch all holidays, optionally filtered by year
 */
exports.getHolidays = async (req, res, next) => {
  try {
    const { year } = req.query;
    const where = {};
    if (year) where.year = parseInt(year);

    const holidays = await prisma.holidayCalendar.findMany({
      where,
      orderBy: { date: 'asc' }
    });
    res.json({ success: true, data: holidays });
  } catch (error) { next(error); }
};

/**
 * POST /api/holidays/seed
 * Seed Indian holidays for a given year (idempotent)
 */
exports.seedHolidays = async (req, res, next) => {
  try {
    const { year = 2025 } = req.body;
    const targetYear = parseInt(year);

    const existing = await prisma.holidayCalendar.count({ where: { year: targetYear } });
    if (existing > 0) {
      return res.json({ success: true, message: `Holidays for ${targetYear} already seeded (${existing} records)` });
    }

    const holidays2025 = INDIA_HOLIDAYS_2025.map(h => ({
      ...h,
      date: new Date(h.date.getFullYear() === 2025 ? h.date.toISOString().replace('2025', String(targetYear)) : h.date),
      year: targetYear
    }));

    await prisma.holidayCalendar.createMany({ data: holidays2025, skipDuplicates: true });

    res.json({ success: true, message: `Seeded ${holidays2025.length} holidays for ${targetYear}` });
  } catch (error) { next(error); }
};

/**
 * POST /api/holidays
 * Add a custom company holiday
 */
exports.addHoliday = async (req, res, next) => {
  try {
    const { name, date, type = 'COMPANY', description } = req.body;
    if (!name || !date) return res.status(400).json({ success: false, message: 'name and date are required' });

    const d = new Date(date);
    const holiday = await prisma.holidayCalendar.create({
      data: {
        name,
        date: d,
        year: d.getFullYear(),
        type,
        description,
        isReadOnly: false
      }
    });
    res.status(201).json({ success: true, data: holiday });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/holidays/:id
 * Remove a company holiday (cannot delete national/read-only ones)
 */
exports.deleteHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const h = await prisma.holidayCalendar.findUnique({ where: { id } });
    if (!h) return res.status(404).json({ success: false, message: 'Holiday not found' });
    if (h.isReadOnly) return res.status(403).json({ success: false, message: 'National holidays cannot be deleted' });

    await prisma.holidayCalendar.delete({ where: { id } });
    res.json({ success: true, message: 'Holiday removed' });
  } catch (error) { next(error); }
};
