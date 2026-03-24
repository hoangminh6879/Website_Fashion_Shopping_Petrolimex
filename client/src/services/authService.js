import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const registerUser = (data) => {
  return axios.post(`${API}/register`, data);
};

export const loginUser = (data) => {
  return axios.post(`${API}/login`, data);
};

export const forgotPassword = (data) => {
  return axios.post(`${API}/forgot-password`, data);
};

export const resetPassword = (token, data) => {
  return axios.post(`${API}/reset-password/${token}`, data);
};