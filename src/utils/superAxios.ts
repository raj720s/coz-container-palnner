
import { BASEURL } from '@/config/variables';
import axios from 'axios';


const superAxios = axios.create({
  baseURL: BASEURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

superAxios.interceptors.request.use(req => {
  if (req.params?.language) {
    const { language } = req.params
    req.params.ln = language || 'en';
  }
  return req;
})

superAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default superAxios;