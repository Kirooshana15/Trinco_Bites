import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Check,
  X,
  Building,
  Edit,
  Save,
  FileText,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// ============================================================================
// 1. DATA TYPE DEFINITIONS (Simple structures to store our dashboard values)
// ============================================================================

// Model representing a transaction row in our history table
interface Transaction {
  id: string;
  orderNumber: string;
  amount: number;
  type: "Order Revenue" | "Refund Debit";
  date: string;
  status: "Completed" | "Processing" | "Failed";
}

// Model representing a past bank deposit payout
interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  status: "Settled" | "Processing";
}

interface RefundRequest {
  id: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  reason: string;
  status: string;
}

// Model representing bank details
interface BankDetails {
  holderName: string;
  bankName: string;
  accountNumber: string;
  branch: string;
  status: "Verified" | "Verification Pending";
}

const formatPayoutId = (id: string) => {
  if (!id) return "";
  if (id.includes("-") && id.length > 20) {
    const parts = id.split("-");
    return `PAY-${parts[0].toUpperCase()}`;
  }
  return id;
};


export function PaymentWallet() {
  const { token } = useAuth();

  // ============================================================================
  // 2. DASHBOARD DATA & STATE HOOKS (Simple React values that trigger updates)
  // ============================================================================

  // Wallet Balances (Available, Pending, and Earnings counters)
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingSettlement, setPendingSettlement] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);

  // Loading spinner states for requests
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Refund requests state
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);

  // Manual cash refund form states
  const [isAddingRefund, setIsAddingRefund] = useState(false);
  const [newOrderNumber, setNewOrderNumber] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newStatus, setNewStatus] = useState("Pending");

  // Settlement information parameters
  const [settlementInfo, setSettlementInfo] = useState({
    amount: 0,
    period: "Loading...",
    ordersIncluded: 0,
    expectedDate: "Loading...",
  });

  // Verified Bank details state
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    holderName: "",
    bankName: "",
    accountNumber: "",
    branch: "",
    status: "Verification Pending",
  });

  // Modal open controls for Bank Details edit form
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [tempHolderName, setTempHolderName] = useState("");
  const [tempBankName, setTempBankName] = useState("");
  const [tempAccountNumber, setTempAccountNumber] = useState("");
  const [tempBranchName, setTempBranchName] = useState("");

  // Earnings Breakdown figures
  const [breakdown, setBreakdown] = useState({
    deliveryRevenue: 0,
    pickupRevenue: 0,
    promotionsContribution: 0,
    platformCommission: 0,
    deliveryFee: 0,
    taxes: 0,
  });

  // Simple direct arithmetic to calculate net earnings (No complex React useMemo)
  const totalRevenue =
    breakdown.deliveryRevenue +
    breakdown.pickupRevenue +
    breakdown.promotionsContribution;
  const totalDeductions =
    breakdown.platformCommission + breakdown.deliveryFee + breakdown.taxes;
  const netEarnings = totalRevenue - totalDeductions;

  // Recent Payout Transactions list
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Search keyword & category type filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Payout direct deposits history list
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);

  // ============================================================================
  // API INTEGRATION & FETCH HOOKS
  // ============================================================================

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<any>("/payment/dashboard", { token });
      setAvailableBalance(data.availableBalance);
      setPendingSettlement(data.pendingSettlement);
      setTodayEarnings(data.todayEarnings);
      setMonthEarnings(data.monthEarnings);
      setBreakdown(data.breakdown);
      setSettlementInfo(data.settlementInfo);
      setBankDetails(data.bankDetails);
    } catch (err: any) {
      toast.error(err.message || "Failed to load dashboard statistics");
    }
  }, [token]);

  const fetchTransactions = useCallback(async (query: string, type: string) => {
    if (!token) return;
    try {
      const path = `/payment/transactions?search=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`;
      const data = await apiRequest<Transaction[]>(path, { token });
      setTransactions(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transactions");
    }
  }, [token]);

  const fetchPayoutHistory = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<PayoutRecord[]>("/payment/payout-history", { token });
      setPayoutHistory(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payout history");
    }
  }, [token]);

  const fetchRefundRequests = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<RefundRequest[]>("/payment/refund-requests", { token });
      setRefundRequests(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load refund requests");
    }
  }, [token]);

  // Load dashboard, payouts, and refund requests on token change
  useEffect(() => {
    if (!token) return;
    fetchDashboard();
    fetchPayoutHistory();
    fetchRefundRequests();
  }, [token, fetchDashboard, fetchPayoutHistory, fetchRefundRequests]);

  // Search/Filter transactions with debouncing
  useEffect(() => {
    if (!token) return;
    const delayDebounce = setTimeout(() => {
      fetchTransactions(searchQuery, filterType);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, filterType, token, fetchTransactions]);

  // ============================================================================
  // 3. EVENT HANDLERS (Simple functions to change data when buttons are clicked)
  // ============================================================================

  // Returns transactions filter directly since it is filtered backend-side
  const getFilteredTransactions = () => {
    return transactions;
  };

  // Triggers when owner requests early balance payout withdrawal
  const handleRequestEarlyPayout = async () => {
    if (availableBalance <= 1000) {
      toast.error("Available balance is too low for early payout.");
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await apiRequest<{ availableBalance: number; payout: PayoutRecord }>("/payment/payout", {
        method: "POST",
        token,
      });

      setAvailableBalance(res.availableBalance);
      setPayoutHistory((prev) => [res.payout, ...prev]);
      toast.success(
        `Payout of LKR ${res.payout.amount.toLocaleString()} requested! Funds will credit your account shortly.`,
      );
    } catch (err: any) {
      toast.error(err.message || "Payout request failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Triggers when Bank Details edit dialog button is clicked
  const handleOpenBankEditModal = () => {
    setTempHolderName(bankDetails.holderName);
    setTempBankName(bankDetails.bankName);
    setTempAccountNumber(bankDetails.accountNumber);
    setTempBranchName(bankDetails.branch);
    setIsEditingBank(true);
  };

  // Saves bank details form
  const handleSaveBankForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await apiRequest<BankDetails>("/payment/bank-details", {
        method: "POST",
        token,
        body: {
          holderName: tempHolderName,
          bankName: tempBankName,
          accountNumber: tempAccountNumber,
          branch: tempBranchName,
        },
      });

      setBankDetails(updated);
      setIsEditingBank(false);
      toast.success(
        "Bank settings updated successfully! Verification audit in progress.",
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to save bank details");
    }
  };

  // Logs a manual cash refund
  const handleAddRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest<any>("/payment/refund-requests", {
        method: "POST",
        token,
        body: {
          orderNumber: newOrderNumber,
          customerName: newCustomerName,
          amount: Number(newAmount),
          reason: newReason,
          status: newStatus,
        },
      });
      toast.success("Manual cash refund logged successfully.");
      setIsAddingRefund(false);
      setNewOrderNumber("");
      setNewCustomerName("");
      setNewAmount("");
      setNewReason("");
      setNewStatus("Pending");
      fetchDashboard();
      fetchTransactions(searchQuery, filterType);
      fetchRefundRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to log refund");
    }
  };

  // Updates status of a refund
  const handleUpdateRefundStatus = async (refundId: string, statusVal: string) => {
    try {
      await apiRequest<any>(`/payment/refund-requests/${refundId}/status`, {
        method: "PATCH",
        token,
        body: { status: statusVal },
      });
      toast.success(`Refund status updated to ${statusVal}`);
      fetchDashboard();
      fetchTransactions(searchQuery, filterType);
      fetchRefundRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to update refund status");
    }
  };



  // ─── File Download Helpers ──────────────────────────────────────────────────

  /**
   * Builds a complete branded HTML document string and triggers a direct
   * file download (no popup required). Users can open the .html file in
   * their browser and use Ctrl+P → Save as PDF.
   */
  const downloadHTML = (filename: string, title: string, htmlBody: string) => {
    const generatedDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const fullDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e1e1e; font-size: 12px; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #D45113; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 900; color: #813405; letter-spacing: -0.5px; }
    .brand span { color: #D45113; }
    .report-meta { text-align: right; font-size: 10px; color: #555; }
    .report-meta strong { display: block; font-size: 14px; color: #813405; margin-bottom: 4px; }
    .section-title { font-size: 11px; font-weight: 800; color: #813405; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    thead tr { background: #813405; color: white; }
    thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr { border-bottom: 1px solid #e8e8e8; }
    tbody tr:nth-child(even) { background: #FFFCF5; }
    tbody td { padding: 7px 10px; font-size: 11px; }
    .amount-credit { color: #16a34a; font-weight: 700; }
    .amount-debit { color: #dc2626; font-weight: 700; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .badge-settled { background: #dcfce7; color: #15803d; }
    .badge-processing { background: #fef9c3; color: #b45309; }
    .badge-completed { background: #dcfce7; color: #15803d; }
    .badge-failed { background: #fee2e2; color: #b91c1c; }
    .summary-box { background: #FFFCF5; border: 2px solid #F8DDA4; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px solid #f0e0c0; }
    .summary-row:last-child { border-bottom: none; font-size: 13px; font-weight: 900; color: #813405; padding-top: 8px; }
    .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 9px; color: #888; text-align: center; }
    .print-hint { background: #fff8ee; border: 1px solid #F8DDA4; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 10px; color: #813405; }
    @media print { .print-hint { display: none; } body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="print-hint">&#128438; To save as PDF: press <strong>Ctrl+P</strong> (or Cmd+P on Mac) &rarr; choose <strong>Save as PDF</strong> as the destination.</div>
  <div class="report-header">
    <div class="brand">Trinco<span>Bites</span></div>
    <div class="report-meta">
      <strong>${title}</strong>
      Generated: ${generatedDate}<br/>
      Trinco Bites Restaurant Group &middot; Trincomalee, Sri Lanka
    </div>
  </div>
  ${htmlBody}
  <div class="footer">This is a system-generated document from Trinco Bites POS &amp; Payments Platform. For disputes, contact support@trincobites.lk</div>
</body>
</html>`;
    const blob = new Blob([fullDocument], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.setAttribute("download", filename);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  /** Opens a new window with printable HTML content and auto-triggers print */
  const openPrintWindow = (title: string, htmlBody: string) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      toast.error("Pop-up was blocked. Please allow pop-ups for this site.");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e1e1e; font-size: 12px; }
          .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #D45113; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 900; color: #813405; letter-spacing: -0.5px; }
          .brand span { color: #D45113; }
          .report-meta { text-align: right; font-size: 10px; color: #555; }
          .report-meta strong { display: block; font-size: 14px; color: #813405; margin-bottom: 4px; }
          .section-title { font-size: 11px; font-weight: 800; color: #813405; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
          thead tr { background: #813405; color: white; }
          thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          tbody tr { border-bottom: 1px solid #e8e8e8; }
          tbody tr:nth-child(even) { background: #FFFCF5; }
          tbody td { padding: 7px 10px; font-size: 11px; }
          .amount-credit { color: #16a34a; font-weight: 700; }
          .amount-debit { color: #dc2626; font-weight: 700; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
          .badge-settled { background: #dcfce7; color: #15803d; }
          .badge-processing { background: #fef9c3; color: #b45309; }
          .badge-completed { background: #dcfce7; color: #15803d; }
          .badge-failed { background: #fee2e2; color: #b91c1c; }
          .summary-box { background: #FFFCF5; border: 2px solid #F8DDA4; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; border-bottom: 1px solid #f0e0c0; }
          .summary-row:last-child { border-bottom: none; font-size: 13px; font-weight: 900; color: #813405; padding-top: 8px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 9px; color: #888; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="brand">Trinco<span>Bites</span></div>
          <div class="report-meta">
            <strong>${title}</strong>
            Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}<br/>
            Trinco Bites Restaurant Group · Trincomalee, Sri Lanka
          </div>
        </div>
        ${htmlBody}
        <div class="footer">This is a system-generated report from Trinco Bites POS &amp; Payments Platform. For disputes, contact support@trincobites.lk</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  };
  /** Downloads a monthly financial statement PDF */
  const handleDownloadMonthlyStatement = () => {
    const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const htmlBody = `
      <p class="section-title">Monthly Financial Statement — ${monthLabel}</p>
      <div class="summary-box">
        <div class="summary-row"><span>Available Balance</span><span>LKR ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
        <div class="summary-row"><span>Pending Settlement</span><span>LKR ${pendingSettlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
        <div class="summary-row"><span>Today's Earnings</span><span>LKR ${todayEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
        <div class="summary-row"><span>Month-to-Date Earnings</span><span>LKR ${monthEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      </div>
      <p class="section-title">Earnings Breakdown</p>
      <table>
        <thead><tr><th>Category</th><th>Amount (LKR)</th></tr></thead>
        <tbody>
          <tr><td>Delivery Orders Revenue</td><td class="amount-credit">+LKR ${breakdown.deliveryRevenue.toLocaleString()}</td></tr>
          <tr><td>Pickup Orders Revenue</td><td class="amount-credit">+LKR ${breakdown.pickupRevenue.toLocaleString()}</td></tr>
          <tr><td>Platform Promotions</td><td class="amount-credit">+LKR ${breakdown.promotionsContribution.toLocaleString()}</td></tr>
          <tr><td>Platform Commission (10%)</td><td class="amount-debit">-LKR ${breakdown.platformCommission.toLocaleString()}</td></tr>
          <tr><td>Delivery Service Fee</td><td class="amount-debit">-LKR ${breakdown.deliveryFee.toLocaleString()}</td></tr>
          <tr><td>Taxes &amp; Levies</td><td class="amount-debit">-LKR ${breakdown.taxes.toLocaleString()}</td></tr>
          <tr style="font-weight:900;background:#fff8ee;"><td>Net Earnings</td><td style="color:#813405;">LKR ${netEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
        </tbody>
      </table>
      <p class="section-title">Bank Account Details</p>
      <div class="summary-box">
        <div class="summary-row"><span>Account Holder</span><span>${bankDetails.holderName}</span></div>
        <div class="summary-row"><span>Bank</span><span>${bankDetails.bankName}</span></div>
        <div class="summary-row"><span>Account Number</span><span>${bankDetails.accountNumber}</span></div>
        <div class="summary-row"><span>Branch</span><span>${bankDetails.branch}</span></div>
        <div class="summary-row"><span>Verification Status</span><span>${bankDetails.status}</span></div>
      </div>
    `;
    openPrintWindow(`Monthly Statement — ${monthLabel} — Trinco Bites`, htmlBody);
    toast.success("Monthly Statement opened for printing/saving as PDF.");
  };

  /** Generates and directly downloads an HTML invoice file for a specific payout.
   *  Uses Blob download (no popup) — open the file in browser then Ctrl+P to save as PDF. */
  const handleDownloadPayoutInvoice = (payout: PayoutRecord) => {
    const formattedId = formatPayoutId(payout.id);
    const htmlBody = `
      <p class="section-title">Payout Invoice &mdash; ${formattedId}</p>
      <div class="summary-box">
        <div class="summary-row"><span>Invoice Number</span><span>${formattedId}</span></div>
        <div class="summary-row"><span>Settle Date</span><span>${payout.date}</span></div>
        <div class="summary-row"><span>Recipient Bank</span><span>${bankDetails.bankName}</span></div>
        <div class="summary-row"><span>Account Holder</span><span>${bankDetails.holderName}</span></div>
        <div class="summary-row"><span>Account Number</span><span>${bankDetails.accountNumber}</span></div>
        <div class="summary-row"><span>Branch</span><span>${bankDetails.branch}</span></div>
        <div class="summary-row"><span>Payment Status</span><span>${payout.status}</span></div>
        <div class="summary-row"><span>Total Amount Credited</span><span>LKR ${payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      </div>
      <p style="font-size:10px;color:#888;">This invoice confirms a direct deposit credited to the above bank account by Trinco Bites Payments Platform.</p>
    `;
    const filename = `invoice-${formattedId}-${payout.date}.html`;
    downloadHTML(filename, `Payout Invoice ${formattedId} — Trinco Bites`, htmlBody);
    toast.success(`Invoice ${formattedId} downloaded! Open the file and press Ctrl+P to save as PDF.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 text-[#4E3E2A] dark:text-slate-100 pb-16 font-sans relative"
    >
      {/* ============================================================================
          PAGE HEADER (Clean modular summary bar)
          ============================================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#4E3E2A]/10 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D45113] to-[#813405] flex items-center justify-center shadow-md">
            <CreditCard className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#813405] dark:text-[#F9A03F] tracking-tight">
              Payments & Wallet
            </h1>
            <p className="text-xs font-semibold text-[#4E3E2A]/50 dark:text-slate-400 mt-1">
              Track restaurant payouts, settle available balances, edit bank
              setups, and process customer refunds.
            </p>
          </div>
        </div>

        {/* Action button to download monthly statement report */}
        <button
          onClick={handleDownloadMonthlyStatement}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FFFCF5] hover:bg-[#F8DDA4]/20 border border-[#F8DDA4]/65 dark:bg-slate-950 dark:border-slate-800 text-[#813405] dark:text-[#F9A03F] text-xs font-black rounded-xl transition cursor-pointer"
        >
          <FileText size={14} />
          <span>Download Statement</span>
        </button>
      </div>

      {/* ============================================================================
          1. WALLET OVERVIEW CARDS (4-Column Layout)
          ============================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card A: Available Balance (Withdrawal Pool) */}
        <div className="bg-gradient-to-br from-[#FFFCF5] to-orange-50/20 dark:from-slate-900 dark:to-slate-950 p-5 rounded-3xl border-2 border-[#F9A03F]/25 dark:border-[#F9A03F]/10 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] font-black text-[#D45113] uppercase tracking-wider block">
              Available Balance
            </span>
            <span className="text-2xl font-black text-[#813405] dark:text-[#F9A03F] mt-1 block">
              LKR{" "}
              {availableBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <span className="text-[9px] font-bold text-[#D45113] bg-[#D45113]/8 px-2 py-0.5 rounded border border-[#D45113]/10 self-start mt-2">
            Ready to withdraw
          </span>
        </div>

        {/* Card B: Pending Settlements (Order cycle) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#4E3E2A]/10 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] font-black text-[#4E3E2A]/50 dark:text-slate-400 uppercase tracking-wider block">
              Pending Settlement
            </span>
            <span className="text-2xl font-black text-[#813405] dark:text-slate-100 mt-1 block">
              LKR{" "}
              {pendingSettlement.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-450 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/50 self-start mt-2">
            Settles next cycle
          </span>
        </div>

        {/* Card C: Today's Orders Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#4E3E2A]/10 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] font-black text-[#4E3E2A]/50 dark:text-slate-400 uppercase tracking-wider block">
              Today's Earnings
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              LKR{" "}
              {todayEarnings.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100/55 self-start mt-2">
            Active today
          </span>
        </div>

        {/* Card D: This Month's Cumulative Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#4E3E2A]/10 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] font-black text-[#4E3E2A]/50 dark:text-slate-400 uppercase tracking-wider block">
              This Month's Earnings
            </span>
            <span className="text-2xl font-black text-[#813405] dark:text-slate-100 mt-1 block">
              LKR{" "}
              {monthEarnings.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <span className="text-[9px] font-bold text-[#71A066] bg-emerald-50/50 dark:bg-[#71A066]/10 px-2 py-0.5 rounded border border-[#71A066]/15 self-start mt-2">
            Month to date
          </span>
        </div>
      </div>

      {/* ============================================================================
          MAIN CONTENT WORKSPACE (Two-Column Layout)
          ============================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==========================================
            LEFT WORKSPACE COLUMN (8/12 on Desktop)
            ========================================== */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 6. RECENT TRANSACTIONS TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4E3E2A]/5 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-[#813405] dark:text-[#F9A03F] uppercase tracking-wider">
                  Recent Transactions
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Summary logs of sales and deductions.
                </p>
              </div>

              {/* Transactions search and dynamic filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-full sm:w-40">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#4E3E2A]/30" />
                  <input
                    type="text"
                    placeholder="Search Order #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-[#FFFCF5]/50 dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45113] placeholder-slate-400 dark:text-slate-200"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-[#FFFCF5]/50 dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-lg py-1.5 px-2 text-[11px] text-[#4E3E2A]/70 dark:text-slate-355 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Transactions</option>
                  <option value="Revenue">Orders Revenue</option>
                  <option value="Refunds">Refund Debits</option>
                </select>
              </div>
            </div>

            {/* Transactions Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#4E3E2A]/5 dark:border-slate-800 text-[10px] font-black text-[#4E3E2A]/40 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-2 px-3">Transaction ID</th>
                    <th className="py-2 px-3">Order Number</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTransactions().map((txn) => {
                    const isCredit = txn.amount > 0;
                    const statusClass = {
                      Completed:
                        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      Processing:
                        "bg-amber-500/10 text-amber-600 border-amber-500/20",
                      Failed: "bg-rose-500/10 text-rose-600 border-rose-500/20",
                    }[txn.status];

                    return (
                      <tr
                        key={txn.id}
                        className="border-b border-[#4E3E2A]/3 dark:border-slate-800/40 hover:bg-[#FFFCF5]/20 dark:hover:bg-slate-900/40 text-xs text-[#4E3E2A]/85 dark:text-slate-350 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-[11px] text-slate-400">
                          {txn.id}
                        </td>
                        <td className="py-3 px-3 font-black text-[#813405] dark:text-[#F9A03F]">
                          {txn.orderNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span className="flex items-center gap-1.5">
                            {isCredit ? (
                              <ArrowUpRight
                                size={12}
                                className="text-emerald-500"
                              />
                            ) : (
                              <ArrowDownRight
                                size={12}
                                className="text-rose-500"
                              />
                            )}
                            {txn.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-medium text-[11px]">
                          {txn.date}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusClass}`}
                          >
                            {txn.status}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-black ${isCredit ? "text-emerald-600" : "text-rose-500"
                            }`}
                        >
                          {isCredit ? "+" : ""}LKR {txn.amount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}

                  {getFilteredTransactions().length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-xs text-slate-400"
                      >
                        No transactions matches filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>



          {/* 9. PAYOUT HISTORY TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="border-b border-[#4E3E2A]/5 dark:border-slate-800 pb-4 mb-4">
              <h3 className="text-sm font-black text-[#813405] dark:text-[#F9A03F] uppercase tracking-wider">
                Settled Direct Deposits
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Past direct deposits credited directly to your bank account
                partner.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#4E3E2A]/5 dark:border-slate-800 text-[10px] font-black text-[#4E3E2A]/40 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Payout ID</th>
                    <th className="py-2.5 px-3">Amount Credited</th>
                    <th className="py-2.5 px-3">Settle Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Invoice Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutHistory.map((payout) => (
                    <tr
                      key={payout.id}
                      className="border-b border-[#4E3E2A]/3 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-xs text-[#4E3E2A]/85 dark:text-slate-350"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-400 text-[11px]">
                        {formatPayoutId(payout.id)}
                      </td>
                      <td className="py-3 px-3 font-black">
                        LKR{" "}
                        {payout.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-medium text-[11px]">
                        {payout.date}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${payout.status === "Settled"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse"
                            }`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDownloadPayoutInvoice(payout)}
                          className="text-[10px] font-black text-[#D45113] hover:text-[#813405] dark:text-[#F9A03F] flex items-center justify-end gap-1 cursor-pointer transition ml-auto"
                        >
                          <Download size={11} />
                          <span>PDF Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refund Log & Tracker Table */}
          <div className="bg-white dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 p-6 rounded-3xl shadow-sm mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4E3E2A]/5 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-[#813405] dark:text-[#F9A03F] uppercase tracking-wider">
                  Refund Log & Tracker
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Track automatic card refunds and manually logged cash refunds.
                </p>
              </div>
              <button
                onClick={() => setIsAddingRefund(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFCF5] hover:bg-[#F8DDA4]/20 border border-[#F8DDA4]/65 dark:bg-slate-950 dark:border-slate-800 text-[#813405] dark:text-[#F9A03F] text-[10px] font-black rounded-lg transition cursor-pointer"
              >
                <span>+ Log Cash Refund</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#4E3E2A]/5 dark:border-slate-800 text-[10px] font-black text-[#4E3E2A]/40 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3 text-right">Refund Status</th>
                  </tr>
                </thead>
                <tbody>
                  {refundRequests.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-[#4E3E2A]/3 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-xs text-[#4E3E2A]/85 dark:text-slate-350"
                    >
                      <td className="py-3 px-3 font-black text-[#813405] dark:text-[#F9A03F]">
                        {claim.orderNumber}
                      </td>
                      <td className="py-3 px-3 font-extrabold">
                        {claim.customerName}
                      </td>
                      <td
                        className="py-3 px-3 max-w-[200px] truncate text-slate-400 font-semibold"
                        title={claim.reason}
                      >
                        {claim.reason}
                      </td>
                      <td className="py-3 px-3 font-black text-rose-500">
                        LKR {claim.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <select
                          value={claim.status}
                          onChange={(e) => handleUpdateRefundStatus(claim.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border focus:outline-none cursor-pointer ${
                            claim.status === "Approved" || claim.status === "Completed"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : claim.status === "Processing"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : claim.status === "Rejected"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {refundRequests.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-xs text-slate-400"
                      >
                        No refunds recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ==========================================
            RIGHT WORKSPACE COLUMN (4/12 on Desktop)
            ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 2. SETTLEMENT & PAYOUT CYCLE DETAILS */}
          <div className="bg-gradient-to-br from-[#813405] to-[#4a1801] text-white p-6 rounded-3xl shadow-glow">
            <h3 className="text-xs font-black text-[#F9A03F] uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={14} /> Settlement Cycle
            </h3>

            <div className="mt-4">
              <span className="text-[10px] text-white/50 font-bold uppercase block">
                Next Direct Deposit Pool
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                LKR{" "}
                {settlementInfo.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs font-medium text-white/80">
              <div className="flex justify-between">
                <span className="text-white/50">Settlement Period:</span>
                <span>{settlementInfo.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Orders Included:</span>
                <span className="font-extrabold text-[#F9A03F]">
                  {settlementInfo.ordersIncluded} orders
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Deposit Transit Date:</span>
                <span>{settlementInfo.expectedDate}</span>
              </div>
            </div>

            {/* Withdraw balance button */}
            <button
              onClick={handleRequestEarlyPayout}
              disabled={isWithdrawing || availableBalance === 0}
              className="mt-6 w-full py-2.5 bg-gradient-to-r from-[#D45113] to-[#F9A03F] disabled:from-slate-400 disabled:to-slate-500 hover:brightness-105 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isWithdrawing ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Processing settle...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight size={13} className="stroke-[3]" />
                  <span>Request Early Payout</span>
                </>
              )}
            </button>
          </div>

          {/* 3. BANK ACCOUNT DETAILS BOX */}
          <div className="bg-white dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between border-b border-[#4E3E2A]/5 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-black text-[#813405] dark:text-[#F9A03F] uppercase tracking-wider">
                  Bank Partner
                </h3>
                <p className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100/50 mt-1 inline-block">
                  {bankDetails.status}
                </p>
              </div>

              {/* Edit Details */}
              <button
                onClick={handleOpenBankEditModal}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-[#813405] transition cursor-pointer"
                title="Edit routing details"
              >
                <Edit size={14} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#4E3E2A]/85 dark:text-slate-350">
              <div>
                <span className="text-[9px] text-slate-450 font-bold block">
                  Account Holder Name
                </span>
                <span className="font-extrabold mt-0.5 block">
                  {bankDetails.holderName || "Not Configured"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] text-slate-450 font-bold block">
                    Bank Partner
                  </span>
                  <span className="font-extrabold mt-0.5 block">
                    {bankDetails.bankName || "Not Configured"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 font-bold block">
                    Account #
                  </span>
                  <span className="font-mono font-bold mt-0.5 block">
                    {bankDetails.accountNumber || "Not Configured"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[9px] text-slate-450 font-bold block">
                  Branch
                </span>
                <span className="font-bold mt-0.5 block">
                  {bankDetails.branch || "Not Configured"}
                </span>
              </div>
            </div>
          </div>

          {/* 4 & 5. EARNINGS BREAKDOWN & CHARGES waterfall */}
          <div className="bg-white dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <h3 className="text-xs font-black text-[#813405] dark:text-[#F9A03F] uppercase tracking-wider border-b border-[#4E3E2A]/5 dark:border-slate-800 pb-3 mb-4">
              Earnings Breakdown
            </h3>

            {/* Calculation lists */}
            <div className="space-y-3.5 text-xs text-[#4E3E2A]/80 dark:text-slate-350">
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>Delivery Orders Revenue</span>
                <span className="font-bold text-[#4E3E2A] dark:text-slate-200">
                  +LKR {breakdown.deliveryRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>Pickup Orders Revenue</span>
                <span className="font-bold text-[#4E3E2A] dark:text-slate-200">
                  +LKR {breakdown.pickupRevenue.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>Platform Promotions</span>
                <span className="font-bold text-[#4E3E2A] dark:text-slate-200">
                  +LKR {breakdown.promotionsContribution.toLocaleString()}
                </span>
              </div>

              <div className="h-px bg-[#4E3E2A]/5 dark:bg-slate-800 my-2" />

              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>Platform Commission (10%)</span>
                <span className="font-bold text-rose-500">
                  -LKR {breakdown.platformCommission.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>Delivery Service Fee</span>
                <span className="font-bold text-rose-500">
                  -LKR {breakdown.deliveryFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>Taxes & Levies</span>
                <span className="font-bold text-rose-500">
                  -LKR {breakdown.taxes.toLocaleString()}
                </span>
              </div>

              {/* Highlight Box */}
              <div className="bg-[#FFFCF5] dark:bg-slate-950 border border-[#F8DDA4]/60 dark:border-slate-850 p-3 rounded-2xl flex justify-between items-center mt-4">
                <span className="text-[10px] font-black text-[#813405] dark:text-[#F9A03F] uppercase tracking-wider">
                  Net Earnings
                </span>
                <span className="text-base font-black text-[#813405] dark:text-slate-100">
                  LKR{" "}
                  {netEarnings.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>



        </div>
      </div>

      {/* ============================================================================
          EDIT BANK ACCOUNT DETAILS DIALOG MODAL
          ============================================================================ */}
      <AnimatePresence>
        {isEditingBank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop overlay blur background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingBank(false)}
              className="fixed inset-0 bg-black/45 dark:bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog container box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md bg-[#FFFCF5] dark:bg-slate-900 border border-[#4E3E2A]/15 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 z-10 overflow-hidden"
            >
              {/* Decorative top strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#D45113] via-[#F9A03F] to-[#813405] absolute top-0 left-0" />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#4E3E2A]/10 dark:border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#D45113]/10 rounded-xl text-[#D45113]">
                    <Building size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#813405] dark:text-[#F9A03F] tracking-tight">
                      Edit Bank Account Details
                    </h3>
                    <p className="text-[10px] text-[#4E3E2A]/50 dark:text-slate-400 font-bold uppercase tracking-wider">
                      Requires compliance re-verification
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingBank(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-650 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Bank update inputs form */}
              <form
                onSubmit={handleSaveBankForm}
                className="space-y-4 text-xs font-semibold"
              >
                {/* Account Holder Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={tempHolderName}
                    onChange={(e) => setTempHolderName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] dark:text-slate-200"
                  />
                </div>

                {/* Bank Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">
                    Bank Partner Name
                  </label>
                  <input
                    type="text"
                    required
                    value={tempBankName}
                    onChange={(e) => setTempBankName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] dark:text-slate-200"
                  />
                </div>

                {/* Account Number & Branch details in a row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      value={tempAccountNumber}
                      onChange={(e) => setTempAccountNumber(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] font-mono dark:text-slate-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Branch Location
                    </label>
                    <input
                      type="text"
                      required
                      value={tempBranchName}
                      onChange={(e) => setTempBranchName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-2.5 mt-2">
                  <AlertTriangle
                    className="text-amber-500 shrink-0 mt-0.5"
                    size={16}
                  />
                  <p className="text-[10px] leading-relaxed text-[#4E3E2A]/60">
                    Important note: Modifying banking details will suspend
                    active payout validation checks for audit verification
                    (typically 24 hours).
                  </p>
                </div>

                {/* Confirm actions */}
                <div className="flex justify-end gap-2.5 border-t border-[#4E3E2A]/10 dark:border-slate-800 pt-5 mt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingBank(false)}
                    className="px-4 py-2 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 text-[#4E3E2A]/70 dark:text-slate-350 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#D45113] hover:bg-[#813405] text-white rounded-xl shadow-md cursor-pointer transition"
                  >
                    Confirm & Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Manual Cash Refund Modal Dialog */}
      <AnimatePresence>
        {isAddingRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingRefund(false)}
              className="fixed inset-0 bg-black/45 dark:bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog container box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md bg-[#FFFCF5] dark:bg-slate-900 border border-[#4E3E2A]/15 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 z-10 overflow-hidden"
            >
              {/* Decorative top strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-[#813405] absolute top-0 left-0" />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#4E3E2A]/10 dark:border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#813405] dark:text-[#F9A03F] tracking-tight">
                      Log Manual Cash Refund
                    </h3>
                    <p className="text-[10px] text-[#4E3E2A]/50 dark:text-slate-400 font-bold uppercase tracking-wider">
                      Record a direct cash refund to diner
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddingRefund(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-650 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddRefund} className="space-y-4 text-xs font-semibold">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Order Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., TRC-12345"
                    value={newOrderNumber}
                    onChange={(e) => setNewOrderNumber(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] dark:text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., John Doe"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Refund Amount (LKR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g., 1500"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] dark:text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Refund Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] dark:text-slate-200"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Reason for Refund</label>
                  <textarea
                    required
                    placeholder="e.g., Order cancellation cash refund for missing items"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full h-20 p-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] leading-relaxed dark:text-slate-200 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 border-t border-[#4E3E2A]/10 dark:border-slate-800 pt-5 mt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingRefund(false)}
                    className="px-4 py-2 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 text-[#4E3E2A]/70 dark:text-slate-350 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md cursor-pointer transition"
                  >
                    Log Refund
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </motion.div>
  );
}

export default PaymentWallet;
