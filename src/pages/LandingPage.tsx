import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoveRight, Check, ArrowUpRight, Ellipsis } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import arrow from "@/assets/arrow.svg";
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

// ─── Dummy Calendar Preview Components ──────────────────────────────────────

const DummyCheckbox = ({ checked, color }: { checked: boolean; color: string }) => (
  <div
    className="h-[12px] w-[12px] shrink-0 rounded-[2px] border flex items-center justify-center mt-[1px]"
    style={{ borderColor: color, backgroundColor: checked ? color : "transparent" }}
  >
    {checked && <Check className="h-[10px] w-[10px] stroke-[2.5px] text-white" />}
  </div>
);

const DummyTaskRow = ({
  title,
  completed,
  color,
}: {
  title: string;
  completed: boolean;
  color: string;
}) => (
  <div className="flex items-center gap-1.5 h-5 px-1">
    <DummyCheckbox checked={completed} color={color} />
    <span
      className={`text-[11px] font-light truncate ${completed ? "line-through text-neutral-400" : "text-neutral-700"
        }`}
    >
      {title}
    </span>
  </div>
);

const DummyDeadlineBar = ({
  title,
  bgColor,
  textColor,
}: {
  title: string;
  bgColor: string;
  textColor: string;
}) => (
  <div
    className="h-4 rounded flex items-center justify-center px-1"
    style={{ backgroundColor: bgColor, color: textColor }}
  >
    <span className="text-[11px] font-light truncate">{title}</span>
  </div>
);

const DummyTaskListCard = ({
  name,
  colorBg,
  colorText,
  colorMid,
  tasks,
}: {
  name: string;
  colorBg: string;
  colorText: string;
  colorMid: string;
  tasks: { id: string; title: string; completed: boolean }[];
}) => (
  <div className="w-48 flex flex-col">
    {/* Header: badge + ellipsis */}
    <div className="flex items-center justify-between pb-0.5">
      <span
        className="inline-flex items-center rounded font-normal px-2 py-0.5 text-xxs select-none"
        style={{ backgroundColor: colorBg, color: colorText }}
      >
        {name}
      </span>
      <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-neutral-100 transition-colors">
        <Ellipsis className="h-3.5 w-3.5 text-neutral-400" />
      </button>
    </div>

    {/* Body */}
    <div className="flex flex-col bg-neutral-100/80 p-1 rounded-md">
      {tasks.map((task) => (
        <DummyTaskRow key={task.id} title={task.title} completed={task.completed} color={colorMid} />
      ))}
      {/* New task field */}
      <div className="px-1 py-0.5">
        <span className="text-xxs text-stone-400">+ New Task</span>
      </div>
    </div>
  </div>
);

const DummyDayCell = ({
  deadlines,
  tasks,
}: {
  deadlines: { id: string; title: string; bgColor: string; textColor: string }[];
  tasks: { id: string; title: string; completed: boolean; color: string }[];
}) => {
  const today = new Date();
  return (
    <div
      className="w-44 h-52 border border-neutral-200 p-[2px] bg-white flex flex-col overflow-hidden"
      style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.04)" }}
    >
      {/* Top row: left deadlines drop zone + date number in top-right corner */}
      <div className="flex h-fit justify-between mb-1 relative">
        <div className="flex-1 relative z-10">
          {/* Deadline bars sit in the content area below */}
        </div>
        <div className="flex items-center justify-center m-[1px] w-[24px] h-[24px] rounded-full bg-red-600 text-white relative z-10 text-xs font-medium flex-shrink-0">
          {today.getDate()}
        </div>
      </div>

      {/* Content area: deadlines + tasks */}
      <div className="flex-1 relative flex flex-col overflow-hidden px-[2px]">
        <div className="flex flex-col gap-[2px]">
          {deadlines.map((d) => (
            <DummyDeadlineBar key={d.id} title={d.title} bgColor={d.bgColor} textColor={d.textColor} />
          ))}
          {tasks.map((t) => (
            <DummyTaskRow key={t.id} title={t.title} completed={t.completed} color={t.color} />
          ))}
        </div>

        {/* "+" pinned to bottom, matches the inline add input */}
        <div className="mt-auto pt-1">
          <div className="h-5 w-full rounded px-1.5 text-[11px] text-muted-foreground/80">
            +
          </div>
        </div>
      </div>
    </div>
  );
};


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
      className="landing-page relative min-h-screen overflow-x-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Grid background overlay (PRD §6.1) */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 visible
        }`}
      />

      {/* ── NAV BAR ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-lg mx-auto mt-4">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary backdrop-blur-lg rounded-xl">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Seeds" className="w-5 h-5" />
              <span className="font-display text-sm font-light tracking-tight">Seeds</span>
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


      <div className="h-screen w-full flex flex-col items-center justify-center">
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <ScrollSection>
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-extralight text-neutral-900">
                Grow your routine, <br />one seed at a time.
              </h2>
            </div>
          </ScrollSection>

          <div className="absolute -z-10 w-full lg:w-3/5 h-4/5 lg:h-3/5 left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/3 origin-top scale-[0.68] sm:scale-[0.82] lg:scale-100">
            <div>
              <ScrollSection delay={0} className="absolute bottom-32 left-0">
                <DummyTaskListCard
                  name="Work"
                  colorBg="#D7ECFF"
                  colorText="#3C4C5D"
                  colorMid="#268ED3"
                  tasks={[
                    { id: "w1", title: "Review pull requests", completed: true },
                    { id: "w2", title: "Write sprint notes", completed: true },
                    { id: "w3", title: "Update roadmap doc", completed: false },
                    { id: "w4", title: "Team sync prep", completed: false },
                  ]}
                />
              </ScrollSection>

              <ScrollSection delay={0.1} className="absolute bottom-14 left-52">
                <DummyTaskListCard
                  name="Personal"
                  colorBg="#E8FEC6"
                  colorText="#4B6039"
                  colorMid="#5FAB00"
                  tasks={[
                    { id: "p1", title: "Morning run", completed: true },
                    { id: "p2", title: "Read 20 pages", completed: false },
                    { id: "p3", title: "Grocery run", completed: false },
                    { id: "p4", title: "Call dentist", completed: false },
                  ]}
                />
              </ScrollSection>
            </div>

            <div className="absolute bottom-16 left-80 flex flex-col items-center gap-2 self-center z-20">
              <img src={arrow} alt="arrow" className="w-20 ml-24" />
              <div
                className="flex w-32 items-center gap-1.5 bg-white border border-neutral-200 rounded p-1"
                style={{
                  // transform: "rotate(6deg)",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.14)",
                }}
              >

                <DummyCheckbox checked={false} color="#5FAB00" />
                <span className="text-[11px] font-light text-neutral-700 whitespace-nowrap">
                  Grocery run
                </span>
              </div>
            </div>

            <div className="absolute bottom-72 left-20 flex flex-col items-center gap-2 self-center z-20">
             
              <div
                className="flex w-32 items-center gap-1.5 bg-white border border-neutral-200 rounded p-1"
                style={{
                  // transform: "rotate(6deg)",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.14)",
                }}
              >

                <DummyCheckbox checked={false} color="#268ED3" />
                <span className="text-[11px] font-light text-neutral-700 whitespace-nowrap">
                  Team sync prep
                </span>
              </div>
            </div>

            <div className="absolute top-28 right-64 flex flex-col items-center gap-2 self-center z-20">
             
             <div
               className="flex w-32 items-center gap-1.5 bg-white border border-neutral-200 rounded p-1"
               style={{
                 // transform: "rotate(6deg)",
                 boxShadow: "0 10px 28px rgba(0,0,0,0.14)",
               }}
             >

               <DummyCheckbox checked={true} color="#BCAA00" />
               <span className="text-[11px] font-light text-neutral-700 whitespace-nowrap">
                 Team sync prep
               </span>
             </div>
           </div>

         

        


            <ScrollSection delay={0.2} className="absolute right-12 top-20">
              <DummyDayCell
                deadlines={[
                  { id: "d1", title: "Q1 Report due", bgColor: "#FFE1E2", textColor: "#5B3E3F" },
                  { id: "d2", title: "Design handoff", bgColor: "#D7ECFF", textColor: "#3C4C5D" },
                ]}
                tasks={[
                  { id: "c1", title: "Review slides", completed: true, color: "#268ED3" },
                  { id: "c2", title: "Send agenda", completed: false, color: "#268ED3" },
                  { id: "c3", title: "Book venue", completed: false, color: "#5FAB00" },
                ]}
              />
            </ScrollSection>
          </div>
        </section>



        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer className="absolute bottom-0 py-2 border-t border-border space-y-2 font-light w-full">
          <div className="px-8 lg:px-10 flex items-center gap-2 pb-2 border-b border-border text-left text-xs text-muted-foreground">
            <p>Noted</p>

          </div>
          <div className="px-8 lg:px-10 flex items-center gap-2 text-left text-xs text-muted-foreground">
            <p>Built by Hawon Lee</p>
            <a
              href="https://www.hawonlee.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-primary transition-colors"
              aria-label="Visit Hawon Lee's website"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

