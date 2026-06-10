import { useEffect, useRef, useState } from "react";
import { Star, Plus, Heart, Minus, Flame } from "lucide-react";
import type { FoodItem } from "@/utils/data/mock";
import { useCart } from "@/context/CartContext";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";

// ─── Google Fonts (add to your index.html or _document.tsx) ─────────────────

export function FoodCard({
  item,
  restaurantId,
  index = 0,
}: {
  item: FoodItem;
  restaurantId: string;
  index?: number;
}) {
  const { add, setQty, items } = useCart();
  const [isLiked, setIsLiked] = useState(false);

  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);
  const heartRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Entrance animation ────────────────────────────────────────────────────
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const tl = gsap.timeline({
      delay: index * 0.08,
      defaults: { ease: "expo.out", duration: 1.2 },
    });

    const xOffset = index % 2 === 0 ? -20 : 20;
    const initialRotation = index % 2 === 0 ? -5 : 5;

    gsap.set(card, { opacity: 0, y: 50, x: xOffset, scale: 0.9, rotate: initialRotation });

    tl.to(card, { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 });

    if (badgeRef.current) {
      gsap.fromTo(
        badgeRef.current.children,
        { opacity: 0, x: -12, scale: 0.8 },
        { opacity: 1, x: 0, scale: 1, stagger: 0.1, delay: index * 0.08 + 0.3, ease: "back.out(1.7)", duration: 0.5 }
      );
    }
  }, [index]);

  // ── Hover: 3-D tilt + shimmer ─────────────────────────────────────────────
  useEffect(() => {
    const card = cardRef.current;
    const shimmer = shimmerRef.current;
    const img = imageRef.current;
    if (!card || !shimmer || !img) return;

    const onEnter = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(card, {
        rotateY: cx * 10,
        rotateX: -cy * 8,
        scale: 1.025,
        y: -6,
        boxShadow: "0 32px 70px rgba(129,52,5,0.18), 0 8px 24px rgba(212,81,19,0.12)",
        duration: 0.4,
        ease: "power2.out",
      });

      gsap.to(img, { scale: 1.08, duration: 0.6, ease: "power2.out" });

      gsap.fromTo(
        shimmer,
        { opacity: 0, x: "-100%" },
        { opacity: 1, x: "150%", duration: 0.6, ease: "power1.inOut" }
      );
    };

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, { rotateY: cx * 10, rotateX: -cy * 8, duration: 0.15, ease: "none" });
    };

    const onLeave = () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        y: 0,
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
        duration: 0.5,
        ease: "expo.out",
      });
      gsap.to(img, { scale: 1, duration: 0.5, ease: "expo.out" });
      gsap.to(shimmer, { opacity: 0, duration: 0.3 });
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // ── Heart burst ───────────────────────────────────────────────────────────
  const handleLike = () => {
    setIsLiked((prev) => {
      const next = !prev;
      if (heartRef.current) {
        gsap.timeline()
          .to(heartRef.current, { scale: 0.75, duration: 0.1, ease: "power2.in" })
          .to(heartRef.current, { scale: 1.3, duration: 0.25, ease: "back.out(3)" })
          .to(heartRef.current, { scale: 1, duration: 0.2, ease: "power2.out" });
      }
      return next;
    });
  };

  // ── Add-to-cart pop ───────────────────────────────────────────────────────
  const handleAdd = () => {
    add(item, restaurantId);
    if (priceRef.current) {
      gsap.fromTo(
        priceRef.current,
        { y: 0, scale: 1 },
        { y: -4, scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.inOut" }
      );
    }
  };

  return (
    <Link to="/food/$id" params={{ id: item.id }} search={{ restaurantId }}>
      <div
        ref={cardRef}
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        className="group relative flex flex-col rounded-[28px] overflow-hidden border border-[#F8DDA4]/30 bg-white cursor-pointer select-none"
      >
      {/* ── Shimmer overlay ────────────────────────────────────────────────── */}
      <div
        ref={shimmerRef}
        className="absolute inset-0 z-30 pointer-events-none"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(248,221,164,0.18) 50%, transparent 60%)",
          opacity: 0,
        }}
      />

      {/* ── Noise texture ─────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-20 pointer-events-none rounded-[28px] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* ── Top badges ─────────────────────────────────────────────────────── */}
      <div ref={badgeRef} className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        {item.popular && (
          <div className="flex items-center gap-1.5 bg-[#D45113] text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-[#D45113]/40 uppercase tracking-widest">
            <Flame size={9} className="fill-white" />
            Popular
          </div>
        )}
        {item.discount && (
          <div className="bg-[#813405] text-[#F8DDA4] text-[9px] font-black px-3 py-1.5 rounded-full shadow-md uppercase tracking-widest">
            {item.discount}
          </div>
        )}
      </div>

      {/* ── Heart ─────────────────────────────────────────────────────────── */}
      <button
        ref={heartRef}
        onClick={handleLike}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center border"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          borderColor: isLiked ? "#D45113" : "rgba(248,221,164,0.5)",
          boxShadow: isLiked
            ? "0 4px 16px rgba(212,81,19,0.25)"
            : "0 2px 10px rgba(0,0,0,0.06)",
          color: "#D45113",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <Heart
          size={16}
          fill={isLiked ? "#D45113" : "none"}
          strokeWidth={isLiked ? 0 : 2}
        />
      </button>

      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="aspect-[4/3] overflow-hidden relative">
        <div ref={imageRef} className="w-full h-full">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(129,52,5,0.22) 0%, transparent 50%)",
          }}
        />

        {/* Rating pill — floating on image */}
        <div
          className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(10px)",
            color: "#813405",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Star size={9} fill="#F9A03F" stroke="none" />
          <span style={{ color: "#F9A03F" }}>{item.rating}</span>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col flex-1 p-5 gap-3"
        style={{
          background:
            "linear-gradient(160deg, #ffffff 0%, #FDF6EC 100%)",
        }}
      >
        {/* Name */}
        <h4
          className="leading-tight text-base group-hover:text-[#D45113] transition-colors duration-300"
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "1.08rem",
            color: "#813405",
            letterSpacing: "-0.01em",
          }}
        >
          {item.name}
        </h4>

        {/* Description */}
        <p
          className="text-[11px] leading-relaxed line-clamp-2 flex-1"
          style={{
            fontFamily: "var(--font-body)",
            color: "#9C7A5B",
            fontStyle: "italic",
          }}
        >
          {item.description}
        </p>

        {/* Decorative rule */}
        <div
          className="w-full h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, #F8DDA4, transparent)",
          }}
        />

        {/* Price + Cart */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-none">
            <span
              className="text-[9px] uppercase tracking-[0.15em] mb-1"
              style={{ fontFamily: "var(--font-body)", color: "#C4A07A", fontWeight: 700 }}
            >
              Price
            </span>
            <span
              ref={priceRef}
              className="text-lg font-black"
              style={{
                fontFamily: "var(--font-heading)",
                color: "#813405",
                letterSpacing: "-0.02em",
              }}
            >
              Rs {item.price.toLocaleString()}
            </span>
          </div>

          {quantity > 0 ? (
            <div
              className="flex items-center gap-2 rounded-2xl p-1"
              style={{
                background: "linear-gradient(135deg, #F7F0E3, #FDF0DE)",
                border: "1px solid rgba(248,221,164,0.6)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <button
                onClick={() => setQty(item.id, quantity - 1)}
                className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                style={{ color: "#D45113" }}
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <span
                className="min-w-[22px] text-center text-sm font-black"
                style={{ color: "#813405", fontFamily: "var(--font-body)" }}
              >
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md active:scale-90 transition-transform"
                style={{
                  background: "linear-gradient(135deg, #D45113, #813405)",
                  boxShadow: "0 4px 12px rgba(212,81,19,0.35)",
                }}
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-xs font-black overflow-hidden active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, #D45113 0%, #813405 100%)",
                boxShadow: "0 6px 20px rgba(212,81,19,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.04em",
              }}
            >
              {/* inner gloss */}
              <span
                className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl pointer-events-none"
                style={{ background: "rgba(255,255,255,0.12)" }}
              />
              <Plus size={14} strokeWidth={3} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
    </Link>
  );
}
