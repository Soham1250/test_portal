import axios from "axios";

// Base API URL (replace with your actual API URL)
const API_BASE_URL = "http://localhost:4000/api"; // Change this to your backend URL

// Create an Axios instance
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Generic GET request function
export const fetchData = async (endpoint) => {
    try {
        const response = await apiClient.post(`/${endpoint}`, {"testType": "", "UserID": "1"} );
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

// Generic POST request function
export const postData = async (endpoint, data) => {
    try {
        const response = await apiClient.post(`/${endpoint}`, data);
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};
