import axios from "axios";



const BASE_API_URL = "https://trip-social.onrender.com/api/v1";

const api = axios.create({
    baseURL: BASE_API_URL,
    timeout: 10000,
  });

  export default api;

  // http://localhost:3001/api/v1