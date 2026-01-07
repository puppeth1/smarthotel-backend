import { initializeApp, getApps } from "firebase/app"; 
import { getAuth } from "firebase/auth"; 

const firebaseConfig = { 
  apiKey: "AIzaSyD2FQMrAFoXFnCOshsVq2KgbyrnXSdUvOY", 
  authDomain: "smarthotel-392319.firebaseapp.com", 
  projectId: "smarthotel-392319", 
  storageBucket: "smarthotel-392319.appspot.com", 
  messagingSenderId: "109492252323", 
  appId: "1:109492252323:web:98338300038392923f279c", 
}; 

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig); 

export const auth = getAuth(app);