import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = (props) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState(null);
    const [image, setImage] = useState(false);
    const [messageId, setMessageId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [visible, setVisible] = useState(false);
    const [profileVisible, setProfileVisible] = useState(false);


    const loadUserData = async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            setUserData(userData);
            if (userData.name) {
                navigate('/chat');
            } else {
                navigate('/profile');
            }
            await updateDoc(userRef, {
                lastSeen: Date.now()
            })
            setInterval(async () => {
                if (auth.chatUser) {
                    await updateDoc(userRef, {
                        lastSeen: Date.now()
                    })
                }
            }, 60000)
        } catch (error) {
            toast.error(error.message);
        }
    }

    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id);
            const unSub = onSnapshot(chatRef, async (res) => {
                const data = res.data();
                const chatsData = data?.chatsData;

                const tempData = [];

                // ✅ If chatsData is an array
                if (Array.isArray(chatsData)) {
                    for (const item of chatsData) {
                        const userRef = doc(db, 'users', item.rId);
                        const userSnap = await getDoc(userRef);
                        const userData = userSnap.data();
                        tempData.push({ ...item, userData });
                    }
                }

                // ✅ If chatsData is an object (common in Firestore)
                else if (typeof chatsData === 'object' && chatsData !== null) {
                    for (const key in chatsData) {
                        const item = chatsData[key];
                        const userRef = doc(db, 'users', item.rId);
                        const userSnap = await getDoc(userRef);
                        const userData = userSnap.data();
                        tempData.push({ ...item, userData });
                    }
                }

                // Set sorted chat data
                setChatData(tempData.sort((a, b) => b.updateAT - a.updateAT));
            });

            return () => unSub();
        }
    }, [userData]);


    const value = {
        userData,
        setUserData,
        chatData,
        setChatData,
        loadUserData,
        image,
        setImage,
        messages,setMessages,
        messageId, setMessageId,
        chatUser, setChatUser,
        visible, setVisible,
        profileVisible, setProfileVisible

    }
    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider;