"use client";

import { useState } from "react";
import convertedSchedules from "@/data/converted.json";
import convertedCopySchedules from "@/data/converted copy.json";

const scheduleFiles = [
  { fileName: "converted", schedules: convertedSchedules },
  { fileName: "converted copy", schedules: convertedCopySchedules },
] as const;

type Schedule = (typeof scheduleFiles)[number]["schedules"][number] & {
  selectionId: string;
  fileName: string;
};
type Slot = Schedule["slots"][number];
type Duration = 30 | 60 | 90;
const schedules: Schedule[] = scheduleFiles.flatMap(
  ({ fileName, schedules: fileSchedules }) =>
    fileSchedules.map((schedule) => ({
      ...schedule,
      fileName,
      selectionId: `${fileName}-${schedule.id}`,
    })),
);
const TIME_STEP_MINUTES = 30;
const PIXELS_PER_MINUTE = 2.8;

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours < 6 ? hours + 24 : hours) * 60 + minutes;
}

function minutesToClock(totalMinutes: number) {
  const minutesInDay = 24 * 60;
  const normalizedMinutes =
    ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeClockTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return minutesToClock(hours * 60 + minutes);
}

function getEndTime(startTime: string, duration: number) {
  return minutesToClock(timeToMinutes(startTime) + duration);
}

function floorToStep(minutes: number, step: number) {
  return Math.floor(minutes / step) * step;
}

function ceilToStep(minutes: number, step: number) {
  return Math.ceil(minutes / step) * step;
}

const colorStyles: Record<string, { accent: string; background: string }> = {
  green: { accent: "#22c55e", background: "rgba(34, 197, 94, .13)" },
  amber: { accent: "#fbbf24", background: "rgba(251, 191, 36, .12)" },
  violet: { accent: "#a78bfa", background: "rgba(139, 92, 246, .13)" },
  cyan: { accent: "#22d3ee", background: "rgba(34, 211, 238, .11)" },
  blue: { accent: "#3b82f6", background: "rgba(59, 130, 246, .13)" },
  pink: { accent: "#f472b6", background: "rgba(244, 114, 182, .12)" },
  lime: { accent: "#bef264", background: "rgba(190, 242, 100, .11)" },
  orange: { accent: "#f97316", background: "rgba(249, 115, 22, .13)" },
  red: { accent: "#ef4444", background: "rgba(239, 68, 68, .13)" },
  gray: { accent: "#9ca3af", background: "rgba(156, 163, 175, .13)" },
};

const categoryColors: Record<string, string> = {
  BIOLOGY: "green",
  CHEMISTRY: "amber",
  ECONOMY: "violet",
  PHYSICS: "cyan",
  IT: "blue",
  MATH: "pink",
  SOCIAL: "lime",
  EDUCATION: "orange",
  LITERATURE: "red",
  OTHER: "gray",
};

function MetaIcon({ type }: { type: "pin" | "mic" | "clock" }) {
  if (type === "clock") return <span aria-hidden="true">◷</span>;
  if (type === "mic") return <span aria-hidden="true">♢</span>;
  return <span aria-hidden="true">⌖</span>;
}

function SlotCard({
  slot,
  roomIndex,
  timelineStart,
}: {
  slot: Slot;
  roomIndex: number;
  timelineStart: number;
}) {
  const style =
    colorStyles[categoryColors[slot.type] ?? slot.color] ?? colorStyles.gray;
  const duration = (slot.duration ?? 30) as Duration;
  const room = slot.room || "Bez místnosti";
  const startMinutes = timeToMinutes(slot.time);
  const topOffset = (startMinutes - timelineStart) * PIXELS_PER_MINUTE;
  const blockHeight = duration * PIXELS_PER_MINUTE;
  const startTime = normalizeClockTime(slot.time);
  const endTime = getEndTime(slot.time, duration);

  return (
    <article
      className={`slot-card slot-card-${duration}`}
      style={
        {
          "--slot-accent": style.accent,
          "--slot-bg": style.background,
          "--slot-column": `${roomIndex + 1}`,
          "--slot-top": `${topOffset}px`,
          "--slot-height": `${blockHeight}px`,
        } as React.CSSProperties
      }
    >
      <div className="slot-line" />
      <div className="slot-content">
        <div className="slot-heading">
          <span className="slot-type">{slot.type}</span>
          <span className="slot-duration">
            {duration} min / {duration / 30} bloky
          </span>
          <span className="slot-room-badge">
            <MetaIcon type="pin" /> {room}
          </span>
        </div>
        <h3>{slot.title}</h3>
        <p className="slot-time-range">
          <MetaIcon type="clock" /> {startTime} - {endTime}
        </p>
      </div>
    </article>
  );
}

export default function Home() {
  const [activeId, setActiveId] = useState(schedules[0].selectionId);
  const activeSchedule =
    schedules.find((schedule) => schedule.selectionId === activeId) ??
    schedules[0];
  const scheduleRooms = Array.from(
    new Set(activeSchedule.slots.map((slot) => slot.room).filter(Boolean)),
  );
  const gridRooms =
    scheduleRooms.length > 0 ? scheduleRooms : ["Bez místnosti"];
  const timelineStarts = activeSchedule.slots.map((slot) =>
    timeToMinutes(slot.time),
  );
  const timelineEnds = activeSchedule.slots.map(
    (slot) => timeToMinutes(slot.time) + (slot.duration ?? 30),
  );
  const timelineStart = floorToStep(
    Math.min(...timelineStarts),
    TIME_STEP_MINUTES,
  );
  const timelineEnd = ceilToStep(Math.max(...timelineEnds), TIME_STEP_MINUTES);
  const timelineDuration = Math.max(
    TIME_STEP_MINUTES,
    timelineEnd - timelineStart,
  );
  const timelineHeight = timelineDuration * PIXELS_PER_MINUTE;
  const timeLabels = Array.from(
    { length: timelineDuration / TIME_STEP_MINUTES + 1 },
    (_, index) => {
      const minuteMark = timelineStart + index * TIME_STEP_MINUTES;
      return {
        label: minutesToClock(minuteMark),
        top: (minuteMark - timelineStart) * PIXELS_PER_MINUTE,
      };
    },
  );

  return (
    <main className="schedule-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <div className="ambient ambient-four" />
      <div className="ambient ambient-five" />
      <div className="math-art math-art-background" aria-hidden="true">
        <span className="math-triangle math-triangle-large" />
        <span className="math-triangle math-triangle-small" />
        <span className="math-fractal" />
        <span className="math-formula">△ ∑ ∫ √ π</span>
      </div>
      <div className="page-shell">
        <header className="topbar">
          <a className="brand" href="#" aria-label="Noční program">
            <span className="brand-mark">
              M<span>&</span>M
            </span>
            <span className="brand-title">PŘEDNÁŠKY</span>
          </a>
          <div className="topbar-note">korespondenční seminář / 2026</div>
        </header>

        <nav className="schedule-tabs" aria-label="Výběr rozvrhu">
          {schedules.map((schedule, index) => (
            <button
              className={`schedule-tab ${schedule.selectionId === activeId ? "active" : ""}`}
              key={schedule.selectionId}
              onClick={() => setActiveId(schedule.selectionId)}
              style={{ "--tab-accent": schedule.accent } as React.CSSProperties}
              aria-pressed={schedule.selectionId === activeId}
            >
              <span className="tab-number">0{index + 1}</span>
              <span className="tab-copy">
                <strong>{schedule.name}</strong>
                <small>
                  {schedule.fileName} / {schedule.date}
                </small>
              </span>
              <span className="tab-arrow">→</span>
            </button>
          ))}
        </nav>

        <section className="schedule-section" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{activeSchedule.date}</p>
              <h2>
                {activeSchedule.name}
                <span> / {activeSchedule.subtitle}</span>
              </h2>
            </div>
          </div>
          <div
            className="schedule-grid"
            style={
              {
                "--grid-columns": gridRooms.length,
                "--timeline-height": `${timelineHeight}px`,
              } as React.CSSProperties
            }
          >
            <div className="time-axis">
              {timeLabels.map((timeLabel) => (
                <span
                  style={{ top: `calc(40px + ${timeLabel.top}px)` }}
                  key={timeLabel.label}
                >
                  {timeLabel.label}
                </span>
              ))}
            </div>
            <div className="grid-board">
              <div className="room-headings">
                {gridRooms.map((room) => (
                  <span key={room}>{room}</span>
                ))}
              </div>
              <div className="grid-canvas">
                {activeSchedule.slots.map((slot, index) => (
                  <SlotCard
                    slot={slot}
                    roomIndex={Math.max(0, gridRooms.indexOf(slot.room))}
                    timelineStart={timelineStart}
                    key={`${activeSchedule.id}-${slot.time}-${slot.room}-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
