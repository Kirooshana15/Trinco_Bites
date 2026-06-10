import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { C } from "@/utils/theme";
import { motion } from "framer-motion";
import {
  Database,
  User,
  History,
  CreditCard,
  Settings,
  Users,
  Cookie,
  ShieldCheck,
  Trash2,
  Calendar,
  RefreshCw,
  Mail,
  ChevronRight,
  Eye,
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("info-we-collect");

  // Dynamic SEO Setup
  useEffect(() => {
    document.title = "Privacy Policy | Trinco Bites";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Read the Privacy Policy for Trinco Bites. Understand how we collect, process, share, secure, and retain your personal data, order history, and payment details."
    );

    // Scroll observer to highlight sidebar on scroll
    const observers = sections.map((sec) => {
      const el = document.getElementById(sec.id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(sec.id);
          }
        },
        { rootMargin: "-20% 0px -60% 0px" }
      );
      observer.observe(el);
      return { observer, el };
    });

    return () => {
      observers.forEach((obs) => {
        if (obs) obs.observer.unobserve(obs.el);
      });
    };
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // offset for the sticky navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const sections: Section[] = [
    {
      id: "info-we-collect",
      title: "1. Information We Collect",
      icon: Database,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            At Trinco Bites, your privacy is a top priority. We collect information to provide, maintain, and 
            improve our food delivery services.
          </p>
          <p className="leading-relaxed">
            The types of information we collect depend on how you interact with our platform (such as browsing restaurants, 
            creating a user account, or placing orders). This includes information you directly provide to us, 
            information we collect automatically, and information from third parties.
          </p>
        </div>
      ),
    },
    {
      id: "personal-data",
      title: "2. Personal Data",
      icon: User,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            When you create an account, register on our platform, or place an order, we collect specific personal 
            information required to verify your identity and deliver your orders. This personal data includes:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li><strong>Full Name:</strong> To identify you and personalize your user experience.</li>
            <li><strong>Email Address:</strong> To send order confirmations, digital receipts, promotions, and account alerts.</li>
            <li><strong>Phone Number:</strong> Crucial for account verification and enabling delivery riders or restaurant partners to contact you.</li>
            <li><strong>Delivery Addresses:</strong> Saved locations and coordinates where your food orders are dispatched.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "order-history",
      title: "3. Order History",
      icon: History,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            We collect and archive information related to the transactions you perform on our platform. 
            This order history includes:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li>Details of items, foods, and restaurants from which you ordered.</li>
            <li>Dates and timestamps of order placement, preparation, and delivery.</li>
            <li>Receipt amounts, promo codes applied, delivery tips, and payment methods selected.</li>
            <li>Special cooking instruction notes or delivery coordinate notes.</li>
          </ul>
          <p className="leading-relaxed">
            We use this data to allow you to easily reorder your favorite meals, view spending reports, 
            and help resolve customer support inquiries.
          </p>
        </div>
      ),
    },
    {
      id: "payment-information",
      title: "4. Payment Information",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            To ensure secure transactions, Trinco Bites collects payment details during checkout. 
            However, we do not store raw credit/debit card numbers or security codes on our servers.
          </p>
          <p className="leading-relaxed">
            All card transactions are securely collected and processed by PCI-DSS compliant third-party 
            payment gateway providers. We only store transaction tokens, card brand details (e.g., Visa, Mastercard), 
            and expiry dates to make subsequent checkouts faster and more convenient for you.
          </p>
        </div>
      ),
    },
    {
      id: "how-we-use-data",
      title: "5. How We Use User Data",
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            We process your personal information for a variety of business purposes, including:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li><strong>Order Fulfillment:</strong> Processing your order, preparing it at the restaurant, and coordinating delivery.</li>
            <li><strong>Communication:</strong> Contacting you about order status updates, security notifications, or customer service tickets.</li>
            <li><strong>Platform Optimization:</strong> Analyzing user behavior patterns to fix software bugs and improve app speed.</li>
            <li><strong>Personalization:</strong> Recommending restaurants and cuisines based on your historical preferences and search terms.</li>
            <li><strong>Safety & Integrity:</strong> Preventing fraudulent transactions, account takeovers, and code exploits.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "data-sharing",
      title: "6. Data Sharing with Partners",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            To deliver your food orders efficiently, we must share limited elements of your personal information 
            with our partner network:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li><strong>Partner Restaurants:</strong> We share your first name, order details, and any custom food preparation instructions. We do NOT share your full address or phone number with restaurants.</li>
            <li><strong>Delivery Partners (Riders):</strong> We share your name, delivery address coordinates, contact phone number, and delivery instructions to allow them to transport the food directly to you.</li>
          </ul>
          <p className="leading-relaxed">
            Our partners are legally bound by contracts to use this shared data solely for order fulfillment 
            purposes and are strictly prohibited from storing, sharing, or using your data for direct marketing.
          </p>
        </div>
      ),
    },
    {
      id: "cookies-and-tracking",
      title: "7. Cookies & Tracking Technologies",
      icon: Cookie,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Trinco Bites uses cookies, local storage, and similar web tracking technologies to improve session handling and 
            remember your settings.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li><strong>Essential Cookies:</strong> Required to keep you logged into your account and maintain items in your checkout cart.</li>
            <li><strong>Preference Cookies:</strong> Used to remember your selected delivery location and dietary choices.</li>
            <li><strong>Analytical Cookies:</strong> Help us measure visitor traffic, page load speed, and popular restaurants.</li>
          </ul>
          <p className="leading-relaxed">
            You can modify your browser settings to reject cookies or notify you when cookies are set. However, 
            disabling essential cookies will impact your ability to log in and order food.
          </p>
        </div>
      ),
    },
    {
      id: "data-security",
      title: "8. Data Security",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            We have implemented standard technical, administrative, and physical security protocols designed to protect 
            your personal data against unauthorized access, loss, alteration, or disclosure.
          </p>
          <p className="leading-relaxed">
            All data transmitted between your browser and our servers is encrypted using Secure Sockets Layer (SSL/TLS) 
            technology. Sensitive customer credentials (such as account passwords) are securely hashed before storage. 
            While we strive for top-tier protection, no online transmission or server infrastructure can be guaranteed 
            100% secure.
          </p>
        </div>
      ),
    },
    {
      id: "user-rights",
      title: "9. User Rights & Account Deletion",
      icon: Trash2,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            You maintain complete control over your personal data. Depending on your location, you have the following rights:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li><strong>Access & Modify:</strong> You can view and edit your profile details directly from the user settings area.</li>
            <li><strong>Opt-Out:</strong> You can unsubscribe from marketing emails at any time using the opt-out links provided.</li>
            <li><strong>Account Deletion:</strong> You have the right to request the permanent deletion of your account and personal data.</li>
          </ul>
          <p className="leading-relaxed">
            To delete your account, please send an account deletion request to <code>privacy@trincobites.lk</code> from your 
            registered email address. Once verified, we will erase all non-regulatory personal details from our active databases.
          </p>
        </div>
      ),
    },
    {
      id: "data-retention",
      title: "10. Data Retention Policy",
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            We retain your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy.
          </p>
          <p className="leading-relaxed">
            Active user accounts are maintained continuously unless deletion is requested. Transactions, invoices, 
            and payment history are stored for a minimum period of 5 years to comply with financial, audit, tax, and local 
            legal requirements. Anonymous analytical traffic logs are purged or aggregated within 12 months.
          </p>
        </div>
      ),
    },
    {
      id: "changes-to-policy",
      title: "11. Changes to Privacy Policy",
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            We may periodically update this Privacy Policy to reflect modifications to our services, security practices, 
            or statutory compliance requirements.
          </p>
          <p className="leading-relaxed">
            When changes are published, we will adjust the "Last Updated" date at the top of this document. We encourage you 
            to review this policy occasionally to stay informed about how we safeguard your personal data.
          </p>
        </div>
      ),
    },
    {
      id: "contact-privacy",
      title: "12. Contact Information",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please 
            contact our Data Protection Officer:
          </p>
          <div className="p-4 rounded-2xl space-y-2 text-sm" style={{ background: "rgba(129,52,5,0.03)", border: `1px solid ${C.line}` }}>
            <p><strong>Email:</strong> privacy@trincobites.lk</p>
            <p><strong>Hotline:</strong> +94 26 222 1234</p>
            <p><strong>Address:</strong> Trinco Bites HQ, Legal & Compliance Dept, Inner Harbour Road, Trincomalee, Sri Lanka</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: C.bg,
        fontFamily: "var(--font-body)",
        color: C.brown,
      }}
    >
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-soft border-b border-[rgba(129,52,5,0.08)] py-12 md:py-16">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#813405 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="mx-auto max-w-6xl px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4"
            style={{
              background: "rgba(212,81,19,0.08)",
              border: "1px solid rgba(212,81,19,0.18)",
            }}
          >
            <Eye size={14} className="text-[#D45113]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#D45113]">Trinco Bites Privacy</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-black mb-3 leading-tight"
            style={{
              background: `linear-gradient(135deg, ${C.brown} 0%, ${C.burnt} 60%, ${C.orange} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Privacy Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs font-bold tracking-wide uppercase opacity-70"
            style={{ color: C.burnt }}
          >
            Last Updated: June 4, 2026
          </motion.p>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="flex-1 mx-auto max-w-6xl w-full px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Table of Contents - Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4">
            <div
              className="rounded-3xl p-6 border border-[#EADBC8]/60 shadow-sm"
              style={{
                background: "rgba(255,252,245,0.7)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h3 className="text-sm font-black uppercase tracking-wider mb-4 pb-2 border-b border-[rgba(129,52,5,0.08)]">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {sections.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: isActive ? "rgba(212,81,19,0.08)" : "transparent",
                        color: isActive ? C.burnt : "rgba(129,52,5,0.7)",
                      }}
                    >
                      <span className="truncate">{sec.title.substring(3)}</span>
                      <ChevronRight
                        size={12}
                        className={`transition-transform duration-200 ${
                          isActive ? "translate-x-0.5 text-[#D45113]" : "opacity-0"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Cards Column */}
          <main className="col-span-12 lg:col-span-8 space-y-6">
            {sections.map((sec, i) => {
              const Icon = sec.icon;
              return (
                <motion.section
                  id={sec.id}
                  key={sec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="rounded-3xl p-6 md:p-8 border border-orange-100/60 transition-all duration-300 shadow-card hover:shadow-md"
                  style={{
                    background: "rgba(255, 252, 245, 0.95)",
                  }}
                >
                  <div className="flex items-center gap-3.5 mb-5 pb-3 border-b border-[rgba(129,52,5,0.05)]">
                    <div
                      className="h-10 w-10 rounded-xl grid place-items-center flex-shrink-0"
                      style={{ background: "rgba(212,81,19,0.1)" }}
                    >
                      <Icon size={18} style={{ color: C.burnt }} />
                    </div>
                    <h2 className="text-lg font-black tracking-tight">{sec.title}</h2>
                  </div>

                  <div className="text-sm font-medium text-[rgba(129,52,5,0.85)] leading-relaxed">
                    {sec.content}
                  </div>
                </motion.section>
              );
            })}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
