import React from 'react'
import ReactDOM from 'react-dom/client'
import {App} from './App.jsx'
import './css/index.css'
import "bootstrap/dist/css/bootstrap.min.css";
import 'react-calendar/dist/Calendar.css';
import {UserProvider} from "./components/Services/UserContext";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <UserProvider>
    <App />
    </UserProvider>
  </React.StrictMode>,
);
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful');
      },
      (err) => {
        console.log('ServiceWorker registration failed: ', err);
      }
    );
  });
}*/