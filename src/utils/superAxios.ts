import { BASEURL } from '@/config/variables';
import axios from 'axios';
import Cookies from 'js-cookie'
const getToken = () => {
  return process.env.NEXT_PUBLIC_TOKEN;
}

const superAxios = axios.create({
  baseURL: BASEURL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `${getToken()}`
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