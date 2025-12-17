export interface ScanRecord {
  id: string;
  timestamp: string;
  imageDataUrl: string;
  prediction: string;
  probability: number;
  gradcamDataUrl?: string;
  maskDataUrl?: string;
  notes?: string;
}

const BASE_KEY = 'clarity_scan_history';

// Helper: If userId is missing, use 'guest'
const getUserKey = (userId: string | null | undefined) => `${BASE_KEY}_${userId || 'guest'}`;

export const getScans = (userId?: string | null): ScanRecord[] => {
  try {
    const key = getUserKey(userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading scans", error);
    return [];
  }
};

export const saveScan = (userId: string | null | undefined, scan: ScanRecord) => {
  try {
    const key = getUserKey(userId);
    const scans = getScans(userId);
    // Add new scan to top, keep last 50
    const updatedScans = [scan, ...scans].slice(0, 50); 
    localStorage.setItem(key, JSON.stringify(updatedScans));
  } catch (error) {
    console.error("Error saving scan", error);
  }
};

export const clearScans = (userId?: string | null) => {
  localStorage.removeItem(getUserKey(userId));
};
