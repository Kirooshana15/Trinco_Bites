import { useState } from "react";
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

// ============================================================================
// 1. DATA TYPE DEFINITIONS (Simple structures to store our dashboard values)
// ============================================================================

// Model representing a transaction row in our history table
interface Transaction {
  id: string;
  orderNumber: string;
  amount: number;
  type: "Order Revenue" | "Tip Received" | "Refund Debit";
  date: string;
  status: "Completed" | "Processing" | "Failed";
}

// Model representing a pending guest refund request
interface RefundRequest {
  id: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

// Model representing a past bank deposit payout
interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  status: "Settled" | "Processing";
}

// Model representing bank details
interface BankDetails {
  holderName: string;
  bankName: string;
  accountNumber: string;
  branch: string;
  status: "Verified" | "Verification Pending";
}

export function PaymentWallet() {
  // ============================================================================
  // 2. DASHBOARD DATA & STATE HOOKS (Simple React values that trigger updates)
  // ============================================================================

  // Wallet Balances (Available, Pending, and Earnings counters)
  const [availableBalance, setAvailableBalance] = useState(48250.0);
  const [pendingSettlement, setPendingSettlement] = useState(15420.0);
  const [todayEarnings, setTodayEarnings] = useState(8450.0);
  const [monthEarnings, setMonthEarnings] = useState(184200.0);

  // Loading spinner states for requests
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Settlement information parameters (Static, simple object)
  const settlementInfo = {
    amount: 15420.0,
    period: "May 25, 2026 - May 29, 2026",
    ordersIncluded: 34,
    expectedDate: "June 01, 2026",
  };

  // Verified Bank details state
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    holderName: "Trinco Bites Restaurant Group",
    bankName: "Commercial Bank of Ceylon",
    accountNumber: "**********9824",
    branch: "Trincomalee Main Branch",
    status: "Verified",
  });

  // Modal open controls for Bank Details edit form
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [tempHolderName, setTempHolderName] = useState("");
  const [tempBankName, setTempBankName] = useState("");
  const [tempAccountNumber, setTempAccountNumber] = useState("");
  const [tempBranchName, setTempBranchName] = useState("");

  // Earnings Breakdown figures (Simple layout values)
  const breakdown = {
    deliveryRevenue: 132400.0,
    pickupRevenue: 41250.0,
    tipsReceived: 6250.0,
    promotionsContribution: 4300.0,
    platformCommission: 18420.0,
    deliveryFee: 6250.0,
    taxes: 8400.0,
  };

  // Simple direct arithmetic to calculate net earnings (No complex React useMemo)
  const totalRevenue =
    breakdown.deliveryRevenue +
    breakdown.pickupRevenue +
    breakdown.tipsReceived +
    breakdown.promotionsContribution;
  const totalDeductions =
    breakdown.platformCommission + breakdown.deliveryFee + breakdown.taxes;
  const netEarnings = totalRevenue - totalDeductions;

  // Recent Payout Transactions list
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "TXN-9842",
      orderNumber: "TB-9824",
      amount: 4200.0,
      type: "Order Revenue",
      date: "2026-05-29 11:45",
      status: "Completed",
    },
    {
      id: "TXN-9841",
      orderNumber: "TB-9824",
      amount: 250.0,
      type: "Tip Received",
      date: "2026-05-29 11:45",
      status: "Completed",
    },
    {
      id: "TXN-9840",
      orderNumber: "TB-9822",
      amount: 1850.0,
      type: "Order Revenue",
      date: "2026-05-29 10:12",
      status: "Completed",
    },
    {
      id: "TXN-9839",
      orderNumber: "TB-9818",
      amount: 3200.0,
      type: "Order Revenue",
      date: "2026-05-29 08:30",
      status: "Completed",
    },
    {
      id: "TXN-9838",
      orderNumber: "TB-9795",
      amount: -1500.0,
      type: "Refund Debit",
      date: "2026-05-28 16:40",
      status: "Completed",
    },
    {
      id: "TXN-9837",
      orderNumber: "TB-9810",
      amount: 2450.0,
      type: "Order Revenue",
      date: "2026-05-28 14:15",
      status: "Completed",
    },
    {
      id: "TXN-9836",
      orderNumber: "TB-9808",
      amount: 5120.0,
      type: "Order Revenue",
      date: "2026-05-28 11:05",
      status: "Completed",
    },
    {
      id: "TXN-9835",
      orderNumber: "TB-9805",
      amount: 350.0,
      type: "Tip Received",
      date: "2026-05-28 09:20",
      status: "Completed",
    },
    {
      id: "TXN-9834",
      orderNumber: "TB-9799",
      amount: 1980.0,
      type: "Order Revenue",
      date: "2026-05-27 19:40",
      status: "Completed",
    },
    {
      id: "TXN-9833",
      orderNumber: "TB-9801",
      amount: 4890.0,
      type: "Order Revenue",
      date: "2026-05-27 18:15",
      status: "Failed",
    },
  ]);

  // Search keyword & category type filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Pending Refund claims queue
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([
    {
      id: "REF-101",
      customerName: "Shamil Mohamed",
      orderNumber: "TB-9804",
      amount: 1850.0,
      reason: "Incorrect dish delivered (Burger was beef instead of chicken)",
      status: "Pending",
    },
    {
      id: "REF-102",
      customerName: "Ramesh Kumar",
      orderNumber: "TB-9788",
      amount: 3200.0,
      reason: "Delivery delayed past 90 mins (Food was cold)",
      status: "Pending",
    },
    {
      id: "REF-103",
      customerName: "Minuki De Silva",
      orderNumber: "TB-9755",
      amount: 980.0,
      reason: "Missing beverages and garlic bread",
      status: "Pending",
    },
  ]);

  // Refund Rules & Policies settings states
  const [refundPolicy, setRefundPolicy] = useState(
    "Refunds will be processed instantly if errors are validated. Dynamic reviews on complaints are performed on high value disputes above LKR 2,500. Automatic restock clearances will trigger upon approval.",
  );
  const [autoApproveSmall, setAutoApproveSmall] = useState(true);
  const [maxRefundLimit, setMaxRefundLimit] = useState(1000);

  // Payout direct deposits history list
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([
    { id: "PAY-501", amount: 142850.0, date: "2026-05-25", status: "Settled" },
    { id: "PAY-502", amount: 128400.0, date: "2026-05-18", status: "Settled" },
    { id: "PAY-503", amount: 98650.0, date: "2026-05-11", status: "Settled" },
    { id: "PAY-504", amount: 154200.0, date: "2026-05-04", status: "Settled" },
  ]);

  // Export report loaders map
  const [exportLoadingKey, setExportLoadingKey] = useState("");

  // ============================================================================
  // 3. EVENT HANDLERS (Simple functions to change data when buttons are clicked)
  // ============================================================================

  // Triggers when a user filters recent transactions list
  const getFilteredTransactions = () => {
    return transactions.filter((txn) => {
      // 1. Filter by keyword matching ID or Order Number
      const matchesSearch =
        txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Filter by Transaction category type dropdown selection
      let matchesType = false;
      if (filterType === "All") {
        matchesType = true;
      } else if (filterType === "Revenue" && txn.type === "Order Revenue") {
        matchesType = true;
      } else if (filterType === "Tips" && txn.type === "Tip Received") {
        matchesType = true;
      } else if (filterType === "Refunds" && txn.type === "Refund Debit") {
        matchesType = true;
      }

      return matchesSearch && matchesType;
    });
  };

  // Triggers when owner requests early balance payout withdrawal
  const handleRequestEarlyPayout = () => {
    if (availableBalance <= 1000) {
      toast.error("Available balance is too low for early payout.");
      return;
    }

    setIsWithdrawing(true);

    // Simulate network latency before updating balance
    setTimeout(() => {
      setIsWithdrawing(false);
      const payoutAmount = availableBalance;
      setAvailableBalance(0); // Balance is transferred to bank account

      // Record payout to historical settlements list
      const today = new Date();
      const pad = (val: number) => val.toString().padStart(2, "0");
      const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

      const newPayout: PayoutRecord = {
        id: `PAY-${Date.now().toString().slice(-3)}`,
        amount: payoutAmount,
        date: dateStr,
        status: "Processing",
      };

      setPayoutHistory((prevHistory) => [newPayout, ...prevHistory]);
      toast.success(
        `Payout of LKR ${payoutAmount.toLocaleString()} requested! Funds will credit your account shortly.`,
      );
    }, 1500);
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
  const handleSaveBankForm = (e: React.FormEvent) => {
    e.preventDefault();
    setBankDetails({
      holderName: tempHolderName,
      bankName: tempBankName,
      accountNumber: tempAccountNumber,
      branch: tempBranchName,
      status: "Verification Pending", // Triggers audit re-verification
    });
    setIsEditingBank(false);
    toast.success(
      "Bank settings updated successfully! Verification audit in progress.",
    );
  };

  // Approves or rejects customer refund claims
  const handleResolveCustomerRefund = (
    requestId: string,
    outcome: "Approve" | "Reject",
  ) => {
    const claim = refundRequests.find((r) => r.id === requestId);
    if (!claim) return;

    if (outcome === "Approve") {
      // Deduct balance directly
      if (availableBalance >= claim.amount) {
        setAvailableBalance((prev) => prev - claim.amount);
      } else {
        setPendingSettlement((prev) => prev - claim.amount);
      }

      // Record a refund debit transaction entry
      const now = new Date();
      const pad = (val: number) => val.toString().padStart(2, "0");
      const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const newTxn: Transaction = {
        id: `TXN-${Date.now().toString().slice(-4)}`,
        orderNumber: claim.orderNumber,
        amount: -claim.amount, // Negated debit amount
        type: "Refund Debit",
        date: timestampStr,
        status: "Completed",
      };

      setTransactions((prevTxns) => [newTxn, ...prevTxns]);
      toast.success(
        `Refund of LKR ${claim.amount.toLocaleString()} approved for ${claim.customerName}!`,
      );
    } else {
      toast.error(
        `Refund request rejected for ${claim.customerName}. Dispute reported to admin.`,
      );
    }

    // Clear request item from queue list
    setRefundRequests((prevRequests) =>
      prevRequests.filter((r) => r.id !== requestId),
    );
  };

  // Saves refund policy inputs
  const handleSaveRefundSettings = () => {
    setIsSavingSettings(true);
    setTimeout(() => {
      setIsSavingSettings(false);
      toast.success("Refund criteria policies saved successfully.");
    }, 850);
  };

  // ─── File Download Helpers ──────────────────────────────────────────────────

  /** Triggers a browser CSV file download from string content */
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.setAttribute("download", filename);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

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

  // ─── Export Handlers ─────────────────────────────────────────────────────────

  /** Exports all transaction history to a CSV file */
  const handleExportTransactionsCSV = () => {
    setExportLoadingKey("txns");
    const headers = ["Transaction ID", "Order Number", "Type", "Date", "Status", "Amount (LKR)"];
    const rows = transactions.map((t) => [
      t.id,
      t.orderNumber,
      t.type,
      t.date,
      t.status,
      t.amount.toFixed(2),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const filename = `trinco-bites-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    setTimeout(() => {
      downloadCSV(filename, csvContent);
      setExportLoadingKey("");
      toast.success("Transaction log downloaded as CSV!");
    }, 600);
  };

  /** Exports payout history as a printable PDF via browser */
  const handleExportPayoutHistoryPDF = () => {
    setExportLoadingKey("payouts");
    const rows = payoutHistory
      .map(
        (p) =>
          `<tr>
            <td style="font-family:monospace;">${p.id}</td>
            <td class="amount-credit">LKR ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td>${p.date}</td>
            <td><span class="badge badge-${p.status.toLowerCase()}">${p.status}</span></td>
          </tr>`,
      )
      .join("");
    const totalPaid = payoutHistory.reduce((acc, p) => acc + p.amount, 0);
    const htmlBody = `
      <p class="section-title">Settled Direct Deposits — Full Payout History</p>
      <table>
        <thead><tr><th>Payout ID</th><th>Amount Credited</th><th>Settle Date</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary-box">
        <div class="summary-row"><span>Total Records</span><span>${payoutHistory.length} payouts</span></div>
        <div class="summary-row"><span>Total Credited</span><span>LKR ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      </div>
    `;
    setTimeout(() => {
      openPrintWindow("Payout History Report — Trinco Bites", htmlBody);
      setExportLoadingKey("");
      toast.success("Payout History Report opened for printing/saving.");
    }, 600);
  };

  /** Exports refund requests list as a CSV file */
  const handleExportRefundsCSV = () => {
    setExportLoadingKey("refunds");
    const headers = ["Refund ID", "Customer Name", "Order Number", "Amount (LKR)", "Reason", "Status"];
    const rows = refundRequests.map((r) => [
      r.id,
      r.customerName,
      r.orderNumber,
      r.amount.toFixed(2),
      r.reason,
      r.status,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const filename = `trinco-bites-refunds-${new Date().toISOString().slice(0, 10)}.csv`;
    setTimeout(() => {
      downloadCSV(filename, csvContent);
      setExportLoadingKey("");
      toast.success("Refund report downloaded as CSV!");
    }, 600);
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
          <tr><td>Tips Received</td><td class="amount-credit">+LKR ${breakdown.tipsReceived.toLocaleString()}</td></tr>
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
    const htmlBody = `
      <p class="section-title">Payout Invoice &mdash; ${payout.id}</p>
      <div class="summary-box">
        <div class="summary-row"><span>Invoice Number</span><span>${payout.id}</span></div>
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
    const filename = `invoice-${payout.id}-${payout.date}.html`;
    downloadHTML(filename, `Payout Invoice ${payout.id} — Trinco Bites`, htmlBody);
    toast.success(`Invoice ${payout.id} downloaded! Open the file and press Ctrl+P to save as PDF.`);
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
                  Summary logs of sales, tips, and deductions.
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
                  <option value="Tips">Tips Only</option>
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
                          className={`py-3 px-3 text-right font-black ${
                            isCredit ? "text-emerald-600" : "text-rose-500"
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

          {/* 7. REFUND MANAGEMENT TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="border-b border-[#4E3E2A]/5 dark:border-slate-800 pb-4 mb-4">
              <h3 className="text-sm font-black text-[#813405] dark:text-[#F9A03F] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-500" /> Diner
                Refund Requests
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Claims raised due to ingredient errors or delays. Confirm to
                credit guest wallet immediately.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#4E3E2A]/5 dark:border-slate-800 text-[10px] font-black text-[#4E3E2A]/40 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Dispute Reason</th>
                    <th className="py-2.5 px-3">Dispute Amount</th>
                    <th className="py-2.5 px-3 text-right">
                      Action Resolution
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {refundRequests.map((claim) => (
                      <motion.tr
                        key={claim.id}
                        layout
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-[#4E3E2A]/3 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-xs text-[#4E3E2A]/85 dark:text-slate-350"
                      >
                        <td className="py-3 px-3 font-extrabold">
                          {claim.customerName}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#813405] dark:text-[#F9A03F]">
                          {claim.orderNumber}
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                handleResolveCustomerRefund(claim.id, "Approve")
                              }
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-sm transition flex items-center gap-1"
                            >
                              <Check size={10} strokeWidth={3} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() =>
                                handleResolveCustomerRefund(claim.id, "Reject")
                              }
                              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-500 hover:text-rose-500 rounded-lg text-[10px] font-black cursor-pointer transition flex items-center gap-1"
                            >
                              <X size={10} strokeWidth={3} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}

                    {refundRequests.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-xs text-emerald-600 bg-emerald-500/5 rounded-2xl font-bold"
                        >
                          🎉 Complete! No pending diner refund requests.
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
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
                        {payout.id}
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
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            payout.status === "Settled"
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
                  {bankDetails.holderName}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] text-slate-450 font-bold block">
                    Bank Partner
                  </span>
                  <span className="font-extrabold mt-0.5 block">
                    {bankDetails.bankName}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 font-bold block">
                    Account #
                  </span>
                  <span className="font-mono font-bold mt-0.5 block">
                    {bankDetails.accountNumber}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[9px] text-slate-450 font-bold block">
                  Branch
                </span>
                <span className="font-bold mt-0.5 block">
                  {bankDetails.branch}
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
                <span>Tips Received</span>
                <span className="font-bold text-emerald-600">
                  +LKR {breakdown.tipsReceived.toLocaleString()}
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

          {/* 8. REFUND POLICY SETTINGS FORM */}
          <div className="bg-white dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-[#813405] dark:text-[#F9A03F] uppercase tracking-wider border-b border-[#4E3E2A]/5 dark:border-slate-800 pb-3">
              Refund Settings
            </h3>

            <div className="space-y-4 text-xs font-medium">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">
                  Custom Refund Policy
                </label>
                <textarea
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                  className="w-full h-24 p-2.5 bg-[#FFFCF5]/50 dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] leading-relaxed dark:text-slate-200"
                />
              </div>

              {/* Simple toggle block */}
              <div
                onClick={() => setAutoApproveSmall(!autoApproveSmall)}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-[#4E3E2A]/5 dark:border-slate-800 rounded-xl cursor-pointer select-none"
              >
                <div>
                  <span className="font-extrabold text-[#4E3E2A] dark:text-slate-200 block">
                    Auto Approve Small Claims
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Approve claims below limits instantly
                  </span>
                </div>
                <div
                  className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 shrink-0 ${
                    autoApproveSmall
                      ? "bg-emerald-500"
                      : "bg-slate-250 dark:bg-slate-850"
                  }`}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow"
                    animate={{ x: autoApproveSmall ? 14 : 0 }}
                  />
                </div>
              </div>

              {/* Limit value configuration */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">
                  Maximum Instant Claim Limit (LKR)
                </label>
                <input
                  type="number"
                  value={maxRefundLimit}
                  onChange={(e) => setMaxRefundLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FFFCF5]/50 dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D45113] font-bold dark:text-slate-250"
                />
              </div>

              <button
                onClick={handleSaveRefundSettings}
                disabled={isSavingSettings}
                className="w-full py-2.5 bg-[#813405] hover:bg-[#D45113] text-white text-xs font-black rounded-xl transition cursor-pointer shadow flex items-center justify-center gap-1.5 animate-none"
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save Policy Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 10. REPORTS & EXPORTS CENTER */}
          <div className="bg-white dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-[#813405] dark:text-[#F9A03F] uppercase tracking-wider border-b border-[#4E3E2A]/5 dark:border-slate-800 pb-3">
              Reports & Exports
            </h3>

            <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
              {/* Export Transactions Log — CSV download */}
              <button
                onClick={handleExportTransactionsCSV}
                disabled={exportLoadingKey === "txns"}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-[#4E3E2A]/5 dark:bg-slate-950 dark:border-slate-850 dark:hover:bg-slate-900/60 rounded-xl transition font-extrabold text-[#4E3E2A]/80 dark:text-slate-350 cursor-pointer flex items-center justify-between disabled:opacity-60"
              >
                <span>Export Transactions Log (CSV)</span>
                {exportLoadingKey === "txns" ? (
                  <RefreshCw size={12} className="animate-spin text-[#D45113]" />
                ) : (
                  <Download size={12} className="text-slate-400" />
                )}
              </button>

              {/* Export Payout History — printable PDF */}
              <button
                onClick={handleExportPayoutHistoryPDF}
                disabled={exportLoadingKey === "payouts"}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-[#4E3E2A]/5 dark:bg-slate-950 dark:border-slate-850 dark:hover:bg-slate-900/60 rounded-xl transition font-extrabold text-[#4E3E2A]/80 dark:text-slate-350 cursor-pointer flex items-center justify-between disabled:opacity-60"
              >
                <span>Export Payout History (PDF)</span>
                {exportLoadingKey === "payouts" ? (
                  <RefreshCw size={12} className="animate-spin text-[#D45113]" />
                ) : (
                  <Download size={12} className="text-slate-400" />
                )}
              </button>

              {/* Export Refund Report — CSV download */}
              <button
                onClick={handleExportRefundsCSV}
                disabled={exportLoadingKey === "refunds"}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-[#4E3E2A]/5 dark:bg-slate-950 dark:border-slate-850 dark:hover:bg-slate-900/60 rounded-xl transition font-extrabold text-[#4E3E2A]/80 dark:text-slate-350 cursor-pointer flex items-center justify-between disabled:opacity-60"
              >
                <span>Export Refund Report (CSV)</span>
                {exportLoadingKey === "refunds" ? (
                  <RefreshCw size={12} className="animate-spin text-[#D45113]" />
                ) : (
                  <Download size={12} className="text-slate-400" />
                )}
              </button>
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
    </motion.div>
  );
}

export default PaymentWallet;
