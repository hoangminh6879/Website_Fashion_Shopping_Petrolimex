import axios from "axios";

const API = "https://website-fashion-shopping-petrolimex.onrender.com";

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