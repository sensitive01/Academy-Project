const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Mark = require('../models/Mark');
const Otp = require('../models/Otp');
const nodemailer = require('nodemailer');

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to mask email
// Shows first 2 characters, masks the rest before '@'
const maskEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  const visibleLength = Math.min(2, localPart.length);
  const visible = localPart.substring(0, visibleLength);
  const maskedLength = Math.max(0, localPart.length - visibleLength);
  const masked = '*'.repeat(maskedLength > 0 ? (maskedLength > 5 ? 5 : maskedLength) : 3);

  return `${visible}${masked}@${domain}`;
};

// @route   GET /api/public-results/student/:studentId
// @desc    Get student details for result search
router.get('/student/:studentId', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });

    if (!student) {
      return res.status(404).json({ message: 'Student not found with this Roll Number' });
    }

    res.json({
      name: student.studentNameEnglish,
      maskedEmail: maskEmail(student.email)
    });
  } catch (error) {
    console.error('GET STUDENT FOR RESULT ERROR:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/public-results/results
// @desc    Verify DOB and fetch results
router.post('/results', async (req, res) => {
  try {
    const { studentId, dob } = req.body;

    if (!studentId || !dob) {
      return res.status(400).json({ message: 'Student ID and Date of Birth are required' });
    }

    const student = await Student.findOne({ studentId })
      .populate('enrolledCourses.course', 'title')
      .populate('enrolledCourses.batch', 'numberOfSemesters name')
      .populate('center');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.dob) {
      return res.status(400).json({ message: 'DOB not registered for this student. Contact administration.' });
    }

    const studentDob = new Date(student.dob);
    const day = String(studentDob.getDate()).padStart(2, '0');
    const month = String(studentDob.getMonth() + 1).padStart(2, '0');
    const year = studentDob.getFullYear();
    const formattedStoredDob = `${day}-${month}-${year}`;

    if (dob !== formattedStoredDob) {
      return res.status(400).json({ message: 'Invalid Date of Birth' });
    }

    // Fetch marks
    const marks = await Mark.find({ student: student._id })
      .populate('course', 'title')
      .populate('batch', 'name')
      .populate('subject', 'name code type')
      .sort({ semester: 1 });

    let courseName = '';
    let batchName = '';
    let totalSemesters = 0;
    if (student.enrolledCourses && student.enrolledCourses.length > 0) {
      if (student.enrolledCourses[0].course) {
        courseName = student.enrolledCourses[0].course.title;
      }
      if (student.enrolledCourses[0].batch) {
        if (student.enrolledCourses[0].batch.numberOfSemesters) {
          totalSemesters = student.enrolledCourses[0].batch.numberOfSemesters;
        }
        if (student.enrolledCourses[0].batch.name) {
          batchName = student.enrolledCourses[0].batch.name;
        }
      }
    }

    res.status(200).json({
      message: 'Verified successfully',
      student: {
        name: student.studentNameEnglish,
        studentId: student.studentId,
        courseName: courseName,
        batchName: batchName,
        totalSemesters: totalSemesters
      },
      studentFull: student,
      marks
    });
  } catch (error) {
    console.error('VERIFY OTP & FETCH RESULTS ERROR:', error);
    res.status(500).json({ message: 'Verification or fetching results failed' });
  }
});

const puppeteer = require('puppeteer');

// @route   POST /api/public-results/generate-pdf
// @desc    Generate PDF from HTML
router.post('/generate-pdf', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { html, styleTags, baseUrl } = req.body;

    if (!html) {
      return res.status(400).json({ message: 'HTML content is required' });
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <base href="${baseUrl}/">
          <meta charset="UTF-8">
          ${styleTags || ''}
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              background: #ffffff;
              display: inline-block; /* Forces body to wrap content tightly */
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    await page.setContent(fullHtml, { waitUntil: ['load', 'networkidle0'] });

    // Get the exact dimensions of the full document
    const boundingBox = await page.evaluate(() => {
      // Small trick to force CSS to recognize the bottom border
      const el = document.querySelector('.print-marksheet');
      if (el) {
        el.style.pageBreakInside = 'avoid';
        el.style.breakInside = 'avoid';
      }
      return {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight
      };
    });

    const pdfBuffer = await page.pdf({
      width: `${boundingBox.width}px`,
      height: `${boundingBox.height + 40}px`, // Extra large padding to absolutely guarantee no overflow
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: '1' // Strictly one page so the browser never fragments the border
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=marksheet.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF GENERATION ERROR:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

module.exports = router;
