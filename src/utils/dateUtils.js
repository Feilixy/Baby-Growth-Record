export function getAge(birthDate) {
  const birth = new Date(birthDate);
  const now = new Date();
  const diff = now - birth;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { days: 0, text: '即将出生' };
  if (days === 0) return { days: 0, text: '今天出生 🎉' };
  if (days < 30) return { days, text: `${days} 天` };
  const months = Math.floor(days / 30);
  const remainDays = days % 30;
  if (months < 12) {
    return { days, text: remainDays > 0 ? `${months} 个月 ${remainDays} 天` : `${months} 个月` };
  }
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  return { days, text: remainMonths > 0 ? `${years} 岁 ${remainMonths} 个月` : `${years} 岁` };
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatTime(timeStr) {
  return timeStr.substring(0, 5);
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
