import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDaysInMonth,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale/es';

export function todayKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateKey(date: string): Date {
  return parseISO(date);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMonthYear(date: Date): string {
  return capitalize(format(date, 'MMMM yyyy', { locale: es }));
}

export function formatLongDate(date: Date): string {
  return capitalize(format(date, "EEEE d 'de' MMMM", { locale: es }));
}

export function formatShortDate(date: Date): string {
  return format(date, 'd MMM', { locale: es });
}

export function formatDayLabel(date: Date): string {
  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(today, startOfDay(date));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return capitalize(format(date, "EEEE d 'de' MMMM", { locale: es }));
}

export function isSameMonthDate(date: Date, reference: Date): boolean {
  return isSameMonth(date, reference);
}

export function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function monthStart(date: Date): Date {
  return startOfMonth(date);
}

export function monthEnd(date: Date): Date {
  return endOfMonth(date);
}

export function daysRemainingInMonth(date: Date = new Date()): number {
  const lastDay = getDaysInMonth(date);
  return Math.max(1, lastDay - date.getDate() + 1);
}

export function dueDateForMonth(dueDay: number, reference: Date): Date {
  const lastDay = getDaysInMonth(reference);
  const day = Math.min(Math.max(1, dueDay), lastDay);
  return new Date(reference.getFullYear(), reference.getMonth(), day);
}

export function nextDueDate(dueDay: number, from: Date = new Date()): Date {
  const today = startOfDay(from);
  const thisMonth = dueDateForMonth(dueDay, from);
  if (thisMonth >= today) return thisMonth;
  return dueDateForMonth(dueDay, addMonths(from, 1));
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  return differenceInCalendarDays(startOfDay(date), startOfDay(from));
}
