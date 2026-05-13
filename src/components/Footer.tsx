import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Send 
} from "lucide-react";
import logo from "@/utils/assets/logo.png";

type FooterProps = Pick<
  HTMLMotionProps<"footer">,
  "variants" | "initial" | "animate" | "transition"
>;

const C = {
  brown: "#813405",
  burnt: "#D45113",
  orange: "#F9A03F",
  cream: "#F8DDA4",
};

export function Footer({
  variants,
  initial,
  animate,
  transition,
}: FooterProps) {
  return (
    <motion.footer 
      variants={variants}
      initial={initial}
      animate={animate}
      transition={transition}
      className="relative pt-16 pb-8 overflow-hidden" 
      style={{ background: "rgba(255, 252, 245, 0.98)", borderTop: "1.5px solid rgba(212, 81, 19, 0.1)" }}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#813405 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Top Section: Branding & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-12 flex flex-col items-center text-center gap-6">
            <img src={logo} alt="TrincoBites" className="h-14 mb-2" />
            <p className="text-sm font-medium max-w-lg leading-relaxed" style={{ color: "rgba(129, 52, 5, 0.7)" }}>
              Trincomalee's premier food delivery platform. We connect you with the finest local flavors, delivered hot and fresh to your doorstep.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-[rgba(129,52,5,0.08)] text-center">
          <p className="text-xs font-medium" style={{ color: "rgba(129, 52, 5, 0.5)" }}>
            © {new Date().getFullYear()} TrincoBites - Designed & Developed by{" "}
            <a 
              href="https://neirahtech.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#D45113] font-bold"
              style={{ color: "rgba(129, 52, 5, 0.6)" }}
            >
              Neirahtech
            </a>
            . All Rights Reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
