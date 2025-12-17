import axios from 'axios';


// ✅ CORRECT (Dynamic)
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Types
export interface PredictionResult {
  mask_png_base64: any;
  predicted_disease: string;
  probabilities: Record<string, number>;
  confidence: number;
  heatmap_png_base64?: string;
}

export interface HistoryItem {
  id: number;
  predicted_disease: string;
  confidence: number;
  probabilities: string;  // stored as JSON string in DB
  timestamp: string;      // must match backend field
}

// Predict Image
export const predictImage = async (file: File): Promise<PredictionResult> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Get History
export const getHistory = async (): Promise<HistoryItem[]> => {
  const response = await api.get('/history');

  // Backend returns an array, so just return response.data
  if (Array.isArray(response.data)) {
    return response.data;
  } else {
    console.error("Unexpected /history response:", response.data);
    return [];
  }
};

// Health Check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};
