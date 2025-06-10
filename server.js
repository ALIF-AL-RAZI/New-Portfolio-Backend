const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://www.alifalrazi.com' || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'alifalrazi1@gmail.com',
      pass: 'rgbd ygrp knzb boqj',
    },
  });
};

// Test email configuration on startup
const testEmailConfig = async () => {
  console.log('🔍 Testing email configuration...');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not found in environment variables');
    console.log('Current env vars:', {
      EMAIL_USER: process.env.EMAIL_USER ? '✓ Set' : '❌ Missing',
      EMAIL_PASS: process.env.EMAIL_PASS ? '✓ Set' : '❌ Missing',
      PORT: process.env.PORT || 'Using default (5000)',
      FRONTEND_URL: process.env.FRONTEND_URL || 'Using default (http://localhost:3000)'
    });
    return false;
  }
  
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required.' 
      });
    }
    
    const transporter = createTransporter();
    
    // Send emails
    await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `New Contact Form Message from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
        replyTo: email
      }),
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Thank you for your message!',
        html: `
          <h2>Thank You for Reaching Out!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for your message. I've received it and will get back to you soon.</p>
          <p>Best regards,<br>Alif Al Razi</p>
        `
      })
    ]);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully!' 
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send message.' 
    });
  }
});

// 404 for other routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Start server after testing email config
testEmailConfig().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Email service configured for: ${process.env.EMAIL_USER || 'Not configured'}`);
  });
});