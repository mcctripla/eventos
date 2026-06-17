import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCmuDrq-ctHOGu4Fe9gHoK2Fxhcfg3BE9g",
  authDomain: "calendario-estrategico.firebaseapp.com",
  projectId: "calendario-estrategico",
  storageBucket: "calendario-estrategico.firebasestorage.app",
  messagingSenderId: "941508404506",
  appId: "1:941508404506:web:af82455df11b35359538a3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
