import { useState, useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Clock,
  CheckCircle2, XCircle, Search, Filter, RefreshCw, ChevronRight,
  Printer, Download, Eye, Check, X, Play, ShieldAlert,
  Calendar, Phone, MapPin, CreditCard, Clipboard, MessageSquare,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getCartItemPrices, formatPrice, VAT_RATE } from "@/utils/pricing";

// High-fidelity Order Item Type
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedExtras?: { name: string; price: number }[];
  appliedOffer?: any;
  customPrice?: number;
  instructions?: string;
}

// Order Status Type
type OrderStatus = "Pending" | "Accepted" | "Preparing" | "Completed" | "Cancelled";

// Order Cancellation details structure
interface OrderCancellation {
  cancelledBy: "User" | "Restaurant";
  reason: string;
  refundInitiated: boolean;
}

// High-fidelity Order Structure
interface Order {
  id: string;
  restaurantId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  orderType: "Delivery" | "Self Pickup";
  items: OrderItem[];
  paymentMethod: "Cash on Delivery" | "Card Payment";
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  orderDate: string;
  status: OrderStatus;
  notes?: string;
  timeline: { status: OrderStatus; time: string }[];
  cancellation?: OrderCancellation;
}

const syncOrderStatusToCustomerDb = (
  orderId: string,
  restaurantStatus: OrderStatus,
  cancellation?: { reason: string; refundInitiated: boolean }
) => {
  const saved = localStorage.getItem("trinco_orders");
  if (!saved) return;
  try {
    const customerOrders = JSON.parse(saved);
    const updated = customerOrders.map((co: any) => {
      if (co.id === orderId) {
        let mappedStatus: "Order Received" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled" = "Order Received";
        if (restaurantStatus === "Accepted" || restaurantStatus === "Preparing") {
          mappedStatus = "Preparing";
        } else if (restaurantStatus === "Completed") {
          // No separate delivery man — restaurant marking Done = food is delivered
          mappedStatus = "Delivered";
        } else if (restaurantStatus === "Cancelled") {
          mappedStatus = "Cancelled";
        } else {
          mappedStatus = "Order Received";
        }
        return {
          ...co,
          status: mappedStatus,
          ...(cancellation && {
            cancellationReason: cancellation.reason,
            refundInitiated: cancellation.refundInitiated,
          }),
        };
      }
      return co;
    });
    localStorage.setItem("trinco_orders", JSON.stringify(updated));
    // Dispatch storage event for cross-tab sync (customer tracking page)
    window.dispatchEvent(new StorageEvent("storage", {
      key: "trinco_orders",
      newValue: JSON.stringify(updated),
      storageArea: localStorage,
    }));
  } catch (err) {
    console.error("Error syncing order status", err);
  }
};

function mapCustomerOrderToRestaurantOrder(co: any): Order {
  const timeStr = new Date(co.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  let mappedStatus: OrderStatus = "Pending";
  if (co.status === "Delivered" || co.status === "Out for Delivery") mappedStatus = "Completed";
  else if (co.status === "Cancelled") mappedStatus = "Cancelled";
  else if (co.status === "Preparing") mappedStatus = "Preparing";
  else mappedStatus = "Pending";

  const timeline = [
    { status: "Pending" as OrderStatus, time: timeStr }
  ];
  if (co.status === "Preparing") {
    timeline.push({ status: "Accepted" as OrderStatus, time: timeStr });
    timeline.push({ status: "Preparing" as OrderStatus, time: timeStr });
  }
  if (co.status === "Delivered" || co.status === "Out for Delivery") {
    timeline.push({ status: "Accepted" as OrderStatus, time: timeStr });
    timeline.push({ status: "Preparing" as OrderStatus, time: timeStr });
    timeline.push({ status: "Completed" as OrderStatus, time: timeStr });
  }
  if (co.status === "Cancelled") {
    timeline.push({ status: "Cancelled" as OrderStatus, time: timeStr });
  }

  return {
    id: co.id,
    restaurantId: co.restaurantId,
    customerName: co.contact.name,
    customerPhone: co.contact.phone,
    deliveryAddress: co.deliveryAddress,
    orderType: (co.orderType ?? "Delivery") as "Delivery" | "Self Pickup",
    items: co.items.map((it: any) => ({
      id: it.id || it.food?.id || "unknown",
      name: it.name || it.food?.name || "Food Item",
      price: it.price || 0,
      quantity: it.quantity,
      selectedSize: it.selectedSize,
      selectedExtras: it.selectedExtras,
      appliedOffer: it.appliedOffer,
      customPrice: it.customPrice,
      instructions: it.instructions || undefined
    })),
    paymentMethod: co.paymentMethod === "card" ? "Card Payment" : "Cash on Delivery",
    subtotal: co.subtotal,
    tax: co.tax ?? Math.round(co.subtotal * VAT_RATE),
    deliveryFee: co.deliveryFee ?? (co.orderType === "Delivery" ? 250 : 0),
    total: co.subtotal + (co.deliveryFee ?? (co.orderType === "Delivery" ? 250 : 0)) + (co.tax ?? Math.round(co.subtotal * VAT_RATE)),
    orderDate: `Today, ${timeStr}`,
    status: mappedStatus,
    timeline: timeline,
    notes: co.notes || undefined
  };
}

export function OrderManagement() {
  const { user } = useAuth();
  const routerState = useRouterState();
  const routeOrderId = new URLSearchParams(routerState.location.searchStr).get("orderId");
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "TB-8942",
      restaurantId: "trinco-spice",
      customerName: "Nithya R.",
      customerPhone: "077 123 4567",
      deliveryAddress: "142 Dockyard Rd, Trincomalee",
      orderType: "Delivery" as const,
      items: [
        { id: "sh-br1", name: "Chicken Biryani", price: 1050, quantity: 1 },
        { id: "sh-mj1", name: "Lime Mojito", price: 450, quantity: 1 }
      ],
      paymentMethod: "Cash on Delivery",
      subtotal: 1500,
      tax: 270,
      deliveryFee: 250,
      total: 2020,
      orderDate: "Today, 12:15 PM",
      status: "Completed",
      notes: "Deliver near the beach resort gate.",
      timeline: [
        { status: "Pending", time: "11:55 AM" },
        { status: "Accepted", time: "12:02 PM" },
        { status: "Preparing", time: "12:05 PM" },
        { status: "Completed", time: "12:15 PM" }
      ]
    },
    {
      id: "TB-8941",
      restaurantId: "trinco-spice",
      customerName: "Daniel J.",
      customerPhone: "071 987 6543",
      deliveryAddress: "45 Uppuveli Beach Rd, Trincomalee",
      orderType: "Delivery" as const,
      items: [
        { id: "sh-kt1", name: "Chicken Kottu", price: 850, quantity: 2 }
      ],
      paymentMethod: "Card Payment",
      subtotal: 1700,
      tax: 306,
      deliveryFee: 250,
      total: 2256,
      orderDate: "Today, 12:02 PM",
      status: "Preparing",
      notes: "Extra spicy and cheese if possible.",
      timeline: [
        { status: "Pending", time: "11:48 AM" },
        { status: "Accepted", time: "11:54 AM" },
        { status: "Preparing", time: "12:02 PM" }
      ]
    },
    {
      id: "TB-8940",
      restaurantId: "ocean-pearl",
      customerName: "Archana S.",
      customerPhone: "072 456 7890",
      deliveryAddress: "Post Office Junction, Trincomalee Town",
      orderType: "Self Pickup" as const,
      items: [
        { id: "sh-fr5", name: "Seafood Fried Rice", price: 1200, quantity: 1 }
      ],
      paymentMethod: "Card Payment",
      subtotal: 1200,
      tax: 216,
      deliveryFee: 0,
      total: 1416,
      orderDate: "Today, 11:48 AM",
      status: "Pending",
      timeline: [
        { status: "Pending", time: "11:48 AM" }
      ]
    },
    {
      id: "TB-8939",
      restaurantId: "biryani-palace",
      customerName: "Ramesh K.",
      customerPhone: "077 555 1234",
      deliveryAddress: "Alles Garden, Nilaveli Rd, Trincomalee",
      orderType: "Delivery" as const,
      items: [
        { id: "sh-fr6", name: "Veg Fried Rice", price: 700, quantity: 1 },
        { id: "sh-mj5", name: "Apple Mojito", price: 480, quantity: 1 }
      ],
      paymentMethod: "Cash on Delivery",
      subtotal: 1180,
      tax: 212,
      deliveryFee: 250,
      total: 1642,
      orderDate: "Today, 10:15 AM",
      status: "Completed",
      notes: "Contact upon arrival.",
      timeline: [
        { status: "Pending", time: "09:50 AM" },
        { status: "Accepted", time: "09:55 AM" },
        { status: "Preparing", time: "10:00 AM" },
        { status: "Completed", time: "10:15 AM" }
      ]
    },
    {
      id: "TB-8938",
      restaurantId: "burger-co",
      customerName: "Shamil M.",
      customerPhone: "076 777 8888",
      deliveryAddress: "Inner Harbour Road, Trincomalee",
      orderType: "Delivery" as const,
      items: [
        { id: "f7", name: "Double Cheeseburger", price: 1250, quantity: 1 }
      ],
      paymentMethod: "Card Payment",
      subtotal: 1250,
      tax: 225,
      deliveryFee: 250,
      total: 1725,
      orderDate: "Today, 09:30 AM",
      status: "Cancelled",
      notes: "Cancelled by customer before acceptance.",
      timeline: [
        { status: "Pending", time: "09:25 AM" },
        { status: "Cancelled", time: "09:30 AM" }
      ],
      cancellation: {
        cancelledBy: "User",
        reason: "Ordered by mistake / Change of mind",
        refundInitiated: true
      }
    },
    {
      id: "TB-8937",
      restaurantId: "trinco-spice",
      customerName: "Priyantha D.",
      customerPhone: "078 888 9999",
      deliveryAddress: "Koneswaram Temple Road, Trincomalee",
      orderType: "Delivery" as const,
      items: [
        { id: "sh-kt3", name: "Mutton Kottu", price: 1250, quantity: 1 },
        { id: "sh-mj2", name: "Passion Mojito", price: 550, quantity: 1 }
      ],
      paymentMethod: "Cash on Delivery",
      subtotal: 1800,
      tax: 324,
      deliveryFee: 250,
      total: 2374,
      orderDate: "Yesterday, 08:45 PM",
      status: "Completed",
      timeline: [
        { status: "Pending", time: "08:15 PM" },
        { status: "Accepted", time: "08:20 PM" },
        { status: "Preparing", time: "08:25 PM" },
        { status: "Completed", time: "08:45 PM" }
      ]
    },
    {
      id: "TB-8936",
      restaurantId: "ocean-pearl",
      customerName: "Thilini W.",
      customerPhone: "077 444 3333",
      deliveryAddress: "12 Beach Loop Rd, Uppuveli",
      orderType: "Self Pickup" as const,
      items: [
        { id: "sh-fr4", name: "Prawn Fried Rice", price: 1350, quantity: 1 },
        { id: "sh-mj2", name: "Passion Mojito", price: 550, quantity: 1 }
      ],
      paymentMethod: "Card Payment",
      subtotal: 1900,
      tax: 342,
      deliveryFee: 0,
      total: 2242,
      orderDate: "Yesterday, 07:15 PM",
      status: "Accepted",
      timeline: [
        { status: "Pending", time: "07:05 PM" },
        { status: "Accepted", time: "07:15 PM" }
      ]
    },
    {
      id: "TB-8935",
      restaurantId: "biryani-palace",
      customerName: "Kirushanth R.",
      customerPhone: "076 111 2222",
      deliveryAddress: "Green Road, Trincomalee Town",
      orderType: "Delivery" as const,
      items: [
        { id: "sh-kt5", name: "Seafood Kottu", price: 1100, quantity: 1 },
        { id: "sh-mj1", name: "Lime Mojito", price: 450, quantity: 1 }
      ],
      paymentMethod: "Cash on Delivery",
      subtotal: 1550,
      tax: 279,
      deliveryFee: 250,
      total: 2079,
      orderDate: "Yesterday, 06:30 PM",
      status: "Pending",
      timeline: [
        { status: "Pending", time: "06:30 PM" }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | OrderStatus>("All");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"today" | "7days" | "30days">("7days");
  const [selectedPayment, setSelectedPayment] = useState<"All" | "Cash on Delivery" | "Card Payment">("All");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync customer orders on mount
  useEffect(() => {
    const saved = localStorage.getItem("trinco_orders");
    if (saved) {
      try {
        const customerOrders = JSON.parse(saved);
        const mappedCustomerOrders = customerOrders.map(mapCustomerOrderToRestaurantOrder);
        setOrders((prev) => {
          const mockOnly = prev.filter((o) => !o.id.startsWith("TRC-"));
          return [...mappedCustomerOrders, ...mockOnly];
        });
      } catch (err) {
        console.error("Error loading customer orders", err);
      }
    }
  }, []);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal / Drawer states
  const [activeDrawerOrder, setActiveDrawerOrder] = useState<Order | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!routeOrderId) return;

    const targetOrder = orders.find((order) => order.id === routeOrderId);
    if (!targetOrder) return;

    setSearchTerm(routeOrderId);
    setActiveTab("All");
    setSelectedTimeframe("30days");
    setSelectedPayment("All");
    setActiveDrawerOrder(targetOrder);
  }, [routeOrderId, orders]);

  // Interactive Cancellation Modal States
  const [cancellationOrder, setCancellationOrder] = useState<Order | null>(null);
  const [cancelledBy, setCancelledBy] = useState<"User" | "Restaurant">("Restaurant");
  const [cancellationReason, setCancellationReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isRefundApproved, setIsRefundApproved] = useState(true);

  // Confirm Interactive Cancellation
  const handleConfirmCancellation = () => {
    if (!cancellationOrder) return;
    
    const finalReason = cancellationReason === "Other" ? customReason : cancellationReason;
    if (!finalReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    // Strict validation check before cancellation
    if (cancellationOrder.status === "Completed" || cancellationOrder.status === "Cancelled") {
      toast.error(`Order is already ${cancellationOrder.status} and cannot be cancelled`);
      return;
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const orderId = cancellationOrder.id;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updatedTimeline: { status: OrderStatus; time: string }[] = [
            ...order.timeline,
            { status: "Cancelled" as OrderStatus, time: timeNow }
          ];
          const updatedOrder: Order = {
            ...order,
            status: "Cancelled",
            timeline: updatedTimeline,
            cancellation: {
              cancelledBy: cancelledBy,
              reason: finalReason,
              refundInitiated: order.paymentMethod === "Card Payment" && isRefundApproved
            }
          };

          // Sync changes in side drawers if open
          if (activeDrawerOrder?.id === orderId) {
            setActiveDrawerOrder(updatedOrder);
          }
          if (activeInvoiceOrder?.id === orderId) {
            setActiveInvoiceOrder(updatedOrder);
          }

          // Persist to customer DB if it is a customer-placed order
          if (orderId.startsWith("TRC-")) {
            syncOrderStatusToCustomerDb(orderId, "Cancelled", {
              reason: finalReason,
              refundInitiated: order.paymentMethod === "Card Payment" && isRefundApproved,
            });
          }

          if (order.paymentMethod === "Card Payment" && isRefundApproved) {
            toast.success(`Refund of Rs. ${order.total.toLocaleString()} processed successfully to customer card.`);
          } else {
            toast.success(`Order ${orderId} cancelled.`);
          }
          return updatedOrder;
        }
        return order;
      })
    );

    // Reset cancellation states
    setCancellationOrder(null);
    setCancellationReason("");
    setCustomReason("");
  };

  // Trigger loading spinner simulation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Reload customer orders from localStorage
      const saved = localStorage.getItem("trinco_orders");
      if (saved) {
        try {
          const customerOrders = JSON.parse(saved);
          const mappedCustomerOrders = customerOrders.map(mapCustomerOrderToRestaurantOrder);
          setOrders((prev) => {
            const mockOnly = prev.filter((o) => !o.id.startsWith("TRC-"));
            return [...mappedCustomerOrders, ...mockOnly];
          });
        } catch {}
      }
      toast.success("Orders database refreshed successfully");
    }, 700);
  };

  const isValidTransition = (current: OrderStatus, next: OrderStatus): boolean => {
    if (current === "Completed" || current === "Cancelled") return false;
    if (next === "Pending") return false;
    if (current === "Pending" && (next === "Accepted" || next === "Cancelled")) return true;
    if (current === "Accepted" && (next === "Preparing" || next === "Cancelled")) return true;
    if (current === "Preparing" && (next === "Completed" || next === "Cancelled")) return true;
    return false;
  };

  // Manage Order Lifecycle
  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Find the order to validate its current status
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    
    if (!isValidTransition(targetOrder.status, nextStatus)) {
      toast.error(`Invalid status transition from ${targetOrder.status} to ${nextStatus}`);
      return;
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updatedTimeline = [...order.timeline, { status: nextStatus, time: timeNow }];
          const updatedOrder = { ...order, status: nextStatus, timeline: updatedTimeline };
          
          // Sync changes in side drawers if open
          if (activeDrawerOrder?.id === orderId) {
            setActiveDrawerOrder(updatedOrder);
          }
          if (activeInvoiceOrder?.id === orderId) {
            setActiveInvoiceOrder(updatedOrder);
          }

          // Persist to customer DB if it is a customer-placed order
          if (orderId.startsWith("TRC-")) {
            syncOrderStatusToCustomerDb(orderId, nextStatus);
          }

          toast.success(`Order ${orderId} updated to: ${nextStatus}`);
          return updatedOrder;
        }
        return order;
      })
    );
  };

  // Search & Filter Logic
  const filteredOrders = orders.filter((order) => {
    if (user?.restaurantId && order.restaurantId && order.restaurantId !== user.restaurantId) {
      return false;
    }

    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);

    const matchesStatus = activeTab === "All" || order.status === activeTab;

    const matchesPayment = selectedPayment === "All" || order.paymentMethod === selectedPayment;

    // Filter timeframe (simulated dates based on "Today" or "Yesterday")
    const matchesTime = selectedTimeframe === "30days" || 
      (selectedTimeframe === "7days" && (order.orderDate.includes("Today") || order.orderDate.includes("Yesterday"))) ||
      (selectedTimeframe === "today" && order.orderDate.includes("Today"));

    return matchesSearch && matchesStatus && matchesPayment && matchesTime;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, selectedTimeframe, selectedPayment]);

  // Slice orders for pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate high-fidelity stats
  const getStats = () => {
    const activeTimeframeOrders = orders.filter(o => 
      selectedTimeframe === "30days" || 
      (selectedTimeframe === "7days" && (o.orderDate.includes("Today") || o.orderDate.includes("Yesterday"))) ||
      (selectedTimeframe === "today" && o.orderDate.includes("Today"))
    );

    const totalOrders = activeTimeframeOrders.length;
    const pendingOrders = activeTimeframeOrders.filter((o) => o.status === "Pending").length;
    const preparingOrders = activeTimeframeOrders.filter((o) => o.status === "Preparing").length;
    const completedOrders = activeTimeframeOrders.filter((o) => o.status === "Completed").length;
    const cancelledOrders = activeTimeframeOrders.filter((o) => o.status === "Cancelled").length;
    const revenue = activeTimeframeOrders
      .filter((o) => o.status === "Completed")
      .reduce((sum, o) => sum + o.total, 0);

    return { totalOrders, pendingOrders, preparingOrders, completedOrders, cancelledOrders, revenue };
  };

  const stats = getStats();

  const handlePrint = (orderId: string) => {
    // Open a popup receipt print dialog simulating system window printing
    const printContent = document.getElementById(`invoice-panel-${orderId}`);
    if (printContent) {
      const originalBody = document.body.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${orderId}</title>
              <style>
                body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 12px; }
                .header { text-align: center; border-bottom: 2px solid #f5f5f5; padding-bottom: 20px; }
                .restaurant-logo { font-size: 24px; font-weight: 800; color: #813405; text-transform: uppercase; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
                .label { font-size: 11px; text-transform: uppercase; color: #999; font-weight: 700; margin-bottom: 4px; }
                .value { font-size: 13px; font-weight: 600; }
                table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                th { text-align: left; padding: 10px; border-bottom: 2px solid #eee; font-size: 11px; text-transform: uppercase; color: #666; }
                td { padding: 12px 10px; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
                .totals { margin-top: 20px; text-align: right; font-size: 13px; font-weight: 600; }
                .totals div { margin-bottom: 6px; }
                .grand-total { font-size: 18px; color: #813405; font-weight: 800; border-top: 2px dashed #eee; padding-top: 10px; margin-top: 10px; }
                .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
                @media print {
                  body { padding: 0; background: #FFF; }
                  .receipt-container { border: none; padding: 0; }
                }
              </style>
            </head>
            <body>
              <div class="receipt-container">
                ${printContent.innerHTML}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        toast.success(`Invoice print layout opened for ${orderId}`);
      }
    }
  };

  const simulatePDFDownload = (orderId: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Generating PDF receipt...",
        success: `Invoice PDF TrincoBites-${orderId}.pdf downloaded successfully`,
        error: "Generation failed"
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* 1. Header & Page Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Order Management
          </h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
            Manage and track customer orders in real time
          </p>
        </div>

        {/* Filters & Actions bar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Timeframe Selector Pill */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/80 p-1 rounded-xl flex items-center shadow-sm">
            {(["today", "7days", "30days"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 capitalize ${selectedTimeframe === t
                    ? "bg-[#71A066] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                  }`}
              >
                {t === "7days" ? "Last 7 Days" : t === "30days" ? "Last 30 Days" : "Today"}
              </button>
            ))}
          </div>

          {/* Action Tools */}
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 shadow-sm transition duration-200 cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#71A066]" : ""} />
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Orders */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 hover:border-slate-250 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShoppingBag size={14} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.totalOrders}</span>
            <div className="text-[8px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
              <TrendingUp size={8} /> +12.5%
            </div>
          </div>
        </div>

        {/* Card 2: Pending Orders */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 hover:border-slate-250 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Clock size={14} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.pendingOrders}</span>
            <div className="text-[8px] font-bold text-amber-500 mt-1 flex items-center gap-0.5">
              <TrendingDown size={8} /> Active
            </div>
          </div>
        </div>

        {/* Card 3: Preparing Orders */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 hover:border-slate-250 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Preparing</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Play size={14} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.preparingOrders}</span>
            <div className="text-[8px] font-bold text-blue-600 mt-1 flex items-center gap-0.5">
              <TrendingUp size={8} /> In Kitchen
            </div>
          </div>
        </div>

        {/* Card 4: Completed Orders */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 hover:border-slate-250 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.completedOrders}</span>
            <div className="text-[8px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
              <TrendingUp size={8} /> +18.4%
            </div>
          </div>
        </div>

        {/* Card 5: Cancelled Orders */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 hover:border-slate-250 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cancelled</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <XCircle size={14} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.cancelledOrders}</span>
            <div className="text-[8px] font-bold text-rose-500 mt-1 flex items-center gap-0.5">
              <TrendingDown size={8} /> -15.2%
            </div>
          </div>
        </div>

        {/* Card 6: Today Revenue */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 hover:border-slate-250 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[14px] font-extrabold text-slate-800 dark:text-white tracking-tight">Rs. {stats.revenue.toLocaleString()}</span>
            <div className="text-[8px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
              <TrendingUp size={8} /> +8.4%
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filtering & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar input container */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by customer, order ID or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#71A066] dark:focus:border-emerald-500 transition-all duration-200 shadow-inner"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-650 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Selector filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment:</span>
            </div>
            <select
              value={selectedPayment}
              onChange={(e: any) => setSelectedPayment(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#71A066]"
            >
              <option value="All">All Methods</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
              <option value="Card Payment">Card Payment</option>
            </select>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar border-t border-slate-100 dark:border-slate-800/60 pt-3">
          {(["All", "Pending", "Accepted", "Preparing", "Completed", "Cancelled"] as const).map((tab) => {
            const count = tab === "All" ? orders.length : orders.filter(o => o.status === tab).length;
            const tabColors: Record<string, string> = {
              All: "bg-[#71A066] text-white",
              Pending: "bg-amber-500 text-white",
              Accepted: "bg-blue-500 text-white",
              Preparing: "bg-indigo-500 text-white",
              Completed: "bg-emerald-500 text-white",
              Cancelled: "bg-rose-500 text-white"
            };

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab
                    ? tabColors[tab] || "bg-slate-800 text-white"
                    : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Orders Data Table Panel */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1260px] table-fixed">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 bg-slate-50/40 dark:bg-slate-800/10">
                <th className="py-4 px-5 w-[110px]">Order ID</th>
                <th className="py-4 px-4 w-[200px]">Customer</th>
                <th className="py-4 px-4 w-[310px]">Items</th>
                <th className="py-4 px-4 w-[140px]">Payment</th>
                <th className="py-4 px-4 text-right w-[110px]">Amount</th>
                <th className="py-4 px-4 w-[130px]">Date</th>
                <th className="py-4 px-4 w-[120px]">Status</th>
                <th className="py-4 px-5 text-right w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-600 dark:text-slate-350">
              <AnimatePresence initial={false}>
                {filteredOrders.length > 0 ? (
                  paginatedOrders.map((order) => {
                    const statusConfig = {
                      Pending: "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20",
                      Accepted: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20",
                      Preparing: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20",
                      Completed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20",
                      Cancelled: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/20"
                    };

                    const customerInitials = order.customerName
                      .split(" ")
                      .map((n) => n.charAt(0))
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    const avatarBg: Record<string, string> = {
                      Pending: "bg-amber-500/10 text-amber-600",
                      Accepted: "bg-blue-500/10 text-blue-600",
                      Preparing: "bg-indigo-500/10 text-indigo-600",
                      Completed: "bg-emerald-500/10 text-emerald-600",
                      Cancelled: "bg-rose-500/10 text-rose-600"
                    };

                    return (
                      <motion.tr
                        key={order.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/15 transition duration-150"
                      >
                        <td className="py-4 px-5 font-bold text-[#71A066] dark:text-emerald-400">{order.id}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0 ${avatarBg[order.status] || "bg-slate-100 text-slate-600"}`}>
                              {customerInitials}
                            </div>
                            <div className="flex flex-col min-w-0 truncate">
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={order.customerName}>{order.customerName}</span>
                              <span className="text-[9px] text-slate-400 font-medium truncate">{order.customerPhone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1 items-start max-w-full">
                            {order.items.map((it) => (
                              <div key={it.id} className="flex flex-col gap-0.5 items-start">
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/30"
                                  title={`${it.quantity}x ${it.name}`}
                                >
                                  <span className="text-[#71A066] dark:text-emerald-450 font-black">{it.quantity}x</span>
                                  <span className="truncate max-w-[180px]">{it.name}</span>
                                </span>
                                {it.instructions && (
                                  <span className="text-[9px] font-semibold text-[#813405] dark:text-[#F8DDA4] pl-2 flex items-center gap-1">
                                    ↳ 📝 {it.instructions}
                                  </span>
                                )}
                              </div>
                            ))}
                            {/* Special instructions indicator */}
                            {order.notes && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/20 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 max-w-[240px] truncate"
                                title={order.notes}
                              >
                                📝 {order.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/30 dark:border-slate-800 whitespace-nowrap">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          Rs. {order.total.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-slate-400 dark:text-slate-500 font-normal whitespace-nowrap">
                          {order.orderDate}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap ${statusConfig[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details details drawer trigger */}
                            <button
                              onClick={() => setActiveDrawerOrder(order)}
                              className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white shadow-sm transition duration-150 cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={12} />
                            </button>

                            {/* Lifecycle accept order */}
                            {order.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => updateOrderStatus(order.id, "Accepted")}
                                  className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition duration-150 cursor-pointer"
                                  title="Accept Order"
                                >
                                  <Check size={12} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={() => {
                                    setCancellationOrder(order);
                                    setCancelledBy("Restaurant");
                                    setCancellationReason("");
                                    setCustomReason("");
                                    setIsRefundApproved(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 shadow-sm transition duration-150 cursor-pointer"
                                  title="Reject Order"
                                >
                                  <X size={12} strokeWidth={2.5} />
                                </button>
                              </>
                            )}

                            {/* Transition accept to prepare */}
                            {order.status === "Accepted" && (
                              <button
                                onClick={() => updateOrderStatus(order.id, "Preparing")}
                                className="p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm transition duration-150 cursor-pointer flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1"
                                title="Start Preparing"
                              >
                                <Play size={8} strokeWidth={3} /> Kitchen
                              </button>
                            )}

                            {/* Transition prepare to complete */}
                            {order.status === "Preparing" && (
                              <button
                                onClick={() => updateOrderStatus(order.id, "Completed")}
                                className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition duration-150 cursor-pointer flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1"
                                title="Complete Order"
                              >
                                <Check size={8} strokeWidth={3} /> Done
                              </button>
                            )}

                            {/* Print receipt button trigger */}
                            {(order.status === "Completed" || order.status === "Accepted" || order.status === "Preparing") && (
                              <button
                                onClick={() => setActiveInvoiceOrder(order)}
                                className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white shadow-sm transition duration-150 cursor-pointer"
                                title="Print Invoice"
                              >
                                <Printer size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/30 text-slate-400">
                          <ShieldAlert size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No Orders Found</p>
                        <p className="text-xs text-slate-400">Try modifying your filters or searching another keyword</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-850/10 flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)}</span> to{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">{filteredOrders.length}</span> orders
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-150 dark:border-slate-800/60 text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 disabled:pointer-events-none transition duration-150 shadow-sm cursor-pointer"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    currentPage === pg
                      ? "bg-[#71A066] text-white shadow-sm"
                      : "border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 disabled:pointer-events-none transition duration-150 shadow-sm cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Slide-Over Drawer Details Panel */}
      <AnimatePresence>
        {activeDrawerOrder && (
          <>
            {/* Dark blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawerOrder(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Slide drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-150 dark:border-slate-800 shadow-2xl z-50 flex flex-col h-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Details</span>
                  <span className="text-md font-bold text-slate-800 dark:text-slate-100 mt-0.5">{activeDrawerOrder.id}</span>
                </div>
                <button
                  onClick={() => setActiveDrawerOrder(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-150"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                
                {/* Cancellation Alert Banner */}
                {activeDrawerOrder.status === "Cancelled" && (
                  <div className="bg-rose-500/5 dark:bg-rose-500/10 p-4 border border-rose-500/20 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                      <XCircle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Order Cancelled</span>
                    </div>
                    
                    <div className="space-y-1.5 text-slate-700 dark:text-slate-350">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Cancelled By:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 bg-rose-500/10 dark:bg-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                          {activeDrawerOrder.cancellation?.cancelledBy || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-slate-400 font-semibold shrink-0">Reason:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-right">
                          {activeDrawerOrder.cancellation?.reason || "No reason provided"}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-rose-500/10 pt-2 mt-1">
                        <span className="text-slate-400 font-semibold">Refund Status:</span>
                        {activeDrawerOrder.paymentMethod === "Card Payment" ? (
                          <span className={`font-bold text-xs ${activeDrawerOrder.cancellation?.refundInitiated ? "text-emerald-600 dark:text-emerald-450" : "text-rose-600"}`}>
                            {activeDrawerOrder.cancellation?.refundInitiated ? "Refund Processed (Rs. " + activeDrawerOrder.total.toLocaleString() + ")" : "Refund Declined / Pending"}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs italic">
                            N/A (Cash on Delivery)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. Customer Information Card */}
                <div className="bg-slate-50/50 dark:bg-slate-800/10 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3.5">
                  <span className="text-[10px] font-bold text-[#71A066] dark:text-emerald-450 uppercase tracking-wider">Customer Details</span>
                  
                  <div className="space-y-3 text-xs text-slate-700 dark:text-slate-350">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-100">{activeDrawerOrder.customerName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-slate-400" />
                      <span>{activeDrawerOrder.customerPhone}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                      <span>{activeDrawerOrder.deliveryAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Special Instructions — always shown prominently */}
                <div className="rounded-xl border-2 border-amber-400/40 bg-amber-50/70 dark:bg-amber-950/20 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={13} className="text-amber-500 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Special Instructions
                    </span>
                  </div>
                  {activeDrawerOrder.notes ? (
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-relaxed pl-5">
                      {activeDrawerOrder.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600/50 dark:text-amber-500/50 italic pl-5">
                      No special instructions provided.
                    </p>
                  )}
                </div>

                {/* 2. Order Items */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ordered Items</span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-850">
                    {activeDrawerOrder.items.map((item) => {
                      const prices = getCartItemPrices(item);
                      return (
                        <div key={item.id} className="py-3 flex flex-col gap-1.5 text-xs">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                                {item.name}
                                {item.selectedSize && (
                                  <span className="text-[9px] font-black text-orange-650 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                    {item.selectedSize}
                                  </span>
                                )}
                                {item.appliedOffer && (
                                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                                    🎁 {item.appliedOffer.discountBadge}
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="font-black text-slate-700 dark:text-slate-350">
                              {item.quantity}x {formatPrice(prices.unitTotal)}
                            </span>
                          </div>
                          
                          {item.appliedOffer?.id === "O-205" && (
                             <div className="mt-1.5 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/30 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-450 font-bold">
                               <span className="flex items-center gap-1">
                                 🎁 {item.quantity}x {item.name} ({item.selectedSize || "Regular"}) [FREE BOGO]
                               </span>
                               <span className="font-black">Rs 0</span>
                             </div>
                           )}

                          <div className="text-[11px] text-slate-500 pl-2 space-y-0.5 border-l border-orange-200">
                            <div className="flex justify-between">
                              <span>Base Price ({item.quantity}x {formatPrice(prices.basePrice)})</span>
                              <span>{formatPrice(prices.totalBasePrice)}</span>
                            </div>
                            
                            {item.selectedExtras && item.selectedExtras.length > 0 && (
                              <>
                                {item.selectedExtras.map((extra, idx) => (
                                  <div key={idx} className="flex justify-between text-slate-400 pl-1.5">
                                    <span>+ {extra.name} ({item.quantity}x {formatPrice(extra.price)})</span>
                                    <span>{formatPrice(extra.price * item.quantity)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between font-bold text-slate-500 pl-1.5 pt-0.5">
                                  <span>Add-ons Total</span>
                                  <span>{formatPrice(prices.totalExtrasPrice)}</span>
                                </div>
                              </>
                            )}
                            
                            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-850 mt-1">
                              <span>Item Total</span>
                              <span>{formatPrice(prices.itemTotal)}</span>
                            </div>

                            {item.instructions && (
                              <div className="mt-2.5 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/40 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-start gap-1.5">
                                <span className="text-xs">📝</span>
                                <div className="flex-1">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-amber-600/70">Item Instructions</p>
                                  <p className="mt-0.5 leading-relaxed">{item.instructions}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Subtotal Breakdown */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(activeDrawerOrder.subtotal)}</span>
                  </div>
                  {activeDrawerOrder.orderType === "Delivery" && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Delivery Fee</span>
                      <span>{formatPrice(activeDrawerOrder.deliveryFee || 250)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>VAT (18%)</span>
                    <span>{formatPrice(activeDrawerOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800 dark:text-white text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Grand Total</span>
                    <span className="text-[#71A066] dark:text-emerald-400">{formatPrice(activeDrawerOrder.total)}</span>
                  </div>
                </div>

                {/* 4. Payment & Date */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Payment Method</span>
                    <div className="flex items-center gap-1 font-bold text-slate-750 dark:text-slate-200">
                      <CreditCard size={12} className="text-slate-400" />
                      <span>{activeDrawerOrder.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Order Date</span>
                    <div className="flex items-center gap-1 text-slate-650 dark:text-slate-350">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{activeDrawerOrder.orderDate}</span>
                    </div>
                  </div>
                </div>


                <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Timeline</span>
                  
                  <div className="flex flex-col gap-4 pl-1 border-l border-slate-100 dark:border-slate-800 ml-2 py-1">
                    {activeDrawerOrder.timeline.map((node, index) => {
                      const colors: Record<OrderStatus, string> = {
                        Pending: "bg-amber-500",
                        Accepted: "bg-blue-500",
                        Preparing: "bg-indigo-500",
                        Completed: "bg-emerald-500",
                        Cancelled: "bg-rose-500"
                      };

                      return (
                        <div key={index} className="flex gap-4 relative">
                          <div className={`absolute -left-[9.5px] top-1 w-2.5 h-2.5 rounded-full ${colors[node.status]} border-2 border-white dark:border-slate-900`} />
                          <div className="flex flex-col text-xs pl-2">
                            <span className="font-bold text-slate-850 dark:text-slate-200">{node.status}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5">{node.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col gap-3">
                {activeDrawerOrder.status === "Pending" && (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => updateOrderStatus(activeDrawerOrder.id, "Accepted")}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-sm cursor-pointer"
                    >
                      Accept Order
                    </button>
                    <button
                      onClick={() => {
                        setCancellationOrder(activeDrawerOrder);
                        setCancelledBy("Restaurant");
                        setCancellationReason("");
                        setCustomReason("");
                        setIsRefundApproved(true);
                      }}
                      className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-sm cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {activeDrawerOrder.status === "Accepted" && (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => updateOrderStatus(activeDrawerOrder.id, "Preparing")}
                      className="flex-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-sm cursor-pointer"
                    >
                      Start Preparing
                    </button>
                    <button
                      onClick={() => {
                        setCancellationOrder(activeDrawerOrder);
                        setCancelledBy("Restaurant");
                        setCancellationReason("");
                        setCustomReason("");
                        setIsRefundApproved(true);
                      }}
                      className="flex-1 py-2.5 border border-rose-500 text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {activeDrawerOrder.status === "Preparing" && (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => updateOrderStatus(activeDrawerOrder.id, "Completed")}
                      className="flex-2 py-2.5 bg-[#71A066] hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-sm cursor-pointer"
                    >
                      Complete Order
                    </button>
                    <button
                      onClick={() => {
                        setCancellationOrder(activeDrawerOrder);
                        setCancelledBy("Restaurant");
                        setCancellationReason("");
                        setCustomReason("");
                        setIsRefundApproved(true);
                      }}
                      className="flex-1 py-2.5 border border-rose-500 text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {(activeDrawerOrder.status === "Completed" || activeDrawerOrder.status === "Accepted" || activeDrawerOrder.status === "Preparing") && (
                  <button
                    onClick={() => {
                      setActiveInvoiceOrder(activeDrawerOrder);
                      setActiveDrawerOrder(null);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 border border-slate-200/50 dark:border-slate-700 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer size={12} /> Generate Invoice
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 6. Invoice Print / PDF Dialog Modal */}
      <AnimatePresence>
        {activeInvoiceOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveInvoiceOrder(null)}
              className="fixed inset-0 bg-black z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-2xl z-50 rounded-2xl flex flex-col overflow-hidden"
            >
              {/* Modal header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10">
                <div className="flex items-center gap-1.5">
                  <Printer size={16} className="text-[#71A066]" />
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Receipt Invoice Viewer</span>
                </div>
                <button
                  onClick={() => setActiveInvoiceOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Printable receipt frame */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div id={`invoice-panel-${activeInvoiceOrder.id}`} className="space-y-6">
                  {/* Restaurant branding */}
                  <div className="text-center border-bottom pb-4 border-slate-100 dark:border-slate-800">
                    <span className="font-extrabold text-xl uppercase tracking-widest text-[#71A066] dark:text-emerald-450">Trinco Bites</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Trincomalee Culinary Hub</p>
                  </div>

                  {/* Order info details */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Order Reference</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{activeInvoiceOrder.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{activeInvoiceOrder.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Customer Details</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activeInvoiceOrder.customerName}</span>
                      <p className="text-slate-500 font-medium leading-relaxed mt-0.5">{activeInvoiceOrder.deliveryAddress}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Order Time</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activeInvoiceOrder.orderDate}</span>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2">
                          <th className="pb-2">Menu Item</th>
                          <th className="pb-2 text-center">Qty</th>
                          <th className="pb-2 text-right">Price</th>
                          <th className="pb-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium text-slate-650 dark:text-slate-350">
                        {activeInvoiceOrder.items.map((item) => {
                          const prices = getCartItemPrices(item);
                          return (
                            <tr key={item.id} className="border-b border-slate-50 dark:border-slate-850">
                              <td className="py-3 pr-2">
                                <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                                  {item.name}
                                  {item.selectedSize && (
                                    <span className="text-[9px] font-black text-orange-650 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                      {item.selectedSize}
                                    </span>
                                  )}
                                  {item.appliedOffer && (
                                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                                      🎁 {item.appliedOffer.discountBadge}
                                    </span>
                                  )}
                                </div>
                                {item.appliedOffer?.id === "O-205" && (
                                   <div className="mt-2 p-1.5 rounded bg-emerald-50/55 dark:bg-emerald-950/10 text-[10px] text-emerald-700 dark:text-emerald-450 font-bold flex justify-between">
                                     <span>🎁 {item.quantity}x {item.name} (BOGO Free Item)</span>
                                     <span>Rs 0</span>
                                   </div>
                                 )}
                                {item.selectedExtras && item.selectedExtras.length > 0 && (
                                  <div className="mt-1 space-y-0.5 pl-2 border-l border-orange-200 text-[10px] text-slate-400">
                                    {item.selectedExtras.map((extra, idx) => (
                                      <div key={idx} className="flex justify-between">
                                        <span>+ {extra.name} ({formatPrice(extra.price)})</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {item.instructions && (
                                  <div className="mt-1.5 p-1 rounded bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/30 text-[10px] text-amber-700 dark:text-amber-450 font-bold">
                                    <span>📝 Item Instructions: {item.instructions}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 text-center align-top">{item.quantity}</td>
                              <td className="py-3 text-right align-top">
                                <div className="text-[11px] text-slate-500">
                                  Base: {formatPrice(prices.basePrice)}
                                </div>
                                {prices.extrasTotal > 0 && (
                                  <div className="text-[10px] text-slate-400">
                                    Extras: +{formatPrice(prices.extrasTotal)}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 text-right align-top font-bold">
                                <div>{formatPrice(prices.itemTotal)}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals box */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col items-end gap-2 text-xs">
                    <div className="flex justify-between w-52 text-slate-500 dark:text-slate-400">
                      <span>Subtotal:</span>
                      <span>{formatPrice(activeInvoiceOrder.subtotal)}</span>
                    </div>
                    {activeInvoiceOrder.orderType === "Delivery" && (
                      <div className="flex justify-between w-52 text-slate-500 dark:text-slate-400">
                        <span>🛵 Delivery Fee:</span>
                        <span>{formatPrice(activeInvoiceOrder.deliveryFee)}</span>
                      </div>
                    )}
                    {activeInvoiceOrder.orderType === "Self Pickup" && (
                      <div className="flex justify-between w-52 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        <span>🏃 Self Pickup</span>
                        <span>No delivery fee</span>
                      </div>
                    )}
                    <div className="flex justify-between w-52 text-slate-500 dark:text-slate-400">
                      <span>🇱🇰 VAT (18%):</span>
                      <span>{formatPrice(activeInvoiceOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between w-52 font-extrabold text-slate-800 dark:text-white border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 text-sm">
                      <span>Grand Total:</span>
                      <span className="text-[#71A066] dark:text-emerald-400">{formatPrice(activeInvoiceOrder.total)}</span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <p>Thank you for dining with Trinco Bites!</p>
                    <p className="mt-0.5">Please present this receipt upon delivery confirmation.</p>
                  </div>
                </div>
              </div>

              {/* Action operations footer */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => handlePrint(activeInvoiceOrder.id)}
                  className="flex-1 py-2.5 bg-[#71A066] hover:bg-[#71A066]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer size={13} /> Print Invoice
                </button>
                <button
                  onClick={() => simulatePDFDownload(activeInvoiceOrder.id)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 flex items-center justify-center gap-1.5 border border-slate-200/50 dark:border-slate-700 cursor-pointer"
                >
                  <Download size={13} /> Download PDF
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 7. Interactive Cancellation Dialog Modal */}
      <AnimatePresence>
        {cancellationOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancellationOrder(null)}
              className="fixed inset-0 bg-black z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-2xl z-50 rounded-2xl flex flex-col overflow-hidden"
            >
              {/* Modal header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/10">
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <XCircle size={16} />
                  <span className="font-bold text-sm uppercase tracking-wider">Cancel Order: {cancellationOrder.id}</span>
                </div>
                <button
                  onClick={() => setCancellationOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 text-xs">
                {/* Predefined Reasons */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cancellation Reason</label>
                  <div className="flex flex-col gap-2">
                    {[
                      "Items Out of Stock / Unavailability",
                      "Restaurant Closing / Busy Kitchen",
                      "Delivery Address Out of Coverage Area",
                      "Other"
                    ].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => {
                          setCancellationReason(reason);
                          if (reason !== "Other") setCustomReason("");
                        }}
                        className={`w-full text-left py-2.5 px-3.5 rounded-xl font-semibold border transition duration-150 ${
                          cancellationReason === reason
                            ? "bg-slate-100 dark:bg-slate-800/80 border-slate-350 dark:border-slate-700 text-slate-800 dark:text-white"
                            : "border-slate-150 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom reason text input */}
                {cancellationReason === "Other" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custom Reason</label>
                    <textarea
                      placeholder="Please explain the cancellation reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500/50 dark:focus:ring-rose-500/30 text-xs font-semibold resize-none placeholder-slate-400"
                    />
                  </div>
                )}

                {/* 3. Refund Information Section */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment & Refund Details</span>
                  
                  <div className="bg-slate-50 dark:bg-slate-850/30 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Payment Method:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cancellationOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Order Total:</span>
                      <span className="font-extrabold text-slate-800 dark:text-white">Rs. {cancellationOrder.total.toLocaleString()}</span>
                    </div>

                    {cancellationOrder.paymentMethod === "Card Payment" ? (
                      <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-2.5 mt-1.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-bold text-emerald-600 dark:text-emerald-450">Process Card Refund</span>
                            <span className="text-[10px] text-slate-400 leading-tight">Rs. {cancellationOrder.total.toLocaleString()} will be auto-credited.</span>
                          </div>
                          
                          {/* Toggle switch for refund approval */}
                          <button
                            onClick={() => setIsRefundApproved(!isRefundApproved)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 cursor-pointer ${
                              isRefundApproved ? "bg-emerald-500" : "bg-slate-350 dark:bg-slate-700"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-250 transform ${
                                isRefundApproved ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-2.5 mt-1.5">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px] leading-tight">
                          <ShieldAlert size={12} />
                          <span>Refund not required for Cash on Delivery.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => setCancellationOrder(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  onClick={handleConfirmCancellation}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-rose-500/10"
                >
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default OrderManagement;
