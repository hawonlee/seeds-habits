import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoveRight, Check } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
  AnimatePresence,
} from "framer-motion";

// ─── Seed Component (PRD §5.1) ───────────────────────────────────────────────
type SeedState = "empty" | "half" | "complete";

const SeedCircle = ({
  state,
  size = 14,
  label,
  meta,
  delay = 0,
}: {
  state: SeedState;
  size?: number;
  label?: string;
  meta?: string;
  delay?: number;
}) => {
  const [showMeta, setShowMeta] = useState(false);
  const [popped, setPopped] = useState(false);

  const fillMap: Record<SeedState, string> = {
    empty: "transparent",
    half: "#22C55E80",
    complete: "#22C55E",
  };

  return (
    <motion.div
      className="relative group cursor-default"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
      onMouseEnter={() => setShowMeta(true)}
      onMouseLeave={() => setShowMeta(false)}
    >
      <svg width={size + 8} height={size + 8} viewBox={`0 0 ${size + 8} ${size + 8}`}>
        <circle
          cx={(size + 8) / 2}
          cy={(size + 8) / 2}
          r={size / 2}
          fill={fillMap[state]}
          stroke="#22C55E"
          strokeWidth={1}
          className={popped ? "seed-pop" : ""}
        />
        {state === "complete" && (
          <motion.path
            d={`M${(size + 8) / 2 - 3} ${(size + 8) / 2} l2 2 l4 -4`}
            stroke="white"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: delay + 0.3, duration: 0.3 }}
            onAnimationComplete={() => setPopped(true)}
          />
        )}
      </svg>

      {label && (
        <span className="block text-center font-mono text-[10px] text-neutral-500 mt-1 leading-none">
          {label}
        </span>
      )}

      <AnimatePresence>
        {showMeta && meta && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white px-2 py-1 rounded text-[10px] font-mono z-50"
          >
            {meta}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Magnetic Hover Wrapper (PRD §4.2) ───────────────────────────────────────
const MagneticHover = ({
  children,
  className = "",
  strength = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        x.set(dx * strength);
        y.set(dy * strength);
      }
    },
    [x, y, strength]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Scroll-triggered Section (PRD §4.2 staggered slide up) ─────────────────
const ScrollSection = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Task Decomposition Animation (PRD §3.1 left edge) ──────────────────────
const TaskDecomposition = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const seeds = [
    { label: "Outline", delay: 0.8 },
    { label: "Research", delay: 1.0 },
    { label: "Drafting", delay: 1.2 },
    { label: "Review", delay: 1.4 },
    { label: "Submit", delay: 1.6 },
  ];

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      {/* Parent card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5 }}
        className="border border-neutral-200 rounded-lg px-4 py-2.5 bg-white"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.04)" }}
      >
        <span className="font-mono text-[11px] text-neutral-400 block">S-001</span>
        <span className="font-display text-sm font-light text-neutral-800">Final Project</span>
      </motion.div>

      {/* Thread lines + seeds */}
      <svg width="2" height="24" className="overflow-visible">
        <motion.line
          x1="1" y1="0" x2="1" y2="24"
          stroke="#d4d4d4"
          strokeWidth={1}
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }}
        />
      </svg>

      <div className="flex gap-3 flex-wrap justify-center">
        {seeds.map((s, i) =>
          isInView ? (
            <SeedCircle
              key={s.label}
              state={i < 2 ? "complete" : i === 2 ? "half" : "empty"}
              size={14}
              label={s.label}
              meta={`Created: 02.19.26 | Priority: ${i < 2 ? "Done" : "High"}`}
              delay={s.delay}
            />
          ) : null
        )}
      </div>
    </div>
  );
};

// ─── Progress Radial (PRD §3.2) ──────────────────────────────────────────────
const ProgressRadial = ({ progress }: { progress: number }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f5f5f5" strokeWidth="4" />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#22C55E"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-xl text-neutral-700">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

// ─── Task Stack (PRD §5.2) ───────────────────────────────────────────────────
const TaskStack = () => {
  const tasks = [
    { id: "S-005", title: "Final review pass", color: "#f0fdf4" },
    { id: "S-004", title: "Add citations", color: "#f0f9ff" },
    { id: "S-003", title: "Write conclusion", color: "#fefce8" },
    { id: "S-002", title: "Draft introduction", color: "#fdf4ff" },
    { id: "S-001", title: "Build outline", color: "#fff7ed" },
  ];

  return (
    <div className="relative h-48 w-64">
      {tasks.map((task, i) => (
        <motion.div
          key={task.id}
          className="absolute left-0 right-0 border border-neutral-200 rounded-lg px-4 py-3 bg-white"
          style={{
            top: i * 6,
            rotate: `${(i - 2) * 1.2}deg`,
            zIndex: tasks.length - i,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          whileHover={{ y: -4, rotate: 0, transition: { duration: 0.2 } }}
        >
          <span className="font-mono text-[10px] text-neutral-400">{task.id}</span>
          <p className="font-display text-xs font-light text-neutral-700">{task.title}</p>
        </motion.div>
      ))}
    </div>
  );
};

// ─── Deadline Ribbon (PRD §5.3) ──────────────────────────────────────────────
const DeadlineRibbon = ({
  days,
  hours,
  minutes,
}: {
  days: number;
  hours: number;
  minutes: number;
}) => {
  return (
    <div className="w-full deadline-ribbon">
      <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 py-1 border border-neutral-200 rounded-full">
          <span className="font-mono text-[10px] text-neutral-500 tracking-wider">
            Time Remaining: {String(days).padStart(2, "0")}d {String(hours).padStart(2, "0")}h{" "}
            {String(minutes).padStart(2, "0")}m
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Sticky Note (PRD §6.3) ─────────────────────────────────────────────────
const StickyNote = ({
  text,
  author,
  rotation = 0,
}: {
  text: string;
  author: string;
  rotation?: number;
}) => {
  return (
    <MagneticHover>
      <motion.div
        className="w-52 p-4 rounded-sm relative"
        style={{
          backgroundColor: "#FEF9C3",
          rotate: `${rotation}deg`,
          boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
        }}
        whileHover={{ scale: 1.03, rotate: 0 }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 rounded-sm washi-tape"
          style={{
            width: "40px",
            background:
              "repeating-linear-gradient(90deg, #3B82F640, #3B82F640 4px, transparent 4px, transparent 8px)",
          }}
        />
        <p className="font-display text-xs font-light text-neutral-700 leading-relaxed">
          "{text}"
        </p>
        <p className="font-mono text-[9px] text-neutral-400 mt-2">— {author}</p>
      </motion.div>
    </MagneticHover>
  );
};

// ─── Discord Bubble (PRD §6.3) ───────────────────────────────────────────────
const DiscordBubble = ({ text, user }: { text: string; user: string }) => {
  return (
    <MagneticHover>
      <div
        className="bg-[#f8f9fa] border border-neutral-100 rounded-xl px-4 py-3 max-w-xs"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}
      >
        <span className="font-mono text-[10px] text-[#3B82F6] font-medium">{user}</span>
        <p className="font-display text-xs font-light text-neutral-600 mt-0.5">{text}</p>
      </div>
    </MagneticHover>
  );
};

// ─── Bento Cell (PRD §3.2 / §6.2) ───────────────────────────────────────────
const BentoCell = ({
  children,
  className = "",
  span = "1x1",
}: {
  children: React.ReactNode;
  className?: string;
  span?: "1x1" | "1x2" | "2x1" | "2x2";
}) => {
  const spanMap = {
    "1x1": "col-span-1 row-span-1",
    "1x2": "col-span-1 row-span-2",
    "2x1": "col-span-2 row-span-1",
    "2x2": "col-span-2 row-span-2",
  };

  return (
    <ScrollSection>
      <div
        className={`${spanMap[span]} rounded-2xl border border-neutral-100 bg-white p-6 ${className}`}
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.03)" }}
      >
        {children}
      </div>
    </ScrollSection>
  );
};

// ─── Live Task Breakdown Demo (PRD §6.2 Cell A) ─────────────────────────────
const TaskBreakdownDemo = () => {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  const outputs = ["Outline", "Source Hunting", "Drafting", "Editing"];

  return (
    <div ref={ref} className="space-y-5">
      <div>
        <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
          Input
        </span>
        <div className="mt-2 border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50/50">
          <span className="font-display text-sm font-light">"Write Research Paper"</span>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={active ? { scaleY: 1 } : {}}
          transition={{ duration: 0.3 }}
          className="w-px h-6 bg-neutral-300 origin-top"
        />
      </div>

      <div>
        <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
          Seeds
        </span>
        <div className="mt-2 space-y-1.5">
          {outputs.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -12 }}
              animate={active ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <SeedCircle state="empty" size={10} delay={0} />
              <span className="font-display text-xs font-light text-neutral-700">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Stat Box (PRD §3.1 corners) ────────────────────────────────────────────
const StatBox = ({ label, value }: { label: string; value: string }) => (
  <MagneticHover strength={0.08}>
    <div
      className="border border-neutral-200 rounded-md px-3 py-1.5 bg-white float-drift"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}
    >
      <span className="font-mono text-[10px] text-neutral-400">{label}</span>
      <span className="font-mono text-sm text-neutral-800 block">{value}</span>
    </div>
  </MagneticHover>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const LandingPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridVisible, setGridVisible] = useState(false);
  const gridTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const radialProgress = useTransform(scrollYProgress, [0.15, 0.55], [0, 100]);
  const [radialValue, setRadialValue] = useState(0);

  useEffect(() => {
    const unsubscribe = radialProgress.on("change", (v) => setRadialValue(v));
    return unsubscribe;
  }, [radialProgress]);

  // Grid background visibility on mouse move (PRD §6.1)
  const handleMouseMove = useCallback(() => {
    setGridVisible(true);
    if (gridTimerRef.current) clearTimeout(gridTimerRef.current);
    gridTimerRef.current = setTimeout(() => setGridVisible(false), 2000);
  }, []);

  // Reduced motion support (PRD §7.2)
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      ref={containerRef}
      className="landing-page relative bg-white min-h-screen overflow-x-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Grid background overlay (PRD §6.1) */}
      <div
        className={`landing-grid-bg fixed inset-0 pointer-events-none z-0 ${
          gridVisible ? "visible" : ""
        }`}
      />

      {/* ── NAV BAR ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-lg mx-auto mt-4">
          <div className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl border border-neutral-100">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Seeds" className="w-5 h-5" />
              <span className="font-display text-sm font-light tracking-tight">seeds</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-display font-light h-7 px-3"
                onClick={() => navigate("/auth")}
              >
                Log In
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                className="text-xs font-display font-light h-7 px-3"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── SECTION 1: HERO — "The Infinite Workspace" (Scroll 0-1000px) ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Peripheral stat boxes (PRD §3.1 corners) */}
        <div className="absolute top-24 left-8 hidden lg:block">
          <StatBox label="Tasks Completed" value="128" />
        </div>
        <div className="absolute top-24 right-8 hidden lg:block">
          <StatBox label="Active Seeds" value="12" />
        </div>

        {/* Left edge: Task Decomposition (PRD §3.1) */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden xl:block">
          <TaskDecomposition />
        </div>

        {/* Right edge: Deadline tag (PRD §3.1) */}
        <motion.div
          className="absolute right-8 hidden lg:block"
          style={{ top: useTransform(scrollYProgress, [0, 0.3], ["40%", "60%"]) }}
        >
          <MagneticHover strength={0.1}>
            <div className="flex items-center gap-2 float-drift-slow">
              <div className="w-px h-16 bg-neutral-200" />
              <div className="border border-neutral-200 rounded-md px-3 py-1.5 bg-white"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}
              >
                <span className="font-mono text-[10px] text-neutral-400 block">Deadline</span>
                <span className="font-mono text-xs text-red-400">Feb 28, 2026</span>
              </div>
            </div>
          </MagneticHover>
        </motion.div>

        {/* Hero Content */}
        <div className="text-center max-w-3xl mx-auto relative z-10">
          <motion.h1
            className="font-display text-5xl sm:text-7xl md:text-[88px] font-extralight leading-[0.95] tracking-[-0.04em] text-neutral-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            Grow your big ideas,{" "}
            <span className="italic">one seed</span> at a time.
          </motion.h1>

          <motion.p
            className="font-display text-lg sm:text-xl font-light text-neutral-400 mt-8 tracking-[-0.01em]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Decompose complex assignments into manageable, atomic tasks.
            <br className="hidden sm:block" />
            Watch them grow into accomplishments.
          </motion.p>

          <motion.div
            className="flex gap-3 items-center justify-center mt-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Button
              variant="tertiary"
              size="default"
              className="font-display text-sm font-light gap-2 h-10 px-6"
              onClick={() => navigate("/auth")}
            >
              Start Planting
              <MoveRight strokeWidth={1.5} className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Seed row under hero text */}
          <motion.div
            className="flex gap-4 items-center justify-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {(["complete", "complete", "complete", "half", "empty", "empty", "empty"] as SeedState[]).map(
              (state, i) => (
                <SeedCircle
                  key={i}
                  state={state}
                  size={10}
                  delay={0.9 + i * 0.08}
                />
              )
            )}
          </motion.div>
        </div>
      </section>

      {/* ── DEADLINE RIBBON (PRD §5.3) ─────────────────────────────────── */}
      <div className="py-16 px-6">
        <ScrollSection>
          <DeadlineRibbon days={2} hours={14} minutes={5} />
        </ScrollSection>
      </div>

      {/* ── SECTION 2: BENTO GRID (Scroll 1000-2500px) ────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <ScrollSection>
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-extralight tracking-[-0.03em] text-neutral-900">
              Intelligence, atomized.
            </h2>
            <p className="font-display text-base font-light text-neutral-400 mt-4 max-w-lg mx-auto">
              Seeds breaks the overwhelming into the achievable. Every feature is designed for
              clarity.
            </p>
          </div>
        </ScrollSection>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
          {/* Cell A (2x2): Task Breakdown (PRD §6.2) */}
          <BentoCell span="2x2" className="flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
                Task Shredder
              </span>
              <h3 className="font-display text-lg font-light text-neutral-800 mt-1">
                Break it down
              </h3>
              <p className="font-display text-xs font-light text-neutral-400 mt-1">
                Feed in any complex task. Get back an actionable checklist.
              </p>
            </div>
            <TaskBreakdownDemo />
          </BentoCell>

          {/* Cell B (1x2): Progress Radial (PRD §3.2) */}
          <BentoCell span="1x2" className="flex flex-col items-center justify-center">
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mb-4">
              Progress
            </span>
            <ProgressRadial progress={radialValue} />
            <p className="font-display text-xs font-light text-neutral-400 mt-3 text-center">
              Fills as you scroll —<br />your momentum, visualized.
            </p>
          </BentoCell>

          {/* Cell C (1x1): Seed states */}
          <BentoCell span="1x1" className="flex flex-col items-center justify-center gap-3">
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
              Seed States
            </span>
            <div className="flex gap-4 items-end">
              <div className="flex flex-col items-center gap-1">
                <SeedCircle state="empty" size={18} delay={0} />
                <span className="font-mono text-[9px] text-neutral-400">Identified</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <SeedCircle state="half" size={18} delay={0.1} />
                <span className="font-mono text-[9px] text-neutral-400">In Progress</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <SeedCircle state="complete" size={18} delay={0.2} />
                <span className="font-mono text-[9px] text-neutral-400">Complete</span>
              </div>
            </div>
          </BentoCell>

          {/* Cell D (1x1): Task Stack preview */}
          <BentoCell span="1x1" className="flex flex-col items-center justify-center overflow-hidden">
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mb-2">
              Task Stack
            </span>
            <div className="scale-75 origin-center">
              <TaskStack />
            </div>
          </BentoCell>

          {/* Cell E (2x1): The Thread UI (PRD §8) */}
          <BentoCell span="2x1" className="flex flex-col justify-center">
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mb-3">
              The Thread
            </span>
            <ThreadUI />
          </BentoCell>

          {/* Cell F (2x1): Features list */}
          <BentoCell span="2x1" className="flex flex-col justify-center">
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mb-3">
              Everything You Need
            </span>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-1">
              {[
                "Task decomposition",
                "Priority tagging",
                "Deadline tracking",
                "Progress radials",
                "Calendar sync",
                "Drag & drop",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-[#22C55E]" strokeWidth={2} />
                  <span className="font-display text-xs font-light text-neutral-600">{f}</span>
                </div>
              ))}
            </div>
          </BentoCell>
        </div>
      </section>

      {/* ── SECTION 3: SOCIAL PROOF — Sticky Notes & Discord (PRD §6.3) ── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <ScrollSection>
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-extralight tracking-[-0.03em] text-neutral-900">
              People are growing things.
            </h2>
          </div>
        </ScrollSection>

        <div className="flex flex-wrap justify-center gap-6 items-start">
          <ScrollSection delay={0}>
            <StickyNote
              text="I finally finished my thesis because I stopped seeing it as one giant task."
              author="@marina_k"
              rotation={-2}
            />
          </ScrollSection>

          <ScrollSection delay={0.1}>
            <DiscordBubble
              user="jake.dev"
              text="Seeds is the only tool that actually made me break things down instead of just listing them."
            />
          </ScrollSection>

          <ScrollSection delay={0.2}>
            <StickyNote
              text="The decomposition feature is worth it alone. Turns chaos into clarity."
              author="@emi.patel"
              rotation={1.5}
            />
          </ScrollSection>

          <ScrollSection delay={0.3}>
            <DiscordBubble
              user="the_real_carlos"
              text="Went from 0 to 12 completed seeds in a week. Addicting in the best way."
            />
          </ScrollSection>

          <ScrollSection delay={0.15}>
            <StickyNote
              text="Clean, minimal, and no fluff. Exactly what productivity tools should be."
              author="@fiona.z"
              rotation={-1}
            />
          </ScrollSection>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <ScrollSection>
          <div className="text-center max-w-lg mx-auto">
            <h2 className="font-display text-4xl sm:text-5xl font-extralight tracking-[-0.04em] text-neutral-900">
              Plant your first seed.
            </h2>
            <p className="font-display text-base font-light text-neutral-400 mt-4">
              Free to start. No credit card required.
            </p>
            <div className="mt-8">
              <Button
                variant="tertiary"
                size="default"
                className="font-display text-sm font-light gap-2 h-10 px-6"
                onClick={() => navigate("/auth")}
              >
                Get Started
                <MoveRight strokeWidth={1.5} className="w-4 h-4" />
              </Button>
            </div>

            {/* Seed row */}
            <div className="flex gap-3 items-center justify-center mt-10">
              {(["complete", "complete", "half", "empty", "empty"] as SeedState[]).map((s, i) => (
                <SeedCircle key={i} state={s} size={8} delay={0} />
              ))}
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Seeds" className="w-4 h-4 opacity-40" />
            <span className="font-display text-xs font-light text-neutral-300">
              seeds &copy; 2026
            </span>
          </div>
          <span className="font-mono text-[10px] text-neutral-300">
            Grow your routine, one seed at a time.
          </span>
        </div>
      </footer>
    </div>
  );
};

// ─── Thread UI (PRD §8 — connecting parent to seeds) ─────────────────────────
const ThreadUI = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const seeds = ["Research", "Draft", "Review", "Submit"];

  return (
    <div ref={ref} className="flex items-center gap-0 w-full">
      {/* Parent node */}
      <div className="flex-shrink-0">
        <div className="border border-neutral-200 rounded-md px-3 py-1.5 bg-neutral-50">
          <span className="font-mono text-[10px] text-neutral-500">Project</span>
        </div>
      </div>

      {/* Thread lines */}
      <svg className="flex-1 h-8 overflow-visible" preserveAspectRatio="none">
        {seeds.map((_, i) => {
          const xStart = 0;
          const xEnd = `${((i + 1) / seeds.length) * 100}%`;
          return (
            <motion.line
              key={i}
              x1={xStart}
              y1="50%"
              x2={xEnd}
              y2="50%"
              stroke="#d4d4d4"
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
            />
          );
        })}
      </svg>

      {/* Seed nodes */}
      <div className="flex gap-2 flex-shrink-0">
        {seeds.map((seed, i) => (
          <motion.div
            key={seed}
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{
              delay: 0.5 + i * 0.15,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-3 h-3 rounded-full border border-[#22C55E]"
              style={{
                backgroundColor: i < 2 ? "#22C55E" : i === 2 ? "#22C55E80" : "transparent",
              }}
            />
            <span className="font-mono text-[8px] text-neutral-400">{seed}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
