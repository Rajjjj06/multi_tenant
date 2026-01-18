import axios from 'axios';

// Base URL for your backend API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Verify Firebase token and get JWT
  verifyToken: async (idToken) => {
    const response = await api.post('/auth/verify-token', { idToken });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Organization API functions
export const organizationAPI = {
  // Create organization
  createOrganization: async (name) => {
    const response = await api.post('/organization/create', { name });
    return response.data;
  },

  // Get user's organization
  getMyOrganization: async () => {
    const response = await api.get('/organization/current');
    return response.data;
  },

  // Update organization
  updateOrganization: async (id, name) => {
    const response = await api.put(`/organization/update/${id}`, { name });
    return response.data;
  },
};

// Project API functions
export const projectAPI = {
  // Create project
  createProject: async (name, description, organizationId) => {
    const response = await api.post('/project/create', { 
      name, 
      description, 
      organizationId 
    });
    return response.data;
  },

  // Get all projects for an organization
  // Note: If your route uses query params, pass organizationId as query: { organizationId }
  // If your route uses params, the route should be /project/get/:organizationId
  getProjects: async (organizationId) => {
    const response = await api.get(`/project/get/${organizationId}`);
    return response.data;
  },

  // Update project
  updateProject: async (projectId, name, description) => {
    const response = await api.put(`/project/update/${projectId}`, { 
      name, 
      description 
    });
    return response.data;
  },

  // Delete project
  deleteProject: async (projectId) => {
    const response = await api.delete(`/project/delete/${projectId}`);
    return response.data;
  },
};

// Member API functions
export const memberAPI = {
  // Add member to project
  addMember: async (organizationId, projectId, email, role) => {
    const response = await api.post(`/member/add/${organizationId}/${projectId}`, { 
      email, 
      role 
    });
    return response.data;
  },

  // Get all members of a project
  // Note: Your controller expects organizationId and projectId from params
  // If your route uses query params, use: ?organizationId=xxx&projectId=xxx
  // If your route uses params, the route should be /member/get/:organizationId/:projectId
  getMembers: async (organizationId, projectId) => {
    const response = await api.get(`/member/get/${organizationId}/${projectId}`);
    return response.data;
  },

  // Get all members of an organization (across all projects)
  getOrganizationMembers: async (organizationId) => {
    const response = await api.get(`/member/organization/${organizationId}`);
    return response.data;
  },

  // Update member (role, status, name, email)
  updateMember: async (organizationId, projectId, memberId, updates) => {
    const response = await api.put(`/member/update/${organizationId}/${projectId}/${memberId}`, updates);
    return response.data;
  },

  // Delete member from project
  deleteMember: async (organizationId, projectId, memberId) => {
    const response = await api.delete(`/member/delete/${organizationId}/${projectId}/${memberId}`);
    return response.data;
  },
};

export const taskAPI = {
  // Create task with optional memberIds array (if not provided, all members are assigned)
  createTask: async (name, projectId, organizationId, memberIds = null, description = null) => {
    const requestBody = {
      name,
      projectId,
      organizationId,
      description
    };
    
    // Only include memberIds if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      requestBody.memberIds = memberIds;
    }
    
    const response = await api.post('/task/create', requestBody);
    return response.data;
  },
  updateTaskStatus: async (taskId, status) => {
    const response = await api.put(`/task/update-status/${taskId}`, {
      status
    });
    return response.data;
  },
  getTasks: async (organizationId, projectId) => {
    const response = await api.get(`/task/get/${organizationId}/${projectId}`);
    return response.data;
  },
  deleteTask: async (taskId) => {
    const response = await api.delete(`/task/delete/${taskId}`);
    return response.data;
  },
}

export default api;

