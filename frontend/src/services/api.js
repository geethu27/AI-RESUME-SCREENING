import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unexpected error occurred';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
  }
);

// 1. Health & Status API
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

// 2. Authentication API (Recruiter Login)
export const login = async (credentials) => {
  const response = await apiClient.post('/login', credentials);
  return response.data;
};

// 3. Dashboard Statistics API
export const getDashboardStats = async () => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

// 4. Jobs APIs
export const getJobs = async () => {
  const response = await apiClient.get('/jobs');
  return response.data;
};

export const getJob = async (id) => {
  const response = await apiClient.get(`/jobs/${id}`);
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await apiClient.post('/jobs', jobData);
  return response.data;
};

export const updateJob = async (id, jobData) => {
  const response = await apiClient.put(`/jobs/${id}`, jobData);
  return response.data;
};

export const deleteJob = async (id) => {
  const response = await apiClient.delete(`/jobs/${id}`);
  return response.data;
};

// 5. Resume Upload & Retrieval APIs
export const uploadResumes = async (formData, onProgress) => {
  const response = await apiClient.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

export const getResumes = async () => {
  const response = await apiClient.get('/resumes');
  return response.data;
};

export const getResume = async (id) => {
  const response = await apiClient.get(`/resumes/${id}`);
  return response.data;
};

// 6. Candidates APIs
export const getCandidates = async () => {
  const response = await apiClient.get('/candidates');
  return response.data;
};

export const getCandidate = async (id) => {
  const response = await apiClient.get(`/candidates/${id}`);
  return response.data;
};

// 7. Screening & Ranking APIs (Deterministic & Rule-Based)
export const runScreening = async (jobId, options = {}) => {
  const response = await apiClient.post(`/screening/${jobId}`, options);
  return response.data;
};

export const getScreeningResults = async (jobId, params = {}) => {
  const response = await apiClient.get(`/screening/${jobId}`, { params });
  return response.data;
};

export const getCandidateScreeningDetail = async (jobId, candidateId) => {
  const response = await apiClient.get(`/screening/${jobId}/candidate/${candidateId}`);
  return response.data;
};

export default apiClient;
