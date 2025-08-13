/**
 * フェーズ管理用のユーティリティ関数
 */

/**
 * 日付が指定したフェーズ内にあるかチェック
 */
export function isDateInPhase(date: Date, startDate: string, endDate: string): boolean {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return checkDate >= start && checkDate <= end;
}

/**
 * 次の木曜日を計算
 */
export function getNextThursday(date: Date = new Date()): Date {
  const currentDay = date.getDay();
  const daysUntilThursday = (4 - currentDay + 7) % 7;
  
  const nextThursday = new Date(date);
  nextThursday.setDate(date.getDate() + daysUntilThursday);
  
  return nextThursday;
}

/**
 * 4週間後の木曜日を計算
 */
export function getThursdayAfter4Weeks(date: Date = new Date()): Date {
  const nextThursday = getNextThursday(date);
  const fourWeeksLater = new Date(nextThursday);
  fourWeeksLater.setDate(nextThursday.getDate() + 28); // 4週間 = 28日
  
  return fourWeeksLater;
}

/**
 * フェーズの残り日数を計算
 */
export function getDaysRemainingInPhase(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * フェーズの進捗率を計算（0-100%）
 */
export function getPhaseProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  if (totalDuration <= 0) return 100;
  
  const progress = (elapsed / totalDuration) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * フェーズ名を生成
 */
export function generatePhaseName(phaseNumber: number): string {
  return `フェーズ${phaseNumber}`;
}

/**
 * フェーズの期間を日本語で表示
 */
export function formatPhasePeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startStr = start.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  
  const endStr = end.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  
  return `${startStr} 〜 ${endStr}`;
}

/**
 * フェーズの残り時間を人間が読みやすい形式で表示
 */
export function getTimeRemainingText(endDate: string): string {
  const daysRemaining = getDaysRemainingInPhase(endDate);
  
  if (daysRemaining === 0) {
    return '今日で終了';
  } else if (daysRemaining === 1) {
    return '明日で終了';
  } else if (daysRemaining < 7) {
    return `あと${daysRemaining}日`;
  } else if (daysRemaining < 14) {
    const weeks = Math.floor(daysRemaining / 7);
    const days = daysRemaining % 7;
    if (days === 0) {
      return `あと${weeks}週間`;
    } else {
      return `あと${weeks}週間${days}日`;
    }
  } else {
    const weeks = Math.floor(daysRemaining / 7);
    return `あと${weeks}週間`;
  }
}
