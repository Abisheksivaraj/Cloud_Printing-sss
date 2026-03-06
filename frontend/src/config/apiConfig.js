// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL
"https://cloud-printing-sss.onrender.com";


// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:8081";

export const API_ENDPOINTS = {
  // Authentication
  REGISTER: `${API_BASE_URL}/register`,
  LOGIN: `${API_BASE_URL}/login`,
  LOGOUT: `${API_BASE_URL}/api/logout`,
  FORGOT_PASSWORD: `${API_BASE_URL}/forgot-password`,
  SYSTEM_STATUS: `${API_BASE_URL}/system/status`,

  // Users
  USERS: `${API_BASE_URL}/api/users`,
  USER_BY_ID: (id) => `${API_BASE_URL}/api/users/${id}`,
  USER_CREATE: `${API_BASE_URL}/api/users/invite`, // This reflects the direct creation logic now
  USER_INVITE: `${API_BASE_URL}/api/users/invite`, // Keep for backward compatibility if used elsewhere
  USER_ACCEPT_INVITE: `${API_BASE_URL}/api/users/accept-invite`,
  USER_LOGIN_UPDATE: (id) => `${API_BASE_URL}/api/users/${id}/login`,

  // Printers
  PRINTERS: `${API_BASE_URL}/api/printers`,
  PRINTER_INFO: (name) =>
    `${API_BASE_URL}/api/printer/${encodeURIComponent(name)}/info`,
  PRINTER_STATUS: (name) =>
    `${API_BASE_URL}/api/printer/${encodeURIComponent(name)}/status`,
  PRINTER_PROPERTIES: `${API_BASE_URL}/api/printer/properties`,
  PRINTER_PREFERENCES: `${API_BASE_URL}/api/printer/preferences`,
  PRINTER_STATUS: (name) =>
    `${API_BASE_URL}/api/printer/${encodeURIComponent(name)}/status`,
  PRINTER_SETTINGS: `${API_BASE_URL}/api/open-printer-settings`,

  // Templates
  TEMPLATES: `${API_BASE_URL}/api/templates`,
  TEMPLATE_BY_ID: (id) => `${API_BASE_URL}/api/templates/${id}`,
  TEMPLATE_USE: (id) => `${API_BASE_URL}/api/templates/${id}/use`,
  TEMPLATES_POPULAR: `${API_BASE_URL}/api/templates/popular/list`,

  // Print Jobs
  PRINT_JOBS: `${API_BASE_URL}/api/print-jobs`,
  PRINT_JOB_BY_ID: (id) => `${API_BASE_URL}/api/print-jobs/${id}`,
  PRINT_JOB_STATUS: (id) => `${API_BASE_URL}/api/print-jobs/${id}/status`,
  PRINT_JOB_CANCEL: (id) => `${API_BASE_URL}/api/print-jobs/${id}/cancel`,
  PRINT_JOB_STATS: `${API_BASE_URL}/api/print-jobs/stats/summary`,

  // Assets
  ASSETS: `${API_BASE_URL}/api/assets`,
  ASSET_BY_ID: (id) => `${API_BASE_URL}/api/assets/${id}`,
  ASSET_SCAN: (code) => `${API_BASE_URL}/api/assets/scan/${code}`,
  ASSET_MOVE: (id) => `${API_BASE_URL}/api/assets/${id}/move`,
  ASSET_STATS: `${API_BASE_URL}/api/assets/stats/summary`,

  // AI Label Generation
  AI_GENERATE_LABEL: `${API_BASE_URL}/api/ai/generate-label`,
  AI_CHAT: `${API_BASE_URL}/api/ai/chat`,
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function for API calls
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      window.dispatchEvent(
        new CustomEvent("auth-error", { detail: data.message }),
      );
    }

    if (!response.ok) {
      const error = new Error(data.message || "API request failed");
      Object.assign(error, data);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Authentication helpers
export const authService = {
  login: async (email, password, forceLogin = false) => {
    const data = await apiCall(API_ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify({ email, password, forceLogin }),
    });

    if (data.token) {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  },

  register: async (registrationData) => {
    return await apiCall(API_ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify(registrationData),
    });
  },

  forgotPassword: async (email) => {
    return await apiCall(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  logout: async () => {
    try {
      if (localStorage.getItem("authToken")) {
        await apiCall(API_ENDPOINTS.LOGOUT, { method: "POST" });
      }
    } catch (err) {
      console.error("Backend logout failed", err);
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  checkSystemStatus: async () => {
    try {
      return await apiCall(API_ENDPOINTS.SYSTEM_STATUS);
    } catch (error) {
      console.error("Failed to check system status", error);
      return { success: false, superAdminExists: false };
    }
  },
};

export const printService = {
  getHistory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_ENDPOINTS.PRINT_JOBS}${query ? `?${query}` : ""}`;
    return await apiCall(url);
  },

  getJob: async (id) => {
    return await apiCall(API_ENDPOINTS.PRINT_JOB_BY_ID(id));
  },

  createJob: async (jobData) => {
    return await apiCall(API_ENDPOINTS.PRINT_JOBS, {
      method: "POST",
      body: JSON.stringify(jobData),
    });
  },

  updateStatus: async (id, status, errorMessage = null, errorLog = null, errorDetails = null) => {
    const url = API_ENDPOINTS.PRINT_JOB_STATUS(id);
    const body = { status, errorMessage };
    if (errorLog) body.errorLog = errorLog;
    if (errorDetails) body.errorDetails = errorDetails;
    return await apiCall(url, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deleteJob: async (id) => {
    return await apiCall(API_ENDPOINTS.PRINT_JOB_BY_ID(id), {
      method: "DELETE",
    });
  },

  getStats: async () => {
    return await apiCall(API_ENDPOINTS.PRINT_JOB_STATS);
  },
};

export default API_BASE_URL;
