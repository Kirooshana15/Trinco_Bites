import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Footer } from "@/components/Footer";

export function Success() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-hero px-6 text-center">
      <div className="grid flex-1 place-items-center">
      <div>
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto h-28 w-28 rounded-full bg-background grid place-items-center shadow-glow"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
            <Check className="h-14 w-14 text-brand-olive" strokeWidth={3} />
          </motion.div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-8 text-3xl font-extrabold text-primary-foreground">Order Delivered!</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-2 text-primary-foreground/90">Enjoy your meal. We'd love your feedback.</motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="mt-8 flex flex-col gap-3 max-w-xs mx-auto">
          <Link to="/rate" className="bg-background text-foreground font-semibold py-3.5 rounded-xl shadow-card">Rate Restaurant</Link>
          <Link to="/home" className="text-primary-foreground/90 text-sm font-medium">Back to home</Link>
        </motion.div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
