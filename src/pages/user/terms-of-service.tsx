import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { C } from "@/utils/theme";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle,
  User,
  ShoppingBag,
  Truck,
  CornerUpLeft,
  AlertOctagon,
  ShieldAlert,
  Edit,
  Mail,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export function TermsOfService() {
  const [activeSection, setActiveSection] = useState("introduction");

  // Dynamic SEO Setup
  useEffect(() => {
    document.title = "Terms of Service | Trinco Bites";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Read the Terms of Service for Trinco Bites, Trincomalee's premier food delivery platform. Learn about account responsibilities, ordering, delivery, and refund policies."
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
        { rootMargin: "-20% 0px -60% 0px" } // trigger when section is in the middle of screen
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
      id: "introduction",
      title: "1. Introduction",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Welcome to <strong>Trinco Bites</strong>, Trincomalee's premier food delivery platform. 
            We are dedicated to connecting you with the finest local flavors, restaurants, and eateries, 
            providing hot, fresh meals delivered straight to your doorstep.
          </p>
          <p className="leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of the Trinco Bites website, 
            mobile applications, and online food ordering services (collectively, the "Services"). 
            The Services are owned and operated by Trinco Bites.
          </p>
        </div>
      ),
    },
    {
      id: "acceptance-of-terms",
      title: "2. Acceptance of Terms",
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            By creating an account, accessing, or using our Services in any manner, you confirm that 
            you have read, understood, and agree to be bound by these Terms, as well as our 
            Privacy Policy.
          </p>
          <p className="leading-relaxed">
            If you do not agree to these Terms, you must immediately cease using the Services. 
            These Terms form a legally binding contract between you and Trinco Bites regarding your 
            use of our platform.
          </p>
        </div>
      ),
    },
    {
      id: "user-accounts",
      title: "3. User Accounts & Responsibilities",
      icon: User,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            To place orders, you must register for a Trinco Bites account. During registration, you agree to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li>Provide accurate, current, and complete personal and contact information.</li>
            <li>Maintain and promptly update your account profile details.</li>
            <li>Keep your password secure and confidential at all times.</li>
            <li>Accept full responsibility for all activities, orders, and payments made under your account credentials.</li>
          </ul>
          <p className="leading-relaxed">
            You must be at least 18 years old to register an account or place orders independently. Users under 18 
            must use our Services only under the guidance and supervision of a parent or legal guardian.
          </p>
        </div>
      ),
    },
    {
      id: "ordering-and-payment",
      title: "4. Ordering & Payment Terms",
      icon: ShoppingBag,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            <strong>Order Placement:</strong> When you place an order, it constitutes an offer to purchase the selected 
            items from the respective partner restaurant. All orders are subject to availability and acceptance 
            by the restaurant.
          </p>
          <p className="leading-relaxed">
            <strong>Pricing:</strong> All food prices listed are determined by our partner restaurants. Prices may change 
            without notice but will not affect already accepted orders. Taxes and delivery fees are calculated at checkout 
            before payment confirmation.
          </p>
          <p className="leading-relaxed">
            <strong>Payment:</strong> Payment must be made online via credit/debit card, mobile wallet, or selected online 
            gateways at checkout. All payments are securely processed by authorized third-party payment processors. You 
            warrant that you have the authorization to use the payment details provided.
          </p>
        </div>
      ),
    },
    {
      id: "delivery-policy",
      title: "5. Delivery Policy",
      icon: Truck,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Trinco Bites coordinates food delivery from partner restaurants to your designated location within our 
            operational delivery zones in Trincomalee.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li><strong>Delivery Times:</strong> Estimated delivery times are provided at checkout. These are estimates 
            only and actual times may vary due to restaurant preparation times, weather, traffic, or road conditions.</li>
            <li><strong>Customer Presence:</strong> You must ensure someone is present at the designated delivery address 
            to receive the food. Our delivery partner will attempt to contact you using the phone number provided.</li>
            <li><strong>Unreachable Delivery:</strong> If our delivery rider cannot contact you or is denied access 
            to the delivery location, and is forced to wait more than 10 minutes, the order will be cancelled. In such cases, 
            you will still be charged the full amount of the order, and no refund will be issued.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "cancellation-and-refund",
      title: "6. Cancellation & Refund Policy",
      icon: CornerUpLeft,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            <strong>Cancellations:</strong> You may request to cancel an order only within <strong>2 minutes</strong> of 
            placing it, provided the partner restaurant has not yet accepted or started preparing it. Once restaurant 
            preparation begins, cancellations are strictly not permitted.
          </p>
          <p className="leading-relaxed">
            <strong>Refunds:</strong> Refunds will be issued only under the following limited circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li>The restaurant rejects your order or cannot fulfill it due to item unavailability.</li>
            <li>The delivery was completely missed due to our own logistics failure.</li>
            <li>The items delivered are severely incorrect or damaged, subject to verification (photographic proof must 
            be submitted to support within 15 minutes of receipt).</li>
          </ul>
          <p className="leading-relaxed">
            Refunds will be credited to the original payment source and may take 3 to 7 business days to reflect, depending 
            on your financial institution.
          </p>
        </div>
      ),
    },
    {
      id: "prohibited-activities",
      title: "7. Prohibited Activities",
      icon: AlertOctagon,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            When using our platform, you agree not to engage in any of the following restricted behaviors:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li>Placing fake, fraudulent, or speculative orders.</li>
            <li>Using automated scripts, bots, scrapers, or other technologies to harvest data or abuse the checkout.</li>
            <li>Bypassing or attempting to bypass security measures, encryption, or restrictions.</li>
            <li>Posting abusive, derogatory, or defamatory reviews, or harassing Trinco Bites delivery partners and support staff.</li>
            <li>Creating multiple accounts to exploit promotional discount codes or signup offers.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "limitation-of-liability",
      title: "8. Limitation of Liability",
      icon: ShieldAlert,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Trinco Bites operates as an online marketplace and delivery intermediary. We do not prepare food, own the 
            restaurants, or control their cooking methods.
          </p>
          <p className="leading-relaxed">
            Accordingly, to the maximum extent permitted by applicable law, Trinco Bites and its directors, employees, or 
            affiliates will not be held liable for:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li>Any issues with food quality, safety, allergens, or preparation standards.</li>
            <li>Any direct, indirect, incidental, or consequential damages resulting from platform downtime or delivery delays.</li>
            <li>Errors, omissions, or inaccuracies in restaurant menus, prices, or descriptions.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "modifications-to-terms",
      title: "9. Modifications to Terms",
      icon: Edit,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. When we make 
            material changes, we will update the "Last Updated" date at the top of this page.
          </p>
          <p className="leading-relaxed">
            If the changes are significant, we will provide a notification banner on our homepage or email registered users. 
            Your continued use of Trinco Bites after any modifications constitute full acceptance of the updated terms.
          </p>
        </div>
      ),
    },
    {
      id: "contact-information",
      title: "10. Contact Information",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            If you have any questions, concerns, or feedback regarding these Terms of Service, please contact our support team:
          </p>
          <div className="p-4 rounded-2xl space-y-2 text-sm" style={{ background: "rgba(129,52,5,0.03)", border: `1px solid ${C.line}` }}>
            <p><strong>Email:</strong> support@trincobites.lk</p>
            <p><strong>Hotline:</strong> +94 26 222 1234</p>
            <p><strong>Address:</strong> Trinco Bites HQ, Inner Harbour Road, Trincomalee, Sri Lanka</p>
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
            <BookOpen size={14} className="text-[#D45113]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#D45113]">Trinco Bites Legal</span>
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
            Terms of Service
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
