const prisma = require('../config/prisma');

// Basic in-memory rate limiting and spam detection
const rateLimitMap = new Map();
const SPAM_KEYWORDS = ['viagra', 'casino', 'lottery', 'seo services', 'buy followers', 'crypto'];

const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    // Rate limiting: 1 request per IP every 5 minutes
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip);
    if (lastRequest && now - lastRequest < 5 * 60 * 1000) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Basic validation
    if (!name || !email || !message || message.length < 15) {
      return res.status(400).json({ error: 'Invalid input. Please provide name, valid email, and a message.' });
    }

    // Spam keyword checking
    const lowerMessage = message.toLowerCase();
    const isSpam = SPAM_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
    if (isSpam) {
      // Silently succeed for bots
      rateLimitMap.set(ip, now);
      return res.status(200).json({ success: true, message: 'Message received.' });
    }

    // Check duplicate identical messages in the last hour
    const recentDuplicate = await prisma.supportTicket.findFirst({
      where: {
        submittedBy: 'GUEST',
        title: `Contact Form: ${subject || 'Inquiry'}`,
        createdAt: { gte: new Date(now - 60 * 60 * 1000) }
      }
    });

    if (recentDuplicate && recentDuplicate.description.includes(message.substring(0, 50))) {
      return res.status(429).json({ error: 'Duplicate message detected.' });
    }

    rateLimitMap.set(ip, now);

    const description = `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSubject: ${subject || 'N/A'}\n\nMessage:\n${message}`;

    await prisma.supportTicket.create({
      data: {
        submittedBy: 'GUEST',
        type: 'OTHER',
        priority: 'MEDIUM',
        title: `Contact Form: ${subject || 'Inquiry'}`,
        description,
        status: 'OPEN'
      }
    });

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContact
};
