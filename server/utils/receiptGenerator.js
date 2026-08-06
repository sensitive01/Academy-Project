const PDFDocument = require("pdfkit");
const toWords = require("number-to-words");

/**
 * Utility to generate a standardized receipt/invoice PDF.
 * @param {Object} res - Express response object
 * @param {Object} data - Receipt data
 * @param {string} data.documentTitle - e.g., "TAX INVOICE", "FEE RECEIPT"
 * @param {string} data.receiptNo - e.g., "INV-12345678"
 * @param {Date|string} data.date - Date of the transaction
 * @param {string} data.transactionId - Razorpay ID, Bank Reference, etc.
 * @param {Object} data.billedTo - { name, id, email, phone }
 * @param {Object} [data.issuedBy] - { name, addressLine1, addressLine2, contact } (optional)
 * @param {Array} data.items - [{ description, qty, amount }]
 * @param {number} data.totalAmount - Total numerical amount
 * @param {string} data.status - e.g., "PAID", "PENDING"
 * @param {string} [data.filename] - e.g., "Receipt_123.pdf" (optional, fallback to receiptNo)
 */
const generateReceiptPDF = (res, data) => {
  try {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    const filename = data.filename || `Receipt_${data.receiptNo}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Colors & Fonts
    const primaryColor = "#0f172a"; // Slate-900
    const accentColor = "#3b82f6"; // Blue-500
    const textDark = "#1e293b";
    const textLight = "#64748b";
    const borderColor = "#e2e8f0";

    // Header / Logo area
    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("DR ACADEMY", 50, 50);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(textLight)
      .text("Empowering Excellence in Education", 50, 80);

    // Invoice Header
    doc
      .fillColor(primaryColor)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(data.documentTitle || "RECEIPT", doc.page.width - 250, 50, { align: "right" });

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(textLight)
      .text(`Receipt No: ${data.receiptNo}`, doc.page.width - 250, 75, { align: "right" })
      .text(`Date: ${new Date(data.date).toLocaleDateString("en-IN")}`, doc.page.width - 250, 90, { align: "right" });
    
    if (data.transactionId) {
      doc.text(`Transaction ID: ${data.transactionId}`, doc.page.width - 250, 105, { align: "right" });
    }

    doc.moveDown(3);

    // Bill To & Company Info
    const startY = 150;

    // Left: Bill To
    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text("BILL TO:", 50, startY);
    doc.fontSize(10).font("Helvetica").fillColor(textDark);
    
    const billedTo = data.billedTo || {};
    doc.text(billedTo.name || "N/A", 50, startY + 20);
    if (billedTo.id) doc.text(`ID: ${billedTo.id}`, 50, startY + 35);
    if (billedTo.email) doc.text(billedTo.email, 50, startY + 50);
    if (billedTo.phone) doc.text(billedTo.phone, 50, startY + 65);

    // Right: Center/Company Info
    const issuedBy = data.issuedBy || {
      name: "DR Academy HQ",
      addressLine1: "123 Education Lane, Knowledge Park",
      addressLine2: "Chennai, Tamil Nadu - 600001",
      contact: "Contact: +91 98765 43210"
    };

    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text("ISSUED BY:", 300, startY);
    doc.fontSize(10).font("Helvetica").fillColor(textDark);
    doc.text(issuedBy.name || "", 300, startY + 20)
      .text(issuedBy.addressLine1 || "", 300, startY + 35)
      .text(issuedBy.addressLine2 || "", 300, startY + 50)
      .text(issuedBy.contact || "", 300, startY + 65);

    doc.moveDown(4);

    // Table Header
    const tableTop = 260;
    doc.rect(50, tableTop, doc.page.width - 100, 25).fill(primaryColor);
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");
    doc.text("Item Description", 60, tableTop + 7);
    doc.text("Qty", 350, tableTop + 7, { width: 50, align: "center" });
    doc.text("Amount", 450, tableTop + 7, { width: 80, align: "right" });

    // Table Rows
    let rowY = tableTop + 35;
    const items = data.items || [];
    doc.fillColor(textDark).font("Helvetica").fontSize(10);
    
    items.forEach(item => {
      doc.text(item.description || "N/A", 60, rowY, { width: 280 });
      doc.text(item.qty ? String(item.qty) : "1", 350, rowY, { width: 50, align: "center" });
      doc.text(`INR ${Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 450, rowY, { width: 80, align: "right" });
      rowY += 20;
    });

    // Summary Lines
    const summaryY = rowY + 30;
    doc.moveTo(300, summaryY).lineTo(530, summaryY).lineWidth(0.5).strokeColor(borderColor).stroke();

    doc.fillColor(textLight).fontSize(10).text("Total Amount:", 300, summaryY + 20);
    const totalAmount = Number(data.totalAmount || 0);
    doc.fillColor(primaryColor).font("Helvetica-Bold").text(`INR ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 450, summaryY + 20, { width: 80, align: "right" });

    // Amount in Words
    try {
      const words = toWords.toWords(totalAmount).replace(/-/g, " ");
      doc.moveDown(3);
      doc.fillColor(textLight).fontSize(9).font("Helvetica-Oblique")
        .text(`Amount in words: Rupees ${words} only.`, 50, summaryY + 60);
    } catch (e) {
      console.error("Number to words conversion error:", e);
    }

    // Status Stamp
    const status = (data.status || "").toLowerCase();
    if (status === "success" || status === "paid") {
      doc.rect(50, summaryY + 100, 100, 40).lineWidth(2).strokeColor("#22c55e").stroke();
      doc.fillColor("#22c55e").fontSize(16).font("Helvetica-Bold").text("PAID", 50, summaryY + 112, { width: 100, align: "center" });
    } else if (status === "pending_approval" || status === "pending") {
      doc.rect(50, summaryY + 100, 120, 40).lineWidth(2).strokeColor("#f59e0b").stroke();
      doc.fillColor("#f59e0b").fontSize(16).font("Helvetica-Bold").text("PENDING", 50, summaryY + 112, { width: 120, align: "center" });
    }

    // Footer
    doc.fontSize(8).fillColor(textLight)
      .text(
        "This is an electronically generated document and does not require a physical signature.", 
        50, 
        doc.page.height - 70, 
        { align: "center", width: doc.page.width - 100 }
      );

    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate PDF document" });
    }
  }
};

module.exports = { generateReceiptPDF };
