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


    // import { serverTimestamp } from "firebase/firestore";

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

            // Use serverTimestamp() here instead of Date.now()
            await updateDoc(userRef, {
                lastSeen: Date.now()
            });

            setInterval(async () => {
                if (auth.chatUser) {
                    console.log("Updating lastSeen...");
                    await updateDoc(userRef, {
                        lastSeen: Date.now()
                    });
                }
            }, 70000);

        } catch (error) {
            toast.error(error.message);
        }
    }

    const removeDuplicatesByRId = (arr) => {
        const seen = new Set();
        return arr.filter(item => {
            if (seen.has(item.rId)) {
                return false;
            }
            seen.add(item.rId);
            return true;
        });
    };


    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id);
            const unSub = onSnapshot(chatRef, async (res) => {
                const data = res.data();
                const chatsData = data?.chatsData;

                const tempData = [];

                if (Array.isArray(chatsData)) {
                    for (const item of chatsData) {
                        const userRef = doc(db, 'users', item.rId);
                        const userSnap = await getDoc(userRef);
                        const userData = userSnap.data();
                        tempData.push({ ...item, userData });
                    }
                } else if (typeof chatsData === 'object' && chatsData !== null) {
                    for (const key in chatsData) {
                        const item = chatsData[key];
                        const userRef = doc(db, 'users', item.rId);
                        const userSnap = await getDoc(userRef);
                        const userData = userSnap.data();
                        tempData.push({ ...item, userData });
                    }
                }

                // Remove duplicates by rId before setting state
                const uniqueTempData = removeDuplicatesByRId(tempData);

                setChatData(uniqueTempData.sort((a, b) => b.updateAt - a.updateAt));
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
        messages, setMessages,
        messageId, setMessageId,
        chatUser, setChatUser,
        visible, setVisible,
        profileVisible, setProfileVisible,
        removeDuplicatesByRId


    }
    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider;