import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CustomDataTable from "../common/DataTable";
import toast from "react-hot-toast";
import AddStudentFeeModal from "../modals/AddStudentFeeModal";
import CollectPaymentModal from "./CollectPaymentModal";
import PaymentHistoryView from "./PaymentHistoryView";
import BulkUploadFeeView from "./BulkUploadFeeView";
import BulkUploadHistoryModal from "../modals/BulkUploadHistoryModal";
import { Upload } from "lucide-react";
import { downloadReceipt } from "../../utils/downloadReceipt";
import { Download, FileSpreadsheet, FileText, Search } from "lucide-react";
import ReactDOM from "react-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import { useImagePreview } from "../../context/ImagePreviewContext";

const StudentFeesList = ({ feeType, paidOnly, excludePaid, batchObj, examFilter }) => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const { showPreview } = useImagePreview();
  const [selectedFee, setSelectedFee] = useState(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedPaymentsFee, setSelectedPaymentsFee] = useState(null);
  const [selectedMonthPayments, setSelectedMonthPayments] = useState(null);
  const [showBulkUploadView, setShowBulkUploadView] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState([]);
  const [isTemplateUpload, setIsTemplateUpload] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [breakdownModal, setBreakdownModal] = useState({ isOpen: false, studentName: "", breakdown: [] });
  const fileInputRef = React.useRef(null);

  const getSessionValue = (key, defaultVal) => {
    const val = sessionStorage.getItem(`fees_${feeType}_${paidOnly}_${key}`);
    if (!val) return defaultVal;
    try { return JSON.parse(val); } catch (e) { return val; }
  };

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => getSessionValue("search", ""));

  const [selectedCenter, setSelectedCenter] = useState(() => getSessionValue("center", "all"));
  const [selectedCourse, setSelectedCourse] = useState(() => getSessionValue("course", "all"));
  const [selectedBatch, setSelectedBatch] = useState(() => getSessionValue("batch", "all"));
  const [selectedFeeYear, setSelectedFeeYear] = useState(() => getSessionValue("feeYear", "all"));
  const [selectedStatus, setSelectedStatus] = useState(() => getSessionValue("status", "all"));
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [fromDate, setFromDate] = useState(() => getSessionValue("fromDate", ""));
  const [toDate, setToDate] = useState(() => getSessionValue("toDate", ""));

  useEffect(() => {
    sessionStorage.setItem(`fees_${feeType}_${paidOnly}_search`, JSON.stringify(search));
    sessionStorage.setItem(`fees_${feeType}_${paidOnly}_center`, JSON.stringify(selectedCenter));
    sessionStorage.setItem(`fees_${feeType}_${paidOnly}_course`, JSON.stringify(selectedCourse));
    sessionStorage.setItem(`fees_${feeType}_${paidOnly}_batch`, JSON.stringify(selectedBatch));
    sessionStorage.setItem(`fees_${feeType}_${paidOnly}_feeYear`, JSON.stringify(selectedFeeYear));
    sessionStorage.setItem(`fees_${feeType}_${paidOnly}_status`, JSON.stringify(selectedStatus));
    sessionStorage.setItem(`fees_${feeType}_${paidOnly}_fromDate`, JSON.stringify(fromDate));
    sessionStorage.setItem(`fees_${feeType}_${paidOnly}_toDate`, JSON.stringify(toDate));
  }, [search, selectedCenter, selectedCourse, selectedBatch, selectedFeeYear, selectedStatus, fromDate, toDate, feeType, paidOnly]);

  let maxYearInDataset = -1;
  if (selectedFeeYear === "all") {
    fees.forEach(f => {
      const term = search.toLowerCase();
      const matchesSearch = !term ||
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

      const matchesExam = !(examFilter && f.otherFeeType !== examFilter);

      if (matchesSearch && matchesCenter && matchesCourse && matchesBatch && matchesExam) {
        let rowYearDigit = null;
        if (f.year) {
          const match = String(f.year).match(/\d+/);
          if (match) rowYearDigit = Number(match[0]);
        } else if (f.otherFeeType) {
          const match = String(f.otherFeeType).match(/Year\s*(\d+)/i);
          if (match) rowYearDigit = Number(match[1]);
        }
        if (rowYearDigit === null && f.student?.year) {
          const match = String(f.student.year).match(/\d+/);
          if (match) rowYearDigit = Number(match[0]);
        }
        if (rowYearDigit !== null && rowYearDigit > maxYearInDataset) {
          maxYearInDataset = rowYearDigit;
        }
      }
    });
  }

  const effectiveYear = selectedFeeYear !== "all" ? Number(selectedFeeYear) : (maxYearInDataset !== -1 ? maxYearInDataset : 1);

  const getDynamicMonths = () => {
    let currentStartDate = "";
    let currentEndDate = "";

    if (batchObj && batchObj.periods && batchObj.periods.length > 0) {
      const currentPeriod = batchObj.periods.find(p => p.year === effectiveYear) || batchObj.periods[0];
      if (currentPeriod) {
        currentStartDate = currentPeriod.startDate;
        currentEndDate = currentPeriod.endDate;
      }
    } else if (batchObj && batchObj.period?.startDate && batchObj.period?.endDate) {
      currentStartDate = batchObj.period.startDate;
      currentEndDate = batchObj.period.endDate;
    }

    if (!currentStartDate || !currentEndDate) {
      const monthNames = ["July", "August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June"];
      const monthMap = { "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11, "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5 };
      return monthNames.map(m => ({ label: m, month: monthMap[m], year: null }));
    }

    const startParts = currentStartDate.split('-');
    const endParts = currentEndDate.split('-');
    if (startParts.length < 2 || endParts.length < 2) return [];

    let currentYear = parseInt(startParts[0]);
    let currentMonth = parseInt(startParts[1]) - 1;
    const endYear = parseInt(endParts[0]);
    const endMonth = parseInt(endParts[1]) - 1;

    const columns = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let safety = 0;
    while ((currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) && safety < 60) {
      columns.push({
        label: `${monthNames[currentMonth]} '${String(currentYear).slice(2)}`,
        month: currentMonth,
        year: currentYear
      });
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      safety++;
    }
    return columns;
  };

  const dynamicMonths = getDynamicMonths();

  const getAmountForMonth = (row, targetMonth) => {
    let totalForMonth = 0;

    if (row.payments && row.payments.length > 0) {
      row.payments.forEach(p => {
        if (p.status === 'Approved' && p.paidAt) {
          const pDate = new Date(p.paidAt);
          if (pDate.getMonth() === targetMonth.month) {
            if (targetMonth.year !== null) {
              if (pDate.getFullYear() === targetMonth.year) {
                totalForMonth += p.amount;
              }
            } else {
              totalForMonth += p.amount;
            }
          }
        }
      });
    } else if (row.status === 'paid') {
      const pDate = row.paidAt ? new Date(row.paidAt) : new Date(row.createdAt);
      if (pDate.getMonth() === targetMonth.month) {
        if (targetMonth.year !== null) {
          if (pDate.getFullYear() === targetMonth.year) {
            totalForMonth = row.amount;
          }
        } else {
          totalForMonth = row.amount;
        }
      }
    }

    return totalForMonth;
  };

  const getPaymentsForMonth = (row, targetMonth) => {
    const monthPayments = [];

    if (row.payments && row.payments.length > 0) {
      row.payments.forEach(p => {
        if (p.status === 'Approved' && p.paidAt) {
          const pDate = new Date(p.paidAt);
          if (pDate.getMonth() === targetMonth.month) {
            if (targetMonth.year !== null) {
              if (pDate.getFullYear() === targetMonth.year) {
                monthPayments.push(p);
              }
            } else {
              monthPayments.push(p);
            }
          }
        }
      });
    } else if (row.status === 'paid') {
      const pDate = row.paidAt ? new Date(row.paidAt) : new Date(row.createdAt);
      if (pDate.getMonth() === targetMonth.month) {
        if (targetMonth.year !== null) {
          if (pDate.getFullYear() === targetMonth.year) {
            monthPayments.push({
              ...row,
              paymentMode: row.paymentMode || 'Online'
            });
          }
        } else {
          monthPayments.push({
            ...row,
            paymentMode: row.paymentMode || 'Online'
          });
        }
      }
    }

    return monthPayments;
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
      // Filter by feeType prop and batchObj
      let filteredData = res.data.filter(f => {
        if (!f.student) return false;
        if (batchObj) {
          const feeBatchId = f.batch?._id || f.batch;
          if (String(feeBatchId) !== String(batchObj._id)) return false;
        }
        if (feeType === 'All') return true;
        if (feeType === 'Council') return f.feeType === 'Council' || (f.feeType === 'Other' && (f.otherFeeType === 'Council Fees' || f.otherFeeType === 'Council Fee'));
        if (feeType === 'Course') return ['Course', 'Sem', 'Term', 'Monthly'].includes(f.feeType) || (f.feeType === 'Other' && (f.otherFeeType === 'Course Fees' || f.otherFeeType === 'Course Fee'));
        if (feeType === 'Both') return ['Course', 'Sem', 'Term', 'Monthly'].includes(f.feeType) || (f.feeType === 'Other' && (f.otherFeeType === 'Course Fees' || f.otherFeeType === 'Course Fee')) || f.feeType === 'Council' || (f.feeType === 'Other' && (f.otherFeeType === 'Council Fees' || f.otherFeeType === 'Council Fee'));
        if (feeType === 'Other') return f.feeType === 'Other' && f.otherFeeType !== 'Council Fees' && f.otherFeeType !== 'Council Fee' && f.otherFeeType !== 'Course Fees' && f.otherFeeType !== 'Course Fee';
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
                year: f.year,
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
              year: f.year,
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

          let feeYearDigit = null;
          if (f.year) {
            const match = f.year.match(/\d+/);
            if (match) feeYearDigit = match[0];
          } else if (f.otherFeeType) {
            const match = f.otherFeeType.match(/Year\s*(\d+)/i);
            if (match) feeYearDigit = match[1];
          }

          let studentYearDigit = null;
          if (f.student?.year) {
            const match = f.student.year.match(/\d+/);
            if (match) studentYearDigit = match[0];
          }

          const feeYear = feeYearDigit ? `Year ${feeYearDigit}` : (f.student?.year || "Unknown Year");
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

          let isCourse = ['Course', 'Sem', 'Term', 'Monthly'].includes(f.feeType) || (f.feeType === 'Other' && (f.otherFeeType === 'Course Fees' || f.otherFeeType === 'Course Fee'));
          let isCouncil = f.feeType === 'Council' || (f.feeType === 'Other' && (f.otherFeeType === 'Council Fees' || f.otherFeeType === 'Council Fee'));

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

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    const { id } = confirmModal;
    if (!id) return;
    try {
      const rowToDelete = fees.find(f => f._id === id);
      if (rowToDelete && rowToDelete.originalFees && rowToDelete.originalFees.length > 0) {
        // It's a grouped row, delete all underlying fees
        await Promise.all(rowToDelete.originalFees.map(of => api.delete(`/student-fees/${of._id}`)));
      } else {
        // Single fee deletion
        await api.delete(`/student-fees/${id}`);
      }
      setFees(fees.filter(f => f._id !== id && f.originalFeeId !== id));
      toast.success("Fee deleted successfully");
    } catch (err) {
      toast.error("Failed to delete fee");
    } finally {
      setConfirmModal({ isOpen: false, id: null });
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

    if (examFilter && f.otherFeeType !== examFilter) {
      return false;
    }

    let matchesYear = true;
    let rowYearDigit = null;
    if (f.year) {
      const match = String(f.year).match(/\d+/);
      if (match) rowYearDigit = Number(match[0]);
    } else if (f.otherFeeType) {
      const match = String(f.otherFeeType).match(/Year\s*(\d+)/i);
      if (match) rowYearDigit = Number(match[1]);
    }

    if (rowYearDigit === null && f.student?.year) {
      const match = String(f.student.year).match(/\d+/);
      if (match) rowYearDigit = Number(match[0]);
    }

    if (selectedFeeYear !== "all") {
      if (rowYearDigit !== null) {
        matchesYear = rowYearDigit === Number(selectedFeeYear);
      } else {
        matchesYear = false;
      }
    } else {
      if (maxYearInDataset !== -1) {
        if (rowYearDigit !== null) {
          matchesYear = rowYearDigit === maxYearInDataset;
        } else {
          matchesYear = false;
        }
      }
    }

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

    let matchesDate = true;
    if (fromDate || toDate) {
      let from = fromDate ? new Date(fromDate) : null;
      if (from) from.setHours(0, 0, 0, 0);
      let to = toDate ? new Date(toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);

      const createdDate = new Date(f.createdAt);
      let createdInRange = true;
      if (from) createdInRange = createdInRange && createdDate >= from;
      if (to) createdInRange = createdInRange && createdDate <= to;

      let paymentInRange = false;
      if (f.payments && f.payments.length > 0) {
        paymentInRange = f.payments.some(p => {
          const pDate = new Date(p.paidAt || p.createdAt || f.createdAt);
          let pMatch = true;
          if (from) pMatch = pMatch && pDate >= from;
          if (to) pMatch = pMatch && pDate <= to;
          return pMatch;
        });
      }

      // Special fallback for paidOnly mode if top-level paidAt is set
      let topPaidInRange = false;
      if (paidOnly && f.paidAt) {
        const tpDate = new Date(f.paidAt);
        topPaidInRange = true;
        if (from) topPaidInRange = topPaidInRange && tpDate >= from;
        if (to) topPaidInRange = topPaidInRange && tpDate <= to;
      }

      matchesDate = createdInRange || paymentInRange || topPaidInRange;
    }

    return matchesSearch && matchesCenter && matchesCourse && matchesBatch && matchesYear && matchesStatus && matchesDate;
  });

  // Sort by year descending by default (4th year first, then 3rd, 2nd, 1st)
  filtered.sort((a, b) => {
    const getYearDigit = (f) => {
      let digit = 0;
      if (f.year) {
        const match = String(f.year).match(/\d+/);
        if (match) digit = Number(match[0]);
      } else if (f.otherFeeType) {
        const match = String(f.otherFeeType).match(/Year\s*(\d+)/i);
        if (match) digit = Number(match[1]);
      }
      if (!digit && f.student?.year) {
        const match = String(f.student.year).match(/\d+/);
        if (match) digit = Number(match[0]);
      }
      return digit;
    };
    return getYearDigit(b) - getYearDigit(a);
  });

  const filteredWithUnified = filtered.map(f => {
    const studentFees = fees.filter(tf => {
      const studentMatch = tf.student && f.student && tf.student._id === f.student._id;
      const typeMatch = tf.feeType === f.feeType;
      return studentMatch && typeMatch;
    });

    const breakdown = studentFees.map(sf => {
      const sfTotalDue = (sf.amount || 0) +
        (sf.isPenaltyApplied ? (sf.penaltyAmount || 0) : 0) +
        (sf.isFinalPenaltyApplied ? (sf.finalPenaltyAmount || 0) : 0);
      const sfApprovedPaid = sf.payments?.filter(p => p.status === 'Approved').reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
      const sfBalance = Math.max(0, sfTotalDue - sfApprovedPaid);

      const sfCourseTotal = (sf.courseAmount || 0) + (sf.coursePenaltyAmount || 0);
      const sfCoursePaid = sf.coursePayments ? sf.coursePayments.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0) : 0;
      const sfCourseBalance = Math.max(0, sfCourseTotal - sfCoursePaid);

      const sfCouncilTotal = (sf.councilAmount || 0) + (sf.councilPenaltyAmount || 0);
      const sfCouncilPaid = sf.councilPayments ? sf.councilPayments.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0) : 0;
      const sfCouncilBalance = Math.max(0, sfCouncilTotal - sfCouncilPaid);

      let yearLabel = sf.year || sf.otherFeeType || sf.student?.year || "Unknown";
      const match = String(yearLabel).match(/\d+/);
      if (match) {
        const n = match[0];
        if (n === "1") yearLabel = "1st Year";
        else if (n === "2") yearLabel = "2nd Year";
        else if (n === "3") yearLabel = "3rd Year";
        else yearLabel = `${n}th Year`;
      }

      return {
        yearLabel,
        totalDue: sfTotalDue,
        balance: sfBalance,
        courseBalance: sfCourseBalance,
        councilBalance: sfCouncilBalance,
        courseTotal: sfCourseTotal,
        councilTotal: sfCouncilTotal
      };
    });

    breakdown.sort((a, b) => {
      const aN = String(a.yearLabel).match(/\d+/) ? Number(String(a.yearLabel).match(/\d+/)[0]) : 0;
      const bN = String(b.yearLabel).match(/\d+/) ? Number(String(b.yearLabel).match(/\d+/)[0]) : 0;
      return aN - bN;
    });

    const unifiedBalance = breakdown.reduce((sum, item) => sum + item.balance, 0);
    const unifiedTotalDue = breakdown.reduce((sum, item) => sum + item.totalDue, 0);
    const unifiedCourseTotal = breakdown.reduce((sum, item) => sum + item.courseTotal, 0);
    const unifiedCourseBalance = breakdown.reduce((sum, item) => sum + item.courseBalance, 0);
    const unifiedCouncilTotal = breakdown.reduce((sum, item) => sum + item.councilTotal, 0);
    const unifiedCouncilBalance = breakdown.reduce((sum, item) => sum + item.councilBalance, 0);

    return {
      ...f,
      unifiedTotalDue,
      unifiedBalance,
      unifiedCourseTotal,
      unifiedCourseBalance,
      unifiedCouncilTotal,
      unifiedCouncilBalance,
      feeBreakdown: breakdown
    };
  });

  const dataWithSummary = [...filteredWithUnified];
  if (filteredWithUnified.length > 0) {
    if (!paidOnly) {
      const summaryRow = {
        isSummary: true,
        _id: 'summary_row_totals',
        student: { studentNameEnglish: 'TOTALS' },
        amount: filtered.reduce((sum, f) => sum + (f.amount || 0), 0),
        penaltyAmount: filtered.reduce((sum, f) => sum + (f.penaltyAmount || 0), 0),
        finalPenaltyAmount: filtered.reduce((sum, f) => sum + (f.finalPenaltyAmount || 0), 0),
        courseAmount: filtered.reduce((sum, f) => sum + (f.courseAmount || 0), 0),
        coursePenaltyAmount: filtered.reduce((sum, f) => sum + (f.coursePenaltyAmount || 0), 0),
        totalCoursePaid: filtered.reduce((sum, f) => sum + (f.coursePayments ? f.coursePayments.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0) : 0), 0),
        councilAmount: filtered.reduce((sum, f) => sum + (f.councilAmount || 0), 0),
        councilPenaltyAmount: filtered.reduce((sum, f) => sum + (f.councilPenaltyAmount || 0), 0),
        totalCouncilPaid: filteredWithUnified.reduce((sum, f) => sum + (f.councilPayments ? f.councilPayments.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0) : 0), 0),
        totalRemainingBalance: filteredWithUnified.reduce((sum, f) => sum + (f.unifiedBalance !== undefined ? f.unifiedBalance : getRemainingBalance(f)), 0),
        unifiedCourseTotal: filteredWithUnified.reduce((sum, f) => sum + (f.unifiedCourseTotal || 0), 0),
        unifiedCourseBalance: filteredWithUnified.reduce((sum, f) => sum + (f.unifiedCourseBalance || 0), 0),
        unifiedCouncilTotal: filteredWithUnified.reduce((sum, f) => sum + (f.unifiedCouncilTotal || 0), 0),
        unifiedCouncilBalance: filteredWithUnified.reduce((sum, f) => sum + (f.unifiedCouncilBalance || 0), 0),
        unifiedTotalDue: filteredWithUnified.reduce((sum, f) => sum + (f.unifiedTotalDue || 0), 0),
        isPenaltyApplied: true,
        isFinalPenaltyApplied: true
      };

      dynamicMonths.forEach(m => {
        summaryRow['month_' + m.label] = filtered.reduce((sum, f) => sum + getAmountForMonth(f, m), 0);
      });

      dataWithSummary.push(summaryRow);
    } else {
      const summaryRow = {
        isSummary: true,
        _id: 'summary_row_totals',
        student: { studentNameEnglish: 'TOTALS' },
        amount: filtered.reduce((sum, f) => sum + (f.amount || 0), 0)
      };
      dataWithSummary.push(summaryRow);
    }
  }




  const handleBulkFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });

          if (jsonData.length === 0) {
            toast.error("The uploaded file is empty");
            return;
          }

          const parseExcelDate = (dateVal) => {
            if (!dateVal) return null;

            const formatDate = (d) => {
              const yy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              return `${mm}-${yy}`;
            };

            if (!isNaN(dateVal) && typeof dateVal === 'number') {
              return formatDate(new Date((dateVal - 25569) * 86400 * 1000));
            }
            const str = String(dateVal).trim();

            const mmYyyyParts = str.match(/^(\d{1,2})[-/](\d{4})$/);
            if (mmYyyyParts) {
              const month = parseInt(mmYyyyParts[1], 10) - 1;
              const year = parseInt(mmYyyyParts[2], 10);
              return formatDate(new Date(year, month, 1));
            }

            const mmYyParts = str.match(/^(\d{1,2})[-/](\d{2})$/);
            if (mmYyParts) {
              const month = parseInt(mmYyParts[1], 10) - 1;
              let year = parseInt(mmYyParts[2], 10);
              if (year < 100) year += 2000;
              return formatDate(new Date(year, month, 1));
            }

            const mmmYyParts = str.match(/^([a-zA-Z]{3,})[-/](\d{2,4})$/);
            if (mmmYyParts) {
              const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
              const monthStr = mmmYyParts[1].toLowerCase().substring(0, 3);
              const month = monthNames.indexOf(monthStr);
              if (month !== -1) {
                let year = parseInt(mmmYyParts[2], 10);
                if (year < 100) year += 2000;
                return formatDate(new Date(year, month, 1));
              }
            }

            const parts = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
            if (parts) {
              const day = parseInt(parts[1], 10);
              const month = parseInt(parts[2], 10) - 1;
              let year = parseInt(parts[3], 10);
              if (year < 100) year += 2000;
              return formatDate(new Date(year, month, day));
            }
            const d = new Date(str);
            if (!isNaN(d.getTime())) return formatDate(d);
            return null;
          };

          const mappedData = [];

          let isTemplateUpload = false;
          if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const hasStandardColumns = Object.keys(firstRow).some(k => {
              const lower = k.toLowerCase();
              return lower.includes('total amt') || lower.includes('paid amt') || lower.includes('total amount');
            });
            isTemplateUpload = !hasStandardColumns;
          }

          jsonData.forEach(row => {
            // Skip TOTALS row if it exists
            if (row["Student Name"] === "TOTALS" || row["Student ID"] === "TOTALS") return;

            let isTemplate = isTemplateUpload;

            if (isTemplate) {
              const sId = row["Student ID"] ? String(row["Student ID"]).trim() : "";
              const fType = row["Fee Type"] ? String(row["Fee Type"]).trim() : "";

              let yearVal = "";
              if (row["Year"]) {
                const match = String(row["Year"]).match(/\d+/);
                if (match) yearVal = match[0];
              }

              if (!sId || !fType) return; // Skip invalid rows

              // For each month, if there's an amount, create a record
              // Instead of relying on exact dynamicMonths keys which might mismatch if year changed,
              // we can just look for keys that look like months or match dynamicMonths loosely
              Object.keys(row).forEach(key => {
                // Check if this key is a month column
                const isMonthCol = dynamicMonths.some(m => m.label === key) ||
                  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*['\-]?\s*\d{2,4}$/i.test(key);

                if (isMonthCol) {
                  const amtStr = String(row[key] || "").replace(/[^0-9.]/g, '');
                  const amt = Number(amtStr);
                  if (!isNaN(amt) && amt > 0) {
                    // Extract month and year from the key (e.g. "Jul '27" -> 7, 2027)
                    let mmStr = "01", yyStr = new Date().getFullYear();

                    const match = dynamicMonths.find(m => m.label === key);
                    if (match) {
                      mmStr = String(match.month + 1).padStart(2, '0');
                      yyStr = match.year;
                    } else {
                      const parts = key.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*['\-]?\s*(\d{2,4})$/i);
                      if (parts) {
                        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
                        const mIndex = monthNames.indexOf(parts[1].toLowerCase());
                        if (mIndex !== -1) mmStr = String(mIndex + 1).padStart(2, '0');

                        let yNum = parseInt(parts[2], 10);
                        if (yNum < 100) yNum += 2000;
                        yyStr = yNum;
                      }
                    }

                    mappedData.push({
                      studentId: sId,
                      year: yearVal,
                      feeType: fType,
                      totalAmount: amt,
                      paidAmount: amt,
                      paymentMode: "Cash",
                      bankReference: "",
                      paidDate: `${mmStr}-${yyStr}`
                    });
                  }
                }
              });
            } else {
              // Standard bulk upload format fallback
              mappedData.push({
                studentId: row["Student ID"] ? String(row["Student ID"]).trim() : "",
                year: row["Year"] ? String(row["Year"]).trim() : "",
                feeType: row["Fee Type"] ? String(row["Fee Type"]).trim() : "",
                totalAmount: row["Total Amt"] || row["Total Amount"],
                paidAmount: row["Paid Amt"] || row["Paid Amount"],
                paymentMode: row["Payment Mode"] || row["Payment M..."] || "Cash",
                bankReference: row["Bank Reference"] ? String(row["Bank Reference"]).trim() : "",
                paidDate: parseExcelDate(row["Paid Date"])
              });
            }
          });

          setIsTemplateUpload(isTemplateUpload);
          setBulkUploadData(mappedData);
          setShowBulkUploadView(true);
        } catch (err) {
          console.error(err);
          toast.error("Failed to parse the Excel file");
        }
      };
      reader.onerror = () => toast.error("Error reading file");
      reader.readAsArrayBuffer(file);
      e.target.value = null;
    }
  };

  const handleExport = () => {
    setShowExportModal(false);
    if (paidOnly) {
      if (exportFormat === "excel") {
        const data = dataWithSummary.map((f, i) => {
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
            "S.No": f.isSummary ? "" : i + 1,
            "Student Name": f.isSummary ? "TOTALS" : f.student?.studentNameEnglish || "N/A",
            "Student ID": f.isSummary ? "" : f.student?.studentId || "-",
            "Course": f.isSummary ? "" : f.course?.title || "-",
            "Batch": f.isSummary ? "" : f.batch?.name || "-",
            "Center": f.isSummary ? "" : f.center?.name || "-",
            "Fee Type": f.isSummary ? "" : lbl,
            "Amount Paid": f.amount || 0,
            "Payment Mode": f.isSummary ? "" : f.paymentMode || "-",
            "Reference": f.isSummary ? "" : f.bankReference || "-",
            "Paid Date": f.isSummary ? "" : f.paidAt ? new Date(f.paidAt).toLocaleDateString("en-IN") : "-"
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
        dataWithSummary.forEach((f, index) => {
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
            `Rs.${f.amount.toLocaleString("en-IN")}`,
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
      const data = dataWithSummary.map((f, i) => {
        const totalDue = f.amount +
          (f.isPenaltyApplied ? f.penaltyAmount : 0) +
          (f.isFinalPenaltyApplied ? f.finalPenaltyAmount : 0);

        const exportRow = {
          "S.No": f.isSummary ? "" : i + 1,
          "Student Name": f.isSummary ? "TOTALS" : f.student?.studentNameEnglish || "N/A",
          "Student ID": f.isSummary ? "" : f.student?.studentId || "-",
          "Course": f.isSummary ? "" : f.course?.title || "-",
          "Batch": f.isSummary ? "" : f.batch?.name || "-",
          "Center": f.isSummary ? "" : f.center?.name || "-",
          "Fee Type": f.feeType === 'Other' && f.otherFeeType ? f.otherFeeType : f.feeType,
          "Total Fee": totalDue || 0,
        };

        if (feeType !== 'Exam') {
          dynamicMonths.forEach(m => {
            exportRow[m.label] = getAmountForMonth(f, m);
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
        dynamicMonths.forEach(m => tableColumn.push(m.label));
      }
      tableColumn.push("Balance", "Status");

      const tableRows = [];
      dataWithSummary.forEach((f, index) => {
        const totalDue = f.amount +
          (f.isPenaltyApplied ? f.penaltyAmount : 0) +
          (f.isFinalPenaltyApplied ? f.finalPenaltyAmount : 0);

        const rowData = [
          index + 1,
          `${f.student?.studentNameEnglish || "N/A"} (${f.student?.studentId || "-"})`,
          `${f.course?.title || "-"} / ${f.batch?.name || "-"}`,
          f.center?.name || "-",
          `Rs.${totalDue.toLocaleString("en-IN")}`
        ];

        if (feeType !== 'Exam') {
          dynamicMonths.forEach(m => {
            rowData.push(getAmountForMonth(f, m));
          });
        }

        rowData.push(
          `Rs.${getRemainingBalance(f).toLocaleString("en-IN")}`,
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

  const handleDownloadSample = () => {
    const data = dataWithSummary.filter(f => !f.isSummary).map((f, i) => {
      let yearVal = f.year || (f.feeType === 'Other' ? f.otherFeeType : null) || f.student?.year || "-";
      const yearMatch = String(yearVal).match(/Year\s*(\d+)/i) || String(yearVal).match(/\d+/);
      let formattedYear = yearMatch ? `Year ${yearMatch[1] || yearMatch[0]}` : yearVal;

      const exportRow = {
        "S.No": i + 1,
        "Student Name": f.student?.studentNameEnglish || "N/A",
        "Student ID": f.student?.studentId || "-",
        "Year": formattedYear,
        "Fee Type": f.feeType === 'Other' && f.otherFeeType ? f.otherFeeType : f.feeType,
        "Current Year Fees Balance": getRemainingBalance(f),
      };

      if (feeType !== 'Exam') {
        dynamicMonths.forEach(m => {
          exportRow[m.label] = "";
        });
      } else {
        exportRow["Total Amt"] = "";
        exportRow["Paid Amt"] = "";
        exportRow["Payment Mode"] = "";
        exportRow["Bank Reference"] = "";
        exportRow["Paid Date"] = "";
      }

      return exportRow;
    });

    if (data.length === 0) {
      toast.error("No students found to generate a template.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set custom column widths
    const colWidths = [
      { wch: 8 },  // S.No
      { wch: 35 }, // Student Name
      { wch: 25 }, // Student ID
      { wch: 15 }, // Year
      { wch: 20 }, // Fee Type
      { wch: 25 }, // Current Year Fees Balance
    ];

    if (feeType !== 'Exam') {
      dynamicMonths.forEach(() => {
        colWidths.push({ wch: 12 }); // Month columns
      });
    } else {
      colWidths.push({ wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 15 });
    }

    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `${feeType}_Bulk_Upload_Template.xlsx`);
    toast.success("Template downloaded successfully!");
  };

  const monthColumns = dynamicMonths.map(targetMonth => ({
    name: targetMonth.label,
    width: "90px",
    selector: row => row.isSummary ? row['month_' + targetMonth.label] : getAmountForMonth(row, targetMonth),
    cell: row => {
      const amt = row.isSummary ? row['month_' + targetMonth.label] : getAmountForMonth(row, targetMonth);
      if (amt > 0) {
        return (
          <button
            onClick={() => {
              const payments = getPaymentsForMonth(row, targetMonth);
              setSelectedMonthPayments({
                monthLabel: targetMonth.label,
                studentName: row.student?.studentNameEnglish || "N/A",
                payments: payments,
                fee: row
              });
            }}
            className="font-bold text-brand-600 hover:text-brand-800 hover:underline cursor-pointer transition-colors"
          >
            ₹{amt.toLocaleString('en-IN')}
          </button>
        );
      }
      return <span className="text-slate-350">-</span>;
    }
  }));

  const columns = paidOnly ? [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    {
      name: "Student", width: "180px",
      selector: row => row.student?.studentNameEnglish,
      sortable: true,
      cell: row => (
        <div>
          <div className="font-bold text-gray-800">{row.student?.studentNameEnglish || "N/A"}</div>
          <div className="text-[10px] text-gray-500 font-bold">{row.student?.studentId || ""}</div>
          <div className="text-[10px] text-brand-600 font-bold">
            {(() => {
              const yr = row.year || row.student?.year || "";
              const match = String(yr).match(/\d+/);
              if (match) {
                const n = match[0];
                if (n === "1") return "1st Year";
                if (n === "2") return "2nd Year";
                if (n === "3") return "3rd Year";
                return `${n}th Year`;
              }
              return yr;
            })()}
          </div>
        </div>
      )
    },
    {
      name: "Course & Batch",
      selector: row => row.course?.title,
      sortable: true, width: "250px",
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
      width: "150px",
      cell: row => <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">{row.center?.name || "-"}</span>
    },
    {
      name: "Amount Paid",
      selector: row => row.amount,
      sortable: true,
      width: "150px",
      cell: row => <span className="text-sm font-black text-slate-800">₹{row.amount?.toLocaleString("en-IN")}</span>
    },
    {
      name: "Mode",
      selector: row => row.paymentMode,
      sortable: true,
      width: "90px",
      cell: row => <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">{row.paymentMode || "-"}</span>
    },
    {
      name: "Proof",
      selector: row => row.bankReference || row.proofOfPayment,
      cell: row => {
        if (row.paymentMode === 'Online' && row.proofOfPayment) {
          return (
            <button
              onClick={() => showPreview(row.proofOfPayment)}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer"
            >
              View Proof
            </button>
          );
        }
        return <span className="font-mono text-xs text-slate-600">{row.bankReference || '-'}</span>;
      }
    },
    {
      name: "Date", width: "110px",
      selector: row => row.paidAt,
      sortable: true,
      cell: row => row.isSummary ? null : <span className="text-gray-600 font-medium">{new Date(row.paidAt).toLocaleDateString("en-GB")}</span>
    },
    {
      name: "Action",
      center: true,
      width: "100px",
      cell: row => row.isSummary ? null : (
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
          <button onClick={() => setConfirmModal({ isOpen: true, id: row.originalFeeId || row._id })} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Fee">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        </div>
      )
    }
  ] : [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    {
      name: "Student", width: "150px",
      selector: row => row.student?.studentNameEnglish,
      sortable: true,
      cell: row => (
        <div>
          <div className="font-bold text-gray-800">{row.student?.studentNameEnglish || "N/A"}</div>
          <div className="text-[10px] text-gray-500 font-bold">{row.student?.studentId || ""}</div>
          <div className="text-[10px] text-brand-600 font-bold">
            {(() => {
              const yr = row.year || row.student?.year || "";
              const match = String(yr).match(/\d+/);
              if (match) {
                const n = match[0];
                if (n === "1") return "1st Year";
                if (n === "2") return "2nd Year";
                if (n === "3") return "3rd Year";
                return `${n}th Year`;
              }
              return yr;
            })()}
          </div>
        </div>
      )
    },
    {
      name: "Course & Batch",
      selector: row => row.course?.title,
      sortable: true, width: "200px",
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
      width: "130px",
      cell: row => <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">{row.center?.name || "-"}</span>
    },
    ...(feeType === 'Both' ? [
      {
        name: "Total Course", width: "120px",
        selector: row => row.unifiedCourseTotal,
        cell: row => <span className="text-xs font-black text-slate-800">₹{(row.unifiedCourseTotal || 0).toLocaleString("en-IN")}</span>
      },
      {
        name: "Total Council", width: "120px",
        selector: row => row.unifiedCouncilTotal,
        cell: row => <span className="text-xs font-black text-slate-800">₹{(row.unifiedCouncilTotal || 0).toLocaleString("en-IN")}</span>
      },
      {
        name: "Total Unified", width: "120px",
        selector: row => row.unifiedTotalDue,
        cell: row => <span className="text-xs font-black text-slate-800">₹{(row.unifiedTotalDue || 0).toLocaleString("en-IN")}</span>
      }
    ] : [
      {
        name: "Fee Details", width: "160px",
        selector: row => row.amount,
        sortable: true,
        cell: row => {
          const currentYearTotal = row.amount +
            (row.isPenaltyApplied ? row.penaltyAmount : 0) +
            (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0);
          
          const unifiedTotal = row.isSummary ? row.amount : (row.unifiedTotalDue !== undefined ? row.unifiedTotalDue : currentYearTotal);

          if (row.isSummary) {
            return (
              <div className="flex flex-col gap-1 py-2 justify-center h-full">
                <span className="text-xs font-black text-slate-700">₹{unifiedTotal.toLocaleString("en-IN")}</span>
              </div>
            );
          }

          return (
            <div className="flex flex-col justify-center py-2 w-full h-full">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center gap-1">
                  <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tight">Unified</span>
                  <span className="text-[11px] font-black text-slate-700">₹{unifiedTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center gap-1">
                  <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tight">Current</span>
                  <span className="text-[11px] font-black text-slate-700">₹{currentYearTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          );
        }
      }
    ]),
    ...(feeType !== 'Exam' ? monthColumns : []),
    ...(feeType === 'Both' ? [
      {
        name: "Course Bal", width: "120px",
        selector: row => row.unifiedCourseBalance,
        cell: row => {
          const courseBal = row.unifiedCourseBalance || 0;
          return (
            <button
              onClick={() => {
                if (!row.isSummary && row.feeBreakdown && row.feeBreakdown.length > 0) {
                  setBreakdownModal({ isOpen: true, studentName: row.student?.studentNameEnglish || "Student", breakdown: row.feeBreakdown, type: 'course' });
                }
              }}
              className={`text-left text-xs font-black ${courseBal > 0 ? "text-amber-600" : "text-emerald-600"} ${!row.isSummary && row.feeBreakdown && row.feeBreakdown.length > 0 ? "hover:underline cursor-pointer" : ""}`}
            >
              ₹{courseBal?.toLocaleString("en-IN")}
            </button>
          );
        }
      },
      {
        name: "Council Bal", width: "120px",
        selector: row => row.unifiedCouncilBalance,
        cell: row => {
          const councilBal = row.unifiedCouncilBalance || 0;
          return (
            <button
              onClick={() => {
                if (!row.isSummary && row.feeBreakdown && row.feeBreakdown.length > 0) {
                  setBreakdownModal({ isOpen: true, studentName: row.student?.studentNameEnglish || "Student", breakdown: row.feeBreakdown, type: 'council' });
                }
              }}
              className={`text-left text-xs font-black ${councilBal > 0 ? "text-amber-600" : "text-emerald-600"} ${!row.isSummary && row.feeBreakdown && row.feeBreakdown.length > 0 ? "hover:underline cursor-pointer" : ""}`}
            >
              ₹{councilBal?.toLocaleString("en-IN")}
            </button>
          );
        }
      },
      {
        name: "Unified Bal", width: "120px",
        selector: row => row.isSummary ? row.totalRemainingBalance : (row.unifiedBalance !== undefined ? row.unifiedBalance : getRemainingBalance(row)),
        sortable: true,
        cell: row => {
          const totalDue = row.amount + (row.isPenaltyApplied ? row.penaltyAmount : 0) + (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0);
          const bal = row.isSummary ? row.totalRemainingBalance : (row.unifiedBalance !== undefined ? row.unifiedBalance : Math.max(0, totalDue - (row.payments?.filter(p => p.status === 'Approved').reduce((acc, p) => acc + p.amount, 0) || 0)));
          return (
            <button
              onClick={() => {
                if (!row.isSummary && row.feeBreakdown && row.feeBreakdown.length > 0) {
                  setBreakdownModal({ isOpen: true, studentName: row.student?.studentNameEnglish || "Student", breakdown: row.feeBreakdown, type: 'all' });
                }
              }}
              className={`text-left text-sm font-black ${bal > 0 ? "text-amber-600" : "text-emerald-600"} ${!row.isSummary && row.feeBreakdown && row.feeBreakdown.length > 0 ? "hover:underline cursor-pointer" : ""}`}
            >
              ₹{bal.toLocaleString("en-IN")}
            </button>
          );
        }
      }
    ] : [
      {
        name: "Balance",
        width: "160px",
        selector: row => row.isSummary ? row.totalRemainingBalance : (row.unifiedBalance !== undefined ? row.unifiedBalance : getRemainingBalance(row)),
        sortable: true,
        cell: row => {
          const currentYearTotal = row.amount +
            (row.isPenaltyApplied ? row.penaltyAmount : 0) +
            (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0);
          
          const currentYearBalance = Math.max(0, currentYearTotal - (row.payments?.filter(p => p.status === 'Approved').reduce((acc, p) => acc + p.amount, 0) || 0));
          const unifiedBal = row.isSummary ? row.totalRemainingBalance : (row.unifiedBalance !== undefined ? row.unifiedBalance : currentYearBalance);

          if (row.isSummary) {
            return (
              <div className="flex flex-col gap-1 py-2 justify-center h-full">
                <span className={`text-xs font-black ${unifiedBal > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  ₹{unifiedBal.toLocaleString("en-IN")}
                </span>
              </div>
            );
          }

          return (
            <div className="flex flex-col justify-center py-2 w-full h-full">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center gap-1">
                  <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tight">Unified</span>
                  <button 
                    onClick={() => {
                      if (row.feeBreakdown && row.feeBreakdown.length > 0) {
                        setBreakdownModal({ isOpen: true, studentName: row.student?.studentNameEnglish || "Student", breakdown: row.feeBreakdown, type: 'all' });
                      }
                    }}
                    className={`text-[11px] font-black ${unifiedBal > 0 ? "text-amber-600" : "text-emerald-600"} hover:underline`}
                  >
                    ₹{unifiedBal.toLocaleString("en-IN")}
                  </button>
                </div>
                <div className="flex justify-between items-center gap-1">
                  <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tight">Current</span>
                  <span className={`text-[11px] font-black ${currentYearBalance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    ₹{currentYearBalance.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          );
        }
      }
    ]),
    {
      name: "Status", width: "150px",
      selector: row => row.status,
      sortable: true,
      center: true,
      cell: row => {
        if (row.isSummary) return null;
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
      name: "Date", width: "110px",
      selector: row => row.createdAt,
      sortable: true,
      cell: row => row.isSummary ? null : <span className="text-gray-600 font-medium">{new Date(row.createdAt).toLocaleDateString("en-GB")}</span>
    },
    {
      name: "Action",
      center: true,
      width: "100px",
      cell: row => row.isSummary ? null : (
        <div className="flex items-center gap-1">
          <button onClick={() => setConfirmModal({ isOpen: true, id: row.originalFeeId || row._id })} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        </div>
      )
    }
  ];


  if (showBulkUploadView) {
    return (
      <BulkUploadFeeView
        parsedData={bulkUploadData}
        isTemplate={isTemplateUpload}
        onBack={() => setShowBulkUploadView(false)}
        onSuccess={() => {
          setShowBulkUploadView(false);
          fetchFees();
        }}
      />
    );
  }

  if (showPaymentHistory && selectedPaymentsFee) {
    return (
      <PaymentHistoryView
        fee={selectedPaymentsFee}
        onBack={() => {
          setShowPaymentHistory(false);
          setSelectedPaymentsFee(null);
        }}
      />
    );
  }

  if (showCollectModal && selectedFee) {
    return (
      <CollectPaymentModal
        fee={selectedFee}
        schemeLabel={getSchemeBadgeLabel(selectedFee)}
        onClose={() => {
          setShowCollectModal(false);
          setSelectedFee(null);
        }}
        onSave={handleCollectPayment}
      />
    );
  }

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 ${examFilter ? 'p-0 border-0 shadow-none' : 'p-4 sm:p-6'} overflow-hidden`}>
      {!examFilter && (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
            <h2 className="text-xl font-bold text-slate-800 shrink-0">{feeType === 'All' ? 'All' : feeType} Fees</h2>
            <div className="relative w-full sm:w-64 group shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${feeType} fees...`}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-semibold text-slate-700"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2 py-1.5 bg-transparent text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2 py-1.5 bg-transparent text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer"
              />
            </div>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm border border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              <Download size={16} /> Export
            </button>

          </div>
        </div>
      )}
      <CustomDataTable
        columns={columns}
        data={dataWithSummary}
        sortFunction={(rows, selector, direction) => {
          return [...rows].sort((a, b) => {
            if (a.isSummary) return 1;
            if (b.isSummary) return -1;
            const aField = selector(a);
            const bField = selector(b);
            let comparison = 0;
            if (aField > bField) comparison = 1;
            else if (aField < bField) comparison = -1;
            return direction === 'desc' ? comparison * -1 : comparison;
          });
        }}
        progressPending={loading}
        pagination
        additionalHeaderContent={
          <div className="flex flex-col gap-4 w-full py-2">
            {examFilter && (
              <div className="flex items-center justify-between gap-4 flex-wrap w-full">
                <div className="relative w-full sm:w-[400px] group shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search students...`}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-semibold text-slate-700 h-[40px]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 shrink-0 h-[40px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-transparent text-sm font-semibold focus:outline-none text-slate-700 cursor-pointer h-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 shrink-0 h-[40px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-transparent text-sm font-semibold focus:outline-none text-slate-700 cursor-pointer h-full"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className={`flex items-center gap-2 flex-wrap sm:flex-wrap w-full`}>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm h-[40px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[130px] truncate"
              >
                <option value="all">All Centers</option>
                {Array.from(new Map(centers.map(c => [c.name, { label: c.name, value: c._id }])).values()).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm h-[40px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[160px] truncate"
              >
                <option value="all">All Courses</option>
                {Array.from(new Map(courses.map(c => [c.title || c.name, { label: c.title || c.name, value: c._id || c.title }])).values()).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              {!batchObj && (
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm h-[40px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[130px] truncate"
                >
                  <option value="all">All Batches</option>
                  {Array.from(new Map(batches.map(b => [b.name || b.batchId, { label: b.name || b.batchId, value: b.name || b.batchId }])).values()).map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              )}

              <select
                value={selectedFeeYear}
                onChange={(e) => setSelectedFeeYear(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm h-[40px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[120px] truncate"
              >
                <option value="all">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>

              {!paidOnly && (
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm h-[40px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[120px] truncate"
                >
                  <option value="all">All Statuses</option>
                  {!excludePaid && <option value="paid">Paid</option>}
                  <option value="pending_approval">Pending Approval</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              )}

              {(selectedCenter !== "all" || selectedCourse !== "all" || selectedBatch !== "all" || selectedFeeYear !== "all" || selectedStatus !== "all" || fromDate !== "" || toDate !== "") && (
                <button
                  onClick={() => {
                    setSelectedCenter("all");
                    setSelectedCourse("all");
                    setSelectedBatch("all");
                    setSelectedFeeYear("all");
                    setSelectedStatus("all");
                    setFromDate("");
                    setToDate("");
                  }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 shadow-sm shrink-0 whitespace-nowrap animate-in fade-in h-[40px]"
                >
                  Reset Filters
                </button>
              )}

              {examFilter && (
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm border border-slate-200 transition-colors cursor-pointer shrink-0 ml-auto h-[40px]"
                >
                  <Download size={16} /> Export
                </button>
              )}

              {!paidOnly && feeType !== 'Both' && (
                <div className="flex gap-2 ml-auto">
                  <div className="relative">
                    <button
                      onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                      className="bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm h-[40px]"
                    >
                      <Upload size={16} /> Bulk Upload
                    </button>
                    {showBulkDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-[9999] overflow-hidden animate-in slide-in-from-top-2">
                        <button
                          onClick={() => {
                            setShowBulkDropdown(false);
                            handleDownloadSample();
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2 cursor-pointer"
                        >
                          <Download size={16} /> Template Download
                        </button>
                        <button
                          onClick={() => {
                            setShowBulkDropdown(false);
                            fileInputRef.current?.click();
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 border-b border-slate-100 flex items-center gap-2 cursor-pointer"
                        >
                          <Upload size={16} /> Bulk Upload
                        </button>
                        <button
                          onClick={() => {
                            setShowBulkDropdown(false);
                            setShowHistoryModal(true);
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          History
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleBulkFileChange}
                      accept=".xlsx, .xls"
                      className="hidden"
                    />
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-red-200 h-[40px]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Fee
                  </button>
                </div>
              )}
            </div>
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

      {/* EXPORT MODAL */}
      {showExportModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Export Data</h3>
            <p className="text-slate-500 text-xs mb-6">Choose your preferred format to export the filtered list.</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setExportFormat("excel")}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${exportFormat === "excel"
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
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${exportFormat === "pdf"
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

      {/* DELETE CONFIRMATION MODAL */}
      {confirmModal.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" onClick={() => setConfirmModal({ isOpen: false, id: null })}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Fee Record</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this fee record? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, id: null })}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-colors shadow-sm bg-red-600 hover:bg-red-700 shadow-red-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedMonthPayments && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedMonthPayments(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Payments - {selectedMonthPayments.monthLabel}</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">{selectedMonthPayments.studentName}</p>
              </div>
              <button onClick={() => setSelectedMonthPayments(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {selectedMonthPayments.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">S.No</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Mode</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Approved By</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Approved Date</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedMonthPayments.payments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-medium text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                            {new Date(p.paidAt || p.createdAt || Date.now()).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-slate-900">₹{p.amount?.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">
                              {p.paymentMode || 'Online'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                            {p.approvedBy?.name || '-'}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                            {p.approvedAt ? new Date(p.approvedAt).toLocaleDateString('en-GB') : '-'}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => {
                                let feeId = selectedMonthPayments.fee._id;
                                if (selectedMonthPayments.fee.originalFees && selectedMonthPayments.fee.originalFees.length > 0) {
                                  const parentFee = selectedMonthPayments.fee.originalFees.find(of => of.payments && of.payments.some(op => op._id === p._id));
                                  if (parentFee) feeId = parentFee._id;
                                  else feeId = selectedMonthPayments.fee.originalFees[0]._id;
                                }
                                const url = `/student-fees/${feeId}/receipt${p._id ? `?paymentId=${p._id}` : ''}`;
                                downloadReceipt(url, `FeeReceipt_${feeId}.pdf`);
                              }}
                              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-600 rounded-xl text-xs font-bold transition-colors shadow-sm"
                            >
                              <Download size={14} /> Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 font-medium">No payment records found.</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedMonthPayments(null)} className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-colors">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {breakdownModal.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setBreakdownModal({ isOpen: false, studentName: "", breakdown: [] })}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {breakdownModal.type === 'course' ? 'Course Fee Breakdown' : breakdownModal.type === 'council' ? 'Council Fee Breakdown' : 'Fee Breakdown'}
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">{breakdownModal.studentName}</p>
              </div>
              <button onClick={() => setBreakdownModal({ isOpen: false, studentName: "", breakdown: [] })} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {breakdownModal.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-bold text-slate-800">{item.yearLabel}</div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-500">
                        Total: ₹{(breakdownModal.type === 'course' ? item.courseTotal : breakdownModal.type === 'council' ? item.councilTotal : item.totalDue).toLocaleString('en-IN')}
                      </div>
                      <div className={`text-sm font-black ${(breakdownModal.type === 'course' ? item.courseBalance : breakdownModal.type === 'council' ? item.councilBalance : item.balance) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        Balance: ₹{(breakdownModal.type === 'course' ? item.courseBalance : breakdownModal.type === 'council' ? item.councilBalance : item.balance).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setBreakdownModal({ isOpen: false, studentName: "", breakdown: [] })} className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-colors shadow-sm">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showHistoryModal && (
        <BulkUploadHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          module="Fees"
        />
      )}
    </div>
  );
};

export default StudentFeesList;