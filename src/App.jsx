import { Route, Routes, useNavigate } from "react-router-dom";
import './index.css';
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
  import { ToastContainer, toast } from 'react-toastify';
import { useContext, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { AppContext } from "./context/AppContext";

const App = () => {
  const navigate = useNavigate();
  const { loadUserData } = useContext(AppContext);

  useEffect(()=>{
    onAuthStateChanged(auth, async (user)=> {
      if(user){
        navigate('/chat');
        await loadUserData(user.uid);
      } else {
        navigate('/');
      }
    });
  }, [])
  return (
    <>
      <ToastContainer/>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/chat" element={<Chat/>}/>
        <Route path="/profile" element={<Profile/>}/>
      </Routes>
    </>
  )
}

export default App;