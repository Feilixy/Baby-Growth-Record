function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// Baby Profile
export function getProfile() {
  return read('baby_profile');
}

export function saveProfile(profile) {
  write('baby_profile', profile);
}

// Growth Records
export function getGrowthRecords() {
  return read('growth_records') || [];
}

export function addGrowthRecord(record) {
  const records = getGrowthRecords();
  records.push({ ...record, id: generateId() });
  records.sort((a, b) => new Date(a.date) - new Date(b.date));
  write('growth_records', records);
  return records;
}

export function updateGrowthRecord(id, data) {
  let records = getGrowthRecords();
  records = records.map(r => r.id === id ? { ...r, ...data } : r);
  write('growth_records', records);
  return records;
}

export function deleteGrowthRecord(id) {
  const records = getGrowthRecords().filter(r => r.id !== id);
  write('growth_records', records);
  return records;
}

// Photos
export function getPhotos() {
  return read('photos') || [];
}

export function addPhoto(photo) {
  const photos = getPhotos();
  photos.push({ ...photo, id: generateId() });
  photos.sort((a, b) => new Date(b.date) - new Date(a.date));
  write('photos', photos);
  return photos;
}

export function deletePhoto(id) {
  const photos = getPhotos().filter(p => p.id !== id);
  write('photos', photos);
  return photos;
}

// Milestones
export function getMilestones() {
  return read('milestones') || [];
}

export function addMilestone(milestone) {
  const milestones = getMilestones();
  milestones.push({ ...milestone, id: generateId() });
  milestones.sort((a, b) => new Date(b.date) - new Date(a.date));
  write('milestones', milestones);
  return milestones;
}

export function deleteMilestone(id) {
  const milestones = getMilestones().filter(m => m.id !== id);
  write('milestones', milestones);
  return milestones;
}

// Diaper Records
export function getDiaperRecords() {
  return read('diaper_records') || [];
}

export function addDiaperRecord(record) {
  const records = getDiaperRecords();
  records.push({ ...record, id: generateId() });
  records.sort((a, b) => {
    const dateCmp = new Date(b.date) - new Date(a.date);
    if (dateCmp !== 0) return dateCmp;
    return b.time.localeCompare(a.time);
  });
  write('diaper_records', records);
  return records;
}

export function deleteDiaperRecord(id) {
  const records = getDiaperRecords().filter(r => r.id !== id);
  write('diaper_records', records);
  return records;
}

export { generateId };
