'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MONTH_NAMES,
  WEEKDAY_LABELS,
  MONTH_IMAGES,
  MONTH_THEMES,
  generateCalendarDays,
  generateMiniCalendarDays,
  isDateInRange,
  isSameDay,
  formatDateRange,
  getRangeDays,
  saveNotes,
  loadNotes,
  getNoteKey,
  DayInfo,
} from '../lib/calendarUtils';

// ================================================================
// SUB-COMPONENTS
// ================================================================

/** Spiral Binding Decoration */
function SpiralBinding() {
  return (
    <div className="spiral-binding">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="spiral-ring" />
      ))}
    </div>
  );
}

/** Hero Image Panel */
function HeroPanel({
  month,
  year,
  direction,
}: {
  month: number;
  year: number;
  direction: number;
}) {
  const theme = MONTH_THEMES[month];

  return (
    <div className="hero-panel">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${year}-${month}`}
          className="hero-image-wrapper"
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src={MONTH_IMAGES[month]}
            alt={`${MONTH_NAMES[month]} scenery`}
            className="hero-image"
            loading="eager"
          />
          <div className="hero-overlay">
            <span className="hero-year">{year}</span>
            <span className="hero-month">{MONTH_NAMES[month]}</span>
          </div>
          <div
            className="hero-geo-shape"
            style={{
              ['--theme-accent' as string]: theme.accent,
            } as React.CSSProperties}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Day Cell */
function DayCell({
  day,
  isStart,
  isEnd,
  inRange,
  isHoverPreview,
  isHoverEnd,
  isPending,
  hasNote,
  onClick,
  onMouseEnter,
}: {
  day: DayInfo;
  isStart: boolean;
  isEnd: boolean;
  inRange: boolean;
  isHoverPreview: boolean;
  isHoverEnd: boolean;
  isPending: boolean;
  hasNote: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
}) {
  const cellRef = useRef<HTMLDivElement>(null);

  // Ripple effect on click
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!day.isCurrentMonth) return;
      const cell = cellRef.current;
      if (cell) {
        const rect = cell.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        cell.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      }
      onClick(e);
    },
    [onClick, day.isCurrentMonth]
  );

  if (!day.isCurrentMonth) {
    return (
      <div className="day-cell other-month">
        <div className="range-strip" />
        <span className="day-inner">{day.date}</span>
      </div>
    );
  }

  const classes = [
    'day-cell',
    day.isWeekend ? 'weekend' : '',
    day.isToday ? 'today' : '',
    isStart ? 'selected-start' : '',
    isEnd ? 'selected-end' : '',
    isStart && isPending ? 'pending' : '',
    inRange && !isStart && !isEnd ? 'in-range' : '',
    isHoverPreview && !isStart && !isEnd && !inRange && !isHoverEnd ? 'hover-preview' : '',
    isHoverEnd && !isEnd ? 'hover-preview-end' : '',
    isStart && isHoverPreview && !isEnd && !inRange ? 'hover-preview-start' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cellRef}
      className={classes}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
    >
      <div className="range-strip" />
      <motion.span
        className="day-inner"
        whileTap={{ scale: 0.88 }}
        transition={{ duration: 0.12 }}
      >
        {day.date}
      </motion.span>
      {day.holiday && (
        <>
          <span className="holiday-dot" />
          <span className="holiday-tooltip">{day.holiday}</span>
        </>
      )}
      {hasNote && !isStart && !isEnd && <span className="note-indicator" />}
    </div>
  );
}

/** Mini Calendar */
function MiniCalendar({
  year,
  month,
  label,
}: {
  year: number;
  month: number;
  label: string;
}) {
  const today = new Date();
  const days = generateMiniCalendarDays(year, month);
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="mini-cal">
      <div className="mini-cal-title">{label}</div>
      <div className="mini-cal-grid">
        {weekdays.map((w, i) => (
          <div key={`h-${i}`} className="mini-cal-day mini-header">
            {w}
          </div>
        ))}
        {days.map((d, i) => {
          const isToday =
            d !== null &&
            d === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const dayIndex = i % 7;
          const isWeekend = dayIndex >= 5;
          return (
            <div
              key={i}
              className={`mini-cal-day${isToday ? ' mini-today' : ''}${isWeekend && d !== null ? ' mini-weekend' : ''}`}
            >
              {d || ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Notes Section */
function NotesSection({
  noteKey,
  rangeBadge,
}: {
  noteKey: string;
  rangeBadge: string | null;
}) {
  const [text, setText] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const prevKeyRef = useRef(noteKey);

  // Load notes when key changes
  useEffect(() => {
    if (noteKey !== prevKeyRef.current) {
      prevKeyRef.current = noteKey;
    }
    const saved = loadNotes(noteKey);
    setText(saved);
  }, [noteKey]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setText(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveNotes(noteKey, value);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      }, 500);
    },
    [noteKey]
  );

  return (
    <div className="notes-section">
      <div className="notes-header">
        <span className="notes-title">Notes</span>
        {rangeBadge && <span className="notes-range-badge">{rangeBadge}</span>}
      </div>
      <textarea
        className="notes-textarea"
        value={text}
        onChange={handleChange}
        placeholder={
          rangeBadge
            ? `Add notes for ${rangeBadge}...`
            : 'Add notes for this month...'
        }
        aria-label="Notes"
        id="calendar-notes-textarea"
      />
      <div className={`notes-autosave ${showSaved ? 'visible' : ''}`}>
        ✓ Auto-saved
      </div>
    </div>
  );
}

// ================================================================
// MAIN CALENDAR COMPONENT
// ================================================================
export default function WallCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [direction, setDirection] = useState(1);
  const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply month accent
  useEffect(() => {
    const monthTheme = MONTH_THEMES[currentMonth];
    document.documentElement.style.setProperty('--theme-accent', monthTheme.accent);
    document.documentElement.style.setProperty('--theme-accent-light', monthTheme.accentLight);
  }, [currentMonth]);

  // Calendar days
  const days = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Navigation
  const goToPrevMonth = useCallback(() => {
    setDirection(-1);
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setDirection(1);
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const t = new Date();
    setDirection(t.getMonth() > currentMonth ? 1 : -1);
    setCurrentMonth(t.getMonth());
    setCurrentYear(t.getFullYear());
  }, [currentMonth]);

  // Date selection
  const handleDayClick = useCallback(
    (day: DayInfo) => {
      if (!day.isCurrentMonth) return;
      const clickedDate = day.dateObj;

      if (selectionStep === 'start') {
        setStartDate(clickedDate);
        setEndDate(null);
        setSelectionStep('end');
      } else {
        // Ensure start <= end
        if (startDate && clickedDate < startDate) {
          setEndDate(startDate);
          setStartDate(clickedDate);
        } else {
          setEndDate(clickedDate);
        }
        setSelectionStep('start');
      }
    },
    [selectionStep, startDate]
  );

  const handleDayHover = useCallback(
    (day: DayInfo) => {
      if (selectionStep === 'end' && day.isCurrentMonth) {
        setHoverDate(day.dateObj);
      }
    },
    [selectionStep]
  );

  const clearSelection = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
    setSelectionStep('start');
  }, []);

  // Compute selection display info
  const effectiveEnd = endDate || hoverDate;
  const rangeBadge =
    startDate && endDate ? formatDateRange(startDate, endDate) : null;
  const rangeDays =
    startDate && endDate ? getRangeDays(startDate, endDate) : null;
  const noteKey = getNoteKey(currentYear, currentMonth, startDate, endDate);

  // Mini calendar months
  const prevMiniMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMiniYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const nextMiniMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMiniYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevMonth();
      if (e.key === 'ArrowRight') goToNextMonth();
      if (e.key === 'Escape') clearSelection();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToPrevMonth, goToNextMonth, clearSelection]);

  return (
    <div className="calendar-app">
      <div className="calendar-container" id="wall-calendar">
        <SpiralBinding />

        {/* LEFT: Hero Image */}
        <HeroPanel month={currentMonth} year={currentYear} direction={direction} />

        {/* RIGHT: Calendar Panel */}
        <div className="calendar-panel">
          {/* Toolbar */}
          <div className="calendar-toolbar">
            <div className="nav-controls">
              <button
                className="nav-btn"
                onClick={goToPrevMonth}
                aria-label="Previous month"
                id="btn-prev-month"
              >
                ‹
              </button>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${currentYear}-${currentMonth}`}
                  className="nav-month-year"
                  initial={{ opacity: 0, y: direction * 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: direction * -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </motion.span>
              </AnimatePresence>
              <button
                className="nav-btn"
                onClick={goToNextMonth}
                aria-label="Next month"
                id="btn-next-month"
              >
                ›
              </button>
            </div>
            <div className="toolbar-actions">
              <button
                className="today-btn"
                onClick={goToToday}
                id="btn-today"
              >
                Today
              </button>
              <button
                className="theme-toggle"
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                aria-label="Toggle theme"
                id="btn-theme-toggle"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>

          {/* Range Info — Visual Timeline */}
          <AnimatePresence>
            {startDate && (
              <motion.div
                className="range-info-bar"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="range-info-content">
                  <div className="range-timeline">
                    <div className="timeline-dot start" />
                    <div className={`timeline-line${endDate ? '' : ' pending'}`} />
                    <div className={`timeline-dot${endDate ? ' end' : ' pending'}`} />
                  </div>
                  <span className="range-info-text">
                    {endDate ? (
                      <>
                        <span className="range-dates">{rangeBadge}</span>
                        <span className="range-count">· {rangeDays} day{rangeDays! > 1 ? 's' : ''}</span>
                      </>
                    ) : (
                      <>
                        <span className="range-dates">{MONTH_NAMES[startDate.getMonth()]} {startDate.getDate()}</span>
                        <span className="range-count">→ pick end date</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  className="range-clear-btn"
                  onClick={clearSelection}
                  id="btn-clear-range"
                >
                  ✕ Clear
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selection hint */}
          {!startDate && (
            <div className="selection-hint">
              <span className="selection-hint-icon">+</span>
              Click a date to start selecting a range
            </div>
          )}

          {/* Calendar Grid */}
          <div className="calendar-grid-wrapper">
            {/* Weekday headers */}
            <div className="weekday-header">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`weekday-label${i >= 5 ? ' weekend' : ''}`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Days */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`grid-${currentYear}-${currentMonth}`}
                className="days-grid"
                initial={{ opacity: 0, y: direction * 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: direction * -15 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {days.map((day, idx) => {
                  const isStart =
                    startDate !== null &&
                    day.isCurrentMonth &&
                    isSameDay(day.dateObj, startDate);
                  const isEnd =
                    endDate !== null &&
                    day.isCurrentMonth &&
                    isSameDay(day.dateObj, endDate);
                  const inRange =
                    day.isCurrentMonth &&
                    isDateInRange(day.dateObj, startDate, endDate);
                  const isHoverPreview =
                    !endDate &&
                    startDate !== null &&
                    hoverDate !== null &&
                    day.isCurrentMonth &&
                    isDateInRange(day.dateObj, startDate, hoverDate);
                  const isHoverEnd =
                    !endDate &&
                    hoverDate !== null &&
                    day.isCurrentMonth &&
                    isSameDay(day.dateObj, hoverDate) &&
                    !isSameDay(day.dateObj, startDate!);
                  const isPending = selectionStep === 'end' && !endDate;

                  return (
                    <DayCell
                      key={`${day.year}-${day.month}-${day.date}-${idx}`}
                      day={day}
                      isStart={isStart}
                      isEnd={isEnd}
                      inRange={inRange}
                      isHoverPreview={isHoverPreview}
                      isHoverEnd={isHoverEnd}
                      isPending={isPending}
                      hasNote={false}
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => handleDayHover(day)}
                    />
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Notes */}
          <NotesSection noteKey={noteKey} rangeBadge={rangeBadge} />

          {/* Mini Calendars */}
          <div className="mini-calendars">
            <MiniCalendar
              year={prevMiniYear}
              month={prevMiniMonth}
              label={`${MONTH_NAMES[prevMiniMonth].slice(0, 3)} ${prevMiniYear}`}
            />
            <MiniCalendar
              year={nextMiniYear}
              month={nextMiniMonth}
              label={`${MONTH_NAMES[nextMiniMonth].slice(0, 3)} ${nextMiniYear}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
