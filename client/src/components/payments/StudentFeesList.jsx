import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CustomDataTable from "../common/DataTable";
import toast from "react-hot-toast";
import AddStudentFeeModal from "../modals/AddStudentFeeModal";
import CollectPaymentModal from "./CollectPaymentModal";
import { downloadReceipt } from "../../utils/downloadReceipt";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import ReactDOM from "react-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

const StudentFeesList = ({ feeType, paidOnly, excludePaid }) => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedCenter, setSelectedCenter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");

  const getAmountForMonth = (row, targetMonthName) => {
    const monthMap = {
      "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11,
      "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5
    };
    const targetMonthIndex = monthMap[targetMonthName];

    let totalForMonth = 0;

    if (row.payments && row.payments.length > 0) {
      row.payments.forEach(p => {
        if (p.status === 'Approved' && p.paidAt) {
          const pDate = new Date(p.paidAt);
          if (pDate.getMonth() === targetMonthIndex) {
            totalForMonth += p.amount;
          }
        }
      });
    } else if (row.status === 'paid') {
      const pDate = row.paidAt ? new Date(row.paidAt) : new Date(row.createdAt);
      if (pDate.getMonth() === targetMonthIndex) {
        totalForMonth = row.amount;
      }
    }

    return totalForMonth;
  };

  const getRemainingBalance = (row) => {
    const totalDue = row.amount + 
      (row.isPenaltyApplied ? row.penaltyAmount : 0) + 
      (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0);
    
    const totalApprovedPaid = row.payments
      ? row.payments
          .filter(p => p.status === 'Approved')
          .reduce((sum, p) => sum + p.amount, 0)
      : (row.status === 'paid' ? row.amount : 0);

    return Math.max(0, totalDue - totalApprovedPaid);
  };

  const getSelectedSchemeName = (group) => {
    if (!group.originalFees || group.originalFees.length === 0) return "";
    
    // Check if there are any Monthly fee records
    const hasMonthly = group.originalFees.some(f => f.feeType === 'Monthly');
    if (hasMonthly) {
      return "Monthly (12 Split)";
    }

    // Check if there are any Sem fee records
    const hasSem = group.originalFees.some(f => f.feeType === 'Sem');
    if (hasSem) {
      return "Semester (2 Split)";
    }

    // Check if there are any Term fee records
    const termFees = group.originalFees.filter(f => f.feeType === 'Term');
    if (termFees.length > 0) {
      let maxTerm = 0;
      termFees.forEach(tf => {
        if (tf.terms && tf.terms[0]) {
          maxTerm = Math.max(maxTerm, tf.terms[0]);
        }
        if (tf.otherFeeType) {
          const match = tf.otherFeeType.match(/Term\s*(\d+)/i);
          if (match) {
            maxTerm = Math.max(maxTerm, parseInt(match[1]));
          }
        }
      });

      if (maxTerm === 4 || termFees.length === 4) {
        return "Term (4 Split)";
      }
      return "Term (3 Split)";
    }
    return "";
  };

  const getSchemeBadgeLabel = (group) => {
    if (feeType === 'Council') return "Council Fees";
    if (feeType === 'Other') return group.otherFeeType || "Other Fees";
    
    const schemeName = getSelectedSchemeName(group);
    return schemeName || group.feeType || "Course Fees";
  };

  useEffect(() => {
    fetchFees();
    fetchDropdownData();
    // Reset filters on tab changes
    setSelectedCenter("all");
    setSelectedCourse("all");
    setSelectedBatch("all");
    setSelectedStatus("all");
  }, [feeType, excludePaid]);
 
  const fetchDropdownData = async () => {
    try {
      const [studentsRes, centersRes, coursesRes, batchesRes] = await Promise.all([
        api.get("/students"),
        api.get("/centers"),
        api.get("/courses"),
        api.get("/batches")
      ]);
      const allStudents = studentsRes.data.students || studentsRes.data || [];
      setStudents(allStudents.filter(s => !!s.center));
      setCenters(centersRes.data || []);
      setCourses(coursesRes.data || []);
      setBatches(batchesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFee = async (formData) => {
    try {
      const res = await api.post("/student-fees", formData);
      setFees([res.data, ...fees]);
      setShowModal(false);
      toast.success("Fee added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add fee");
    }
  };
  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/student-fees");
      // Filter by feeType prop
      let filteredData = res.data.filter(f => {
        if (!f.student) return false;
        if (feeType === 'All') return true;
        if (feeType === 'Council') return f.feeType === 'Council' || (f.feeType === 'Other' && f.otherFeeType === 'Council Fees');
        if (feeType === 'Course') return ['Sem', 'Term', 'Monthly'].includes(f.feeType);
        if (feeType === 'Both') return ['Sem', 'Term', 'Monthly'].includes(f.feeType) || f.feeType === 'Council' || (f.feeType === 'Other' && f.otherFeeType === 'Council Fees');
        if (feeType === 'Other') return f.feeType === 'Other' && f.otherFeeType !== 'Council Fees';
        return f.feeType === feeType;
      });

      if (paidOnly) {
        // Flatten all approved payments into distinct transaction rows
        const transactions = [];
        filteredData.forEach(f => {
          const approvedPayments = f.payments ? f.payments.filter(p => p.status === 'Approved') : [];
          if (approvedPayments.length > 0) {
            approvedPayments.forEach(p => {
              transactions.push({
                _id: `${f._id}_${p._id || Math.random()}`,
                student: f.student,
                course: f.course,
                batch: f.batch,
                center: f.center,
                feeType: f.feeType,
                otherFeeType: f.otherFeeType,
                paymentMode: p.paymentMode,
                amount: p.amount, // specific payment amount
                paidAt: p.paidAt,
                proofOfPayment: p.proofOfPayment,
                bankReference: p.bankReference,
                status: 'paid',
                originalFeeId: f._id,
                paymentId: p._id
              });
            });
          } else if (f.status === 'paid') {
            // Legacy paid record
            transactions.push({
              _id: f._id,
              student: f.student,
              course: f.course,
              batch: f.batch,
              center: f.center,
              feeType: f.feeType,
              otherFeeType: f.otherFeeType,
              paymentMode: f.paymentMode,
              amount: f.amount,
              paidAt: f.paidAt || f.createdAt,
              proofOfPayment: f.proofOfPayment,
              bankReference: f.bankReference,
              status: 'paid',
              originalFeeId: f._id
            });
          }
        });

        // Sort transactions by date descending (newest first)
        transactions.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
        setFees(transactions);
      } else if (feeType === 'Exam') {
        const sorted = [...filteredData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setFees(sorted);
      } else {
        // Group by student for Fees Collection (excludePaid)
        const grouped = [];
        const studentMap = {};

        filteredData.forEach(f => {
          const studentId = f.student?._id?.toString();
          if (!studentId) return;

          const feeYear = f.year || f.student?.year || "Unknown Year";
          const groupKey = `${studentId}_${feeYear}`;

          if (!studentMap[groupKey]) {
            studentMap[groupKey] = {
              _id: groupKey, // Use groupKey as row ID
              studentId: studentId,
              year: feeYear,
              student: f.student,
              course: f.course,
              batch: f.batch,
              center: f.center,
              feeType: feeType === 'Course' ? 'Course' : (feeType === 'Both' ? 'Both' : f.feeType),
              otherFeeType: f.otherFeeType,
              amount: 0,
              penaltyAmount: 0,
              finalPenaltyAmount: 0,
              isPenaltyApplied: false,
              isFinalPenaltyApplied: false,
              payments: [],
              status: 'paid', // default, calculated below
              createdAt: f.createdAt,
              originalFees: [],
              courseAmount: 0,
              councilAmount: 0,
              coursePenaltyAmount: 0,
              councilPenaltyAmount: 0,
              coursePayments: [],
              councilPayments: []
            };
            grouped.push(studentMap[groupKey]);
          }

          const group = studentMap[groupKey];
          group.originalFees.push(f);
          group.amount += f.amount || 0;
          
          let isCourse = ['Sem', 'Term', 'Monthly'].includes(f.feeType);
          let isCouncil = f.feeType === 'Council' || (f.feeType === 'Other' && f.otherFeeType === 'Council Fees');

          if (isCourse) group.courseAmount += f.amount || 0;
          if (isCouncil) group.councilAmount += f.amount || 0;

          if (f.isPenaltyApplied) {
            group.isPenaltyApplied = true;
            group.penaltyAmount += f.penaltyAmount || 0;
            if (isCourse) group.coursePenaltyAmount += f.penaltyAmount || 0;
            if (isCouncil) group.councilPenaltyAmount += f.penaltyAmount || 0;
          }
          if (f.isFinalPenaltyApplied) {
            group.isFinalPenaltyApplied = true;
            group.finalPenaltyAmount += f.finalPenaltyAmount || 0;
            if (isCourse) group.coursePenaltyAmount += f.finalPenaltyAmount || 0;
            if (isCouncil) group.councilPenaltyAmount += f.finalPenaltyAmount || 0;
          }

          // Combine payments
          if (f.payments && f.payments.length > 0) {
            f.payments.forEach(p => {
              group.payments.push(p);
              if (isCourse) group.coursePayments.push(p);
              if (isCouncil) group.councilPayments.push(p);
            });
          } else if (f.status === 'paid') {
            // Legacy paid record: simulate a payment to make the math work
            const dummyPayment = {
              amount: f.amount,
              status: 'Approved',
              paidAt: f.paidAt || f.createdAt
            };
            group.payments.push(dummyPayment);
            if (isCourse) group.coursePayments.push(dummyPayment);
            if (isCouncil) group.councilPayments.push(dummyPayment);
          }
        });

        // Recalculate status for each group
        grouped.forEach(group => {
          const totalDue = group.amount + group.penaltyAmount + group.finalPenaltyAmount;
          const totalApprovedPaid = group.payments
            .filter(p => p.status === 'Approved')
            .reduce((sum, p) => sum + p.amount, 0);
          
          const remaining = totalDue - totalApprovedPaid;
          
          if (remaining <= 0) {
            group.status = 'paid';
          } else {
            // Check if there is any pending payment awaiting approval
            const hasPendingApproval = group.originalFees.some(f => f.status === 'pending_approval');
            if (hasPendingApproval) {
              group.status = 'pending_approval';
            } else {
              group.status = 'pending';
            }
          }
        });

        // Filter groups according to paidOnly / excludePaid filters
        let finalGroups = grouped;
        if (excludePaid) {
          // Show students who still have a pending remaining balance
          finalGroups = grouped.filter(group => {
            const totalDue = group.amount + group.penaltyAmount + group.finalPenaltyAmount;
            const totalApprovedPaid = group.payments
              .filter(p => p.status === 'Approved')
              .reduce((sum, p) => sum + p.amount, 0);
            const remaining = totalDue - totalApprovedPaid;
            return remaining > 0;
          });
        }

        setFees(finalGroups);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/student-fees/${id}/toggle-status`);
      setFees(fees.map(f => f._id === id ? res.data : f));
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleCollectPayment = async (studentId, data, targetFeeType, year) => {
    try {
      await api.post(`/student-fees/collect-cascade`, {
        studentId,
        feeType: targetFeeType || feeType,
        year,
        ...data
      });
      fetchFees();
      setShowCollectModal(false);
      setSelectedFee(null);
      toast.success("Payment processed successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process payment");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fee record?")) return;
    try {
      await api.delete(`/student-fees/${id}`);
      setFees(fees.filter(f => f._id !== id));
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filtered = fees.filter((f) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      f.student?.studentNameEnglish?.toLowerCase().includes(term) ||
      f.student?.studentId?.toLowerCase().includes(term) ||
      f.course?.title?.toLowerCase().includes(term) ||
      f.center?.name?.toLowerCase().includes(term) ||
      f.batch?.name?.toLowerCase().includes(term);

    const fCenterId = f.center?._id ? f.center._id.toString() : f.center ? f.center.toString() : "";
    const matchesCenter = selectedCenter === "all" || fCenterId === selectedCenter || f.center?.name === selectedCenter;

    const fCourseId = f.course?._id ? f.course._id.toString() : f.course ? f.course.toString() : "";
    const matchesCourse = selectedCourse === "all" || fCourseId === selectedCourse || f.course?.title === selectedCourse;

    const fBatchId = f.batch?._id ? f.batch._id.toString() : f.batch ? f.batch.toString() : "";
    const matchesBatch = selectedBatch === "all" || fBatchId === selectedBatch || (f.batch?.name || f.batch?.batchId) === selectedBatch;

    let matchesStatus = true;
    if (selectedStatus !== "all") {
      if (selectedStatus === "paid") {
        matchesStatus = f.status === "paid";
      } else if (selectedStatus === "pending_approval") {
        matchesStatus = f.status === "pending_approval";
      } else if (selectedStatus === "unpaid") {
        matchesStatus = f.status !== "paid" && f.status !== "pending_approval";
      }
    }

    return matchesSearch && matchesCenter && matchesCourse && matchesBatch && matchesStatus;
  });

  const handleExport = () => {
    setShowExportModal(false);
    if (paidOnly) {
      if (exportFormat === "excel") {
        const data = filtered.map((f, i) => {
          let lbl = f.feeType;
          if (f.feeType === 'Other' && f.otherFeeType) {
            lbl = f.otherFeeType;
          } else if (f.feeType === 'Sem') {
            lbl = f.otherFeeType || 'Semester Fee';
          } else if (f.feeType === 'Term') {
            lbl = f.otherFeeType || 'Term Fee';
          } else if (f.feeType === 'Monthly') {
            lbl = f.otherFeeType || 'Monthly Fee';
          }

          return {
            "S.No": i + 1,
            "Student Name": f.student?.studentNameEnglish || "N/A",
            "Student ID": f.student?.studentId || "-",
            "Course": f.course?.title || "-",
            "Batch": f.batch?.name || "-",
            "Center": f.center?.name || "-",
            "Fee Type": lbl,
            "Amount Paid": f.amount || 0,
            "Payment Mode": f.paymentMode || "-",
            "Reference": f.bankReference || "-",
            "Paid Date": f.paidAt ? new Date(f.paidAt).toLocaleDateString("en-IN") : "-"
          };
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inward Payments");
        XLSX.writeFile(workbook, `${feeType}_Inward_Payments_Report.xlsx`);
        toast.success("Excel exported successfully!");
      } else {
        const doc = new jsPDF({ orientation: "landscape" });
        doc.text(`${feeType} Inward Payments Report`, 14, 15);
        
        const tableColumn = ["S.No", "Student", "Course & Batch", "Center", "Type", "Amount Paid", "Mode", "Reference", "Paid Date"];
        const tableRows = [];
        filtered.forEach((f, index) => {
          let lbl = f.feeType;
          if (f.feeType === 'Other' && f.otherFeeType) {
            lbl = f.otherFeeType;
          } else if (f.feeType === 'Sem') {
            lbl = f.otherFeeType || 'Semester Fee';
          } else if (f.feeType === 'Term') {
            lbl = f.otherFeeType || 'Term Fee';
          } else if (f.feeType === 'Monthly') {
            lbl = f.otherFeeType || 'Monthly Fee';
          }

          const rowData = [
            index + 1,
            `${f.student?.studentNameEnglish || "N/A"} (${f.student?.studentId || "-"})`,
            `${f.course?.title || "-"} / ${f.batch?.name || "-"}`,
            f.center?.name || "-",
            lbl,
            `Rs. ${f.amount.toLocaleString("en-IN")}`,
            f.paymentMode || "-",
            f.bankReference || "-",
            f.paidAt ? new Date(f.paidAt).toLocaleDateString("en-IN") : "-"
          ];
          tableRows.push(rowData);
        });
        
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 20,
          theme: "striped",
          styles: { fontSize: 8, cellPadding: 2 }
        });
        
        const pdfBlob = doc.output("blob");
        saveAs(pdfBlob, `${feeType}_Inward_Payments_Report.pdf`);
        toast.success("PDF exported successfully!");
      }
      return;
    }

    if (exportFormat === "excel") {
      const data = filtered.map((f, i) => {
        const totalDue = f.amount + 
          (f.isPenaltyApplied ? f.penaltyAmount : 0) + 
          (f.isFinalPenaltyApplied ? f.finalPenaltyAmount : 0);
          
        const exportRow = {
          "S.No": i + 1,
          "Student Name": f.student?.studentNameEnglish || "N/A",
          "Student ID": f.student?.studentId || "-",
          "Course": f.course?.title || "-",
          "Batch": f.batch?.name || "-",
          "Center": f.center?.name || "-",
          "Fee Type": f.feeType === 'Other' && f.otherFeeType ? f.otherFeeType : f.feeType,
          "Total Fee": totalDue || 0,
        };

        if (feeType !== 'Exam') {
          ["July", "August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June"].forEach(month => {
            exportRow[month] = getAmountForMonth(f, month);
          });
        }

        exportRow["Balance"] = getRemainingBalance(f);
        exportRow["Status"] = f.status || "-";
        exportRow["Created Date"] = f.createdAt ? new Date(f.createdAt).toLocaleDateString("en-IN") : "-";

        return exportRow;
      });
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Fees");
      XLSX.writeFile(workbook, `${feeType}_Fees_Report.xlsx`);
      toast.success("Excel exported successfully!");
    } else {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.text(`${feeType} Fees Report`, 14, 15);
      
      const tableColumn = ["S.No", "Student", "Course & Batch", "Center", "Total Fee"];
      if (feeType !== 'Exam') {
        tableColumn.push("July", "August", "Sept", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "June");
      }
      tableColumn.push("Balance", "Status");
      
      const tableRows = [];
      filtered.forEach((f, index) => {
        const totalDue = f.amount + 
          (f.isPenaltyApplied ? f.penaltyAmount : 0) + 
          (f.isFinalPenaltyApplied ? f.finalPenaltyAmount : 0);
          
        const rowData = [
          index + 1,
          `${f.student?.studentNameEnglish || "N/A"} (${f.student?.studentId || "-"})`,
          `${f.course?.title || "-"} / ${f.batch?.name || "-"}`,
          f.center?.name || "-",
          `Rs. ${totalDue.toLocaleString("en-IN")}`
        ];
        
        if (feeType !== 'Exam') {
          rowData.push(
            getAmountForMonth(f, "July"),
            getAmountForMonth(f, "August"),
            getAmountForMonth(f, "September"),
            getAmountForMonth(f, "October"),
            getAmountForMonth(f, "November"),
            getAmountForMonth(f, "December"),
            getAmountForMonth(f, "January"),
            getAmountForMonth(f, "February"),
            getAmountForMonth(f, "March"),
            getAmountForMonth(f, "April"),
            getAmountForMonth(f, "May"),
            getAmountForMonth(f, "June")
          );
        }
        
        rowData.push(
          `Rs. ${getRemainingBalance(f).toLocaleString("en-IN")}`,
          f.status || "-"
        );
        tableRows.push(rowData);
      });
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 }
      });
      
      const pdfBlob = doc.output("blob");
      saveAs(pdfBlob, `${feeType}_Fees_Report.pdf`);
      toast.success("PDF exported successfully!");
    }
  };

  const monthColumns = [
    "July", "August", "September", "October", "November", "December",
    "January", "February", "March", "April", "May", "June"
  ].map(monthName => ({
    name: monthName,
    width: "90px",
    selector: row => getAmountForMonth(row, monthName),
    cell: row => {
      const amt = getAmountForMonth(row, monthName);
      return amt > 0 ? (
        <span className="font-bold text-slate-800">₹{amt.toLocaleString('en-IN')}</span>
      ) : (
        <span className="text-slate-350">-</span>
      );
    }
  }));

  const columns = paidOnly ? [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    { 
      name: "Student", width:"180px", 
      selector: row => row.student?.studentNameEnglish, 
      sortable: true,
      cell: row => (
        <div>
          <div className="font-bold text-gray-800">{row.student?.studentNameEnglish || "N/A"}</div>
          <div className="text-[10px] text-gray-500 font-bold">{row.student?.studentId || ""}</div>
          <div className="text-[10px] text-brand-600 font-bold">{row.year || row.student?.year || ""}</div>
        </div>
      )
    },
    { 
      name: "Course & Batch", 
      selector: row => row.course?.title, 
      sortable: true, width:"250px",
      cell: row => (
        <div>
          <div className="font-medium text-gray-700 truncate max-w-[200px]">{row.course?.title || "-"}</div>
          <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{row.batch?.name || "-"}</div>
        </div>
      )
    },
    { 
      name: "Center", 
      selector: row => row.center?.name, 
      sortable: true,
      cell: row => <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">{row.center?.name || "-"}</span>
    },
    { 
      name: "Fee Type", 
      selector: row => row.feeType, 
      sortable: true,
      cell: row => {
        let lbl = row.feeType;
        if (row.feeType === 'Other' && row.otherFeeType) {
          lbl = row.otherFeeType;
        } else if (row.feeType === 'Sem') {
          lbl = row.otherFeeType || 'Semester Fee';
        } else if (row.feeType === 'Term') {
          lbl = row.otherFeeType || 'Term Fee';
        } else if (row.feeType === 'Monthly') {
          lbl = row.otherFeeType || 'Monthly Fee';
        }
        return (
          <span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded border border-brand-100 text-[10px] font-bold uppercase tracking-wider">
            {lbl}
          </span>
        );
      }
    },
    { 
      name: "Amount Paid", 
      selector: row => row.amount, 
      sortable: true, 
      cell: row => <span className="text-sm font-black text-slate-800">₹{row.amount?.toLocaleString("en-IN")}</span>
    },
    { 
      name: "Mode", 
      selector: row => row.paymentMode, 
      sortable: true,
      cell: row => <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">{row.paymentMode || "-"}</span>
    },
    { 
      name: "Reference / Proof", 
      selector: row => row.bankReference || row.proofOfPayment,
      cell: row => {
        if (row.paymentMode === 'Online' && row.proofOfPayment) {
          return (
            <a 
              href={row.proofOfPayment} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
            >
              View Proof
            </a>
          );
        }
        return <span className="font-mono text-xs text-slate-600">{row.bankReference || '-'}</span>;
      }
    },
    { 
      name: "Date", width:"110px",
      selector: row => row.paidAt, 
      sortable: true, 
      cell: row => <span className="text-gray-600 font-medium">{new Date(row.paidAt).toLocaleDateString("en-GB")}</span> 
    },
    {
      name: "Action",
      center: true,
      width: "100px",
      cell: row => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              const url = row.paymentId 
                ? `/student-fees/${row.originalFeeId}/receipt?paymentId=${row.paymentId}` 
                : `/student-fees/${row.originalFeeId || row._id}/receipt`;
              downloadReceipt(url, `FeeReceipt_${row.originalFeeId || row._id}.pdf`);
            }}
            className="text-brand-500 hover:text-brand-700 hover:bg-brand-50 p-2 rounded-lg transition-colors"
            title="Download Receipt"
          >
            <Download size={16} />
          </button>
        </div>
      )
    }
  ] : [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    { 
      name: "Student",width:"150px", 
      selector: row => row.student?.studentNameEnglish, 
      sortable: true,
      cell: row => (
        <div>
          <div className="font-bold text-gray-800">{row.student?.studentNameEnglish || "N/A"}</div>
          <div className="text-[10px] text-gray-500 font-bold">{row.student?.studentId || ""}</div>
          <div className="text-[10px] text-brand-600 font-bold">{row.year || row.student?.year || ""}</div>
        </div>
      )
    },
    { 
      name: "Course & Batch", 
      selector: row => row.course?.title, 
      sortable: true, width:"200px",
      cell: row => (
        <div>
          <div className="font-medium text-gray-700 truncate max-w-[200px]">{row.course?.title || "-"}</div>
          <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{row.batch?.name || "-"}</div>
        </div>
      )
    },
    { 
      name: "Center", 
      selector: row => row.center?.name, 
      sortable: true,
      cell: row => <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">{row.center?.name || "-"}</span>
    },
    { 
      name: feeType === 'Both' ? "Total Fees" : "Fee Details", width:"180px",
      selector: row => row.amount, 
      sortable: true, 
      cell: row => {
        const totalDue = row.amount + 
          (row.isPenaltyApplied ? row.penaltyAmount : 0) + 
          (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0);
          
        return (
          <div className="flex flex-col gap-1 py-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-800">Total: ₹{totalDue?.toLocaleString("en-IN")}</span>
              <span className="px-1.5 py-0.5 bg-brand-50 text-brand-600 rounded border border-brand-100 text-[8px] font-bold uppercase tracking-wider">
                {getSchemeBadgeLabel(row)}
              </span>
            </div>
            
            <div className="text-[9px] text-slate-500">
              Base: ₹{row.amount?.toLocaleString("en-IN")}
              {((row.isPenaltyApplied ? row.penaltyAmount : 0) + (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0)) > 0 && 
                ` + Penalty: ₹${((row.isPenaltyApplied ? row.penaltyAmount : 0) + (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0)).toLocaleString("en-IN")}`
              }
            </div>
          </div>
        );
      }
    },
    ...(feeType !== 'Exam' ? monthColumns : []),
    ...(feeType === 'Both' ? [
      {
        name: "Course Fees", width: "140px",
        selector: row => row.courseAmount,
        cell: row => {
          const totalCourseDue = row.courseAmount + row.coursePenaltyAmount;
          const coursePaid = row.coursePayments ? row.coursePayments.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0) : 0;
          const courseBal = Math.max(0, totalCourseDue - coursePaid);
          return (
            <div className="flex flex-col gap-1 py-1.5">
              <span className="text-xs font-black text-slate-800">Total: ₹{totalCourseDue?.toLocaleString("en-IN")}</span>
              <span className={`text-[10px] font-bold ${courseBal > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                Bal: ₹{courseBal.toLocaleString('en-IN')}
              </span>
            </div>
          );
        }
      },
      {
        name: "Council Fees", width: "140px",
        selector: row => row.councilAmount,
        cell: row => {
          const totalCouncilDue = row.councilAmount + row.councilPenaltyAmount;
          const councilPaid = row.councilPayments ? row.councilPayments.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0) : 0;
          const councilBal = Math.max(0, totalCouncilDue - councilPaid);
          return (
            <div className="flex flex-col gap-1 py-1.5">
              <span className="text-xs font-black text-slate-800">Total: ₹{totalCouncilDue?.toLocaleString("en-IN")}</span>
              <span className={`text-[10px] font-bold ${councilBal > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                Bal: ₹{councilBal.toLocaleString('en-IN')}
              </span>
            </div>
          );
        }
      }
    ] : []),
    {
      name: "Balance",
      width: "110px",
      selector: row => getRemainingBalance(row),
      sortable: true,
      cell: row => {
        const bal = getRemainingBalance(row);
        return (
          <span className={`font-black ${bal > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            ₹{bal.toLocaleString('en-IN')}
          </span>
        );
      }
    },
    { 
      name: "Status", width:"150px",
      selector: row => row.status, 
      sortable: true, 
      center: true,
      cell: row => {
        const bal = getRemainingBalance(row);
        if (row.status === 'paid' || bal === 0) {
          return (
            <span className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
              PAID {row.paymentMode ? `(${row.paymentMode})` : ''}
            </span>
          );
        } else if (paidOnly) {
          return (
            <span className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 animate-pulse-subtle">
              PARTIALLY PAID
            </span>
          );
        } else if (row.status === 'pending_approval') {
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 whitespace-nowrap">
                Pending Approval
              </span>
              {row.paymentMode && (
                <span className="text-[10px] text-slate-500 font-bold lowercase">
                  ({row.paymentMode})
                </span>
              )}
            </div>
          );
        } else {
          return (
            <button 
              onClick={() => {
                setSelectedFee(row);
                setShowCollectModal(true);
              }}
              className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors bg-orange-100 text-orange-700 hover:bg-orange-200"
            >
              Collect
            </button>
          );
        }
      }
    },
    { 
      name: "Date", width:"110px",
      selector: row => row.createdAt, 
      sortable: true, 
      cell: row => <span className="text-gray-600 font-medium">{new Date(row.createdAt).toLocaleDateString("en-GB")}</span> 
    },
    {
      name: "Action",
      center: true,
      width: "100px",
      cell: row => (
        <div className="flex items-center gap-1">
          {(row.status === "paid" || getRemainingBalance(row) === 0) && (
            <button 
              onClick={() => downloadReceipt(`/student-fees/${row._id}/receipt`, `FeeReceipt_${row._id}.pdf`)}
              className="text-brand-500 hover:text-brand-700 hover:bg-brand-50 p-2 rounded-lg transition-colors"
              title="Download Receipt"
            >
              <Download size={16} />
            </button>
          )}
          {!paidOnly && (
            <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">{feeType === 'All' ? 'All' : feeType} Fees</h2>
        {!paidOnly && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Fee
          </button>
        )}
      </div>
      <CustomDataTable
        columns={columns}
        data={filtered}
        progressPending={loading}
        search={search}
        setSearch={setSearch}
        searchPlaceholder={`Search ${feeType} fees by student, ID, course...`}
        pagination
        exportButton={
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export
          </button>
        }
        additionalHeaderContent={
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto py-1">
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[130px] truncate"
            >
              <option value="all">All Centers</option>
              {Array.from(new Map(centers.map(c => [c.name, { label: c.name, value: c._id }])).values()).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[160px] truncate"
            >
              <option value="all">All Courses</option>
              {Array.from(new Map(courses.map(c => [c.title || c.name, { label: c.title || c.name, value: c._id || c.title }])).values()).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[130px] truncate"
            >
              <option value="all">All Batches</option>
              {Array.from(new Map(batches.map(b => [b.name || b.batchId, { label: b.name || b.batchId, value: b.name || b.batchId }])).values()).map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>

            {!paidOnly && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[120px] truncate"
              >
                <option value="all">All Statuses</option>
                {!excludePaid && <option value="paid">Paid</option>}
                <option value="pending_approval">Pending Approval</option>
                <option value="unpaid">Unpaid</option>
              </select>
            )}

            {(selectedCenter !== "all" || selectedCourse !== "all" || selectedBatch !== "all" || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSelectedCenter("all");
                  setSelectedCourse("all");
                  setSelectedBatch("all");
                  setSelectedStatus("all");
                }}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 shadow-sm shrink-0 whitespace-nowrap animate-in fade-in"
              >
                Reset Filters
              </button>
            )}
          </div>
        }
      />
      {showModal && (
        <AddStudentFeeModal 
          onClose={() => setShowModal(false)}
          onSave={handleSaveFee}
          students={students}
          centers={centers}
          courses={courses}
          batches={batches}
          initialFeeType={feeType}
        />
      )}
      {showCollectModal && selectedFee && (
        <CollectPaymentModal
          fee={selectedFee}
          schemeLabel={getSchemeBadgeLabel(selectedFee)}
          onClose={() => {
            setShowCollectModal(false);
            setSelectedFee(null);
          }}
          onSave={handleCollectPayment}
        />
      )}

      {/* EXPORT MODAL */}
      {showExportModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Export Data</h3>
            <p className="text-slate-500 text-xs mb-6">Choose your preferred format to export the filtered list.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setExportFormat("excel")}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  exportFormat === "excel"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${exportFormat === "excel" ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400"}`}>
                  <FileSpreadsheet size={20} />
                </div>
                <span className="text-xs font-bold">Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => setExportFormat("pdf")}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  exportFormat === "pdf"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${exportFormat === "pdf" ? "bg-red-500 text-white" : "bg-slate-50 text-slate-400"}`}>
                  <FileText size={20} />
                </div>
                <span className="text-xs font-bold">PDF Document</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-200 transition-all cursor-pointer"
              >
                Export
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StudentFeesList;
