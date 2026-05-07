import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

type FooterProps = Pick<
  HTMLMotionProps<"footer">,
  "variants" | "initial" | "animate" | "transition"
>;

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
      className="w-full px-4 py-4"
    >
      <p className="text-center text-xs font-medium tracking-[0.2em] text-[#692b04b3] md:text-sm">
        © 2026 Trinco Bites · Fast Delivery · Designed and Developed by{" "}
        <a
          href="https://neirahtech.com"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#D45113] underline underline-offset-4 transition-colors hover:text-[#813405]"
        >
          Neirahtech
        </a>
      </p>
    </motion.footer>
  );
}
