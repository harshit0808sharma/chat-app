import { BsFillImageFill, BsFillSendFill, BsThreeDotsVertical } from "react-icons/bs";
import { CgProfile } from "react-icons/cg";
import { FaSearch } from "react-icons/fa";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { IoChatboxEllipses } from "react-icons/io5";
// import img1 from '../assets/images/ProfileLogo.jpg';
import { db, logout } from "../config/firebase";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { toast } from "react-toastify";


const Chat = () => {
    const { removeDuplicatesByRId, userData, chatData, setChatData, chatUser, setChatUser, setMessageId, messageId, messages, setMessages, visible, setVisible, profileVisible, setProfileVisible } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState("");

    const navigate = useNavigate();

    // console.log(input)
    const sendMessage = async () => {
        try {
            if (input && messageId) {
                await updateDoc(doc(db, 'messages', messageId), {
                    messages: arrayUnion({
                        sId: userData.id,
                        text: input,
                        createAt: new Date()
                    })
                })
                const userIDs = [chatUser.rId, userData.id];
                userIDs.forEach(async (id) => {
                    const userChatsRef = doc(db, 'chats', id);
                    const userChatsSnapshot = await getDoc(userChatsRef);
                    if (userChatsSnapshot.exists()) {
                        const userChatData = userChatsSnapshot.data();
                        const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === messageId);
                        userChatData.chatsData[chatIndex].lastMessage = input.slice(0, 30);
                        userChatData.chatsData[chatIndex].updateAt = Date.now();
                        if (userChatData.chatsData[chatIndex].rId === userData.id) {
                            userChatData.chatsData[chatIndex].messageSeen = false;
                        }
                        await updateDoc(userChatsRef, {
                            chatsData: userChatData.chatsData
                        })
                    }
                })
            }
        } catch (error) {
            toast.error(error.message);
        }
        setInput("");
    }

    useEffect(() => {
        if (chatData && userData) {
            setLoading(false);
        }
    }, [chatData, userData])

    // useEffect(() => {
    //     if (image) {
    //         const url = URL.createObjectURL(image);
    //         setImageUrl(url);

    //         // Cleanup URL when component unmounts or image changes
    //         return () => URL.revokeObjectURL(url);
    //     } else {
    //         setImageUrl(null);
    //     }
    // }, [image]);

    const inputHandler = async (e) => {
        try {
            const input = e.target.value;
            setVisible(false);
            if (input) {
                setShowSearch(true);
                const userRef = collection(db, 'users');
                const q = query(userRef, where("username", "==", input.toLowerCase()));
                const querySnap = await getDocs(q);
                if (!querySnap.empty && querySnap.docs[0].id !== userData.id) {
                    let userExist = false;
                    chatData.forEach((user) => {
                        if (user.rId === querySnap.docs[0].data().id) {
                            userExist = true;
                        }
                    });
                    if (!userExist) {
                        setUser(querySnap.docs[0].data());
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } else {
                // Clear state when input is empty
                setShowSearch(false);
                setUser(null); // ✅ clear the user here
            }
        } catch (error) {
            toast.error(error.message);
        }
    };


    const addChat = async () => {
        if (!user || !user.id) return;

        // Check local state for duplicates (already there)
        const alreadyExists = chatData.some(chat => chat.rId === user.id);
        if (alreadyExists) {
            setShowSearch(false);
            setUser(null);
            setVisible(false);
            return;
        }

        try {
            const messagesRef = collection(db, "messages");
            const chatRef = collection(db, "chats");

            const newMessageRef = doc(messagesRef);
            await setDoc(newMessageRef, {
                createAt: serverTimestamp(),
                messages: []
            });

            const newChatForOtherUser = {
                messageId: newMessageRef.id,
                lastMessage: "",
                rId: userData.id,
                updateAt: Date.now(),
                messageSeen: true
            };

            const newChatForCurrentUser = {
                messageId: newMessageRef.id,
                lastMessage: "",
                rId: user.id,
                updateAt: Date.now(),
                messageSeen: true
            };

            // Update other user's chatsData: fetch, remove duplicates, then update
            const otherUserDocRef = doc(chatRef, user.id);
            const otherUserDocSnap = await getDoc(otherUserDocRef);
            let otherUserChats = otherUserDocSnap.exists() ? otherUserDocSnap.data().chatsData || [] : [];
            otherUserChats = removeDuplicatesByRId(otherUserChats.filter(chat => chat.rId !== userData.id));
            otherUserChats.push(newChatForOtherUser);
            await updateDoc(otherUserDocRef, { chatsData: otherUserChats });

            // Update current user's chatsData: fetch, remove duplicates, then update
            const currentUserDocRef = doc(chatRef, userData.id);
            const currentUserDocSnap = await getDoc(currentUserDocRef);
            let currentUserChats = currentUserDocSnap.exists() ? currentUserDocSnap.data().chatsData || [] : [];
            currentUserChats = removeDuplicatesByRId(currentUserChats.filter(chat => chat.rId !== user.id));
            currentUserChats.push(newChatForCurrentUser);
            await updateDoc(currentUserDocRef, { chatsData: currentUserChats });

            // Update local chatData state safely
            setChatData(prev => {
                const exists = prev.some(chat => chat.rId === user.id);
                if (!exists) {
                    return [
                        ...prev,
                        {
                            messageId: newMessageRef.id,
                            lastMessage: "",
                            rId: user.id,
                            updateAt: Date.now(),
                            messageSeen: true,
                            userData: user
                        }
                    ];
                }
                return prev;
            });

            setUser(null);
            setShowSearch(false);
            setVisible(false);

        } catch (error) {
            toast.error(error.message);
            console.error(error);
        }
    };




    const setChat = async (item) => {
        try {
            setMessageId(item.messageId);
            setChatUser(item);
            const userChatsRef = doc(db, 'chats', userData.id);
            const userChatsSnapshot = await getDoc(userChatsRef);
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === item.messageId);
            userChatsData.chatsData[chatIndex].messageSeen = true;
            await updateDoc(userChatsRef, {
                chatsData: userChatsData.chatsData
            })
            setVisible(true);
        } catch (error) {
            toast.error(error.message)
        }
    }

    // useEffect(()=> {
    //     if(messageId){
    //         const unSub = onSnapshot(doc(db, 'messages', messageId), (res)=> {
    //             setMessages(res.data().messages.reverse())
    //             // console.log(res.data().messages.reverse())
    //         })
    //         return unSub();
    //     }
    // }, [messageId])

    useEffect(() => {
        if (messageId) {
            const unSub = onSnapshot(doc(db, 'messages', messageId), (res) => {
                const data = res.data();
                if (data && Array.isArray(data.messages)) {
                    setMessages([...data.messages].reverse()); // Defensive & safe
                } else {
                    setMessages([]); // fallback
                }
            });

            return () => unSub(); // ✅ Correct: cleanup on unmount
        }
    }, [messageId]);

    const convertTimestamp = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };



    // console.log(chatData);
    const isUserOnline = (lastSeen) => {
        if (!lastSeen) return false;
        return (Date.now() - lastSeen) <= 70000; // 70 seconds = 1 min 10 sec
    };



    return (
        <>
            <div className="chat-page">
                {
                    loading ? (
                        <p className="loading">Loading...</p>
                    ) : (
                        <div className="chat-inner">
                            <div className="chat-left">
                                <div className="left-header">
                                    <div className="chat-name-icon">
                                        <IoChatboxEllipses style={{ color: "blue" }} />
                                        <span>Chatapp</span>
                                    </div>
                                    <div className="three-dots">
                                        <BsThreeDotsVertical />
                                        <div className="sub-menu">
                                            <p onClick={() => navigate('/profile')}>Edit Profile</p>
                                            <hr className="horizontal-line" />
                                            <p onClick={() => logout()}>Logout</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="left-center">
                                    <FaSearch />
                                    <input onChange={inputHandler} type="search" placeholder="search..." />
                                </div>

                                <div className={`left-bottom ${visible ? "invisible" : "visible"}`}>
                                    {showSearch && user && !chatData.some(chat => chat.rId === user.id) ? (
                                        <div onClick={addChat} className="single-chat-id">
                                            <CgProfile />
                                            <p>
                                                <span>{user.name}</span>
                                                <span style={{ color: "white" }}>type message</span>
                                            </p>
                                        </div>
                                    ) : (
                                        chatData.map((item, index) => (
                                            <div
                                                onClick={() => setChat(item)}
                                                className={`single-chat-id ${item.messageSeen === false && item.messageId !== messageId ? "border" : ""
                                                    }`}
                                                key={index}
                                            >
                                                <CgProfile />
                                                <p>
                                                    <span>{item.userData.name}</span>
                                                    <span>{item.lastMessage}</span>
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                            </div>
                            <div className="chat-center">
                                {
                                    chatUser ? (
                                        <div className="chat-center-inner">
                                            <div className="chat-center-header">
                                                <div className="chat-center-header-right" style={{ cursor: "pointer" }} onClick={() => setProfileVisible(!profileVisible)}>
                                                    <CgProfile style={{ color: "black", fontSize: "20px" }} />
                                                    <h3 style={{ color: "black" }}>
                                                        {chatUser?.userData?.name}
                                                        {isUserOnline(chatUser?.userData?.lastSeen) && <span className="green-dot"></span>}
                                                    </h3>
                                                </div>
                                                <IoIosInformationCircleOutline style={{ color: "black" }} />
                                            </div>
                                            <div className="chat-messages">
                                                {messages.map((msg, index) => (
                                                    <div key={index} className={msg.sId === userData.id ? "r-msg" : "s-msg"}>
                                                        <div className="msg-message">
                                                            <p style={{ color: "black" }}>{msg.text}</p>
                                                        </div>
                                                        <div className="msg-img" style={{ display: "flex", flexDirection: "column" }}>
                                                            <CgProfile style={{ color: "black", fontSize: "20px" }} />
                                                            <span style={{ color: "black" }}>{convertTimestamp(msg.createAt)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>


                                            <div className="chat-center-bottom">
                                                <input onChange={(e) => setInput(e.target.value)} value={input} type="text" placeholder="Send a message" />
                                                <div className="chat-send-controls">
                                                    <input type="file" id="image" accept="image/png, image/jpeg" hidden style={{ color: "black" }} />
                                                    <label htmlFor="image" style={{ color: "black" }}>
                                                        <BsFillImageFill style={{ color: "black" }} />
                                                    </label>
                                                    <BsFillSendFill style={{ color: "black" }} onClick={sendMessage} />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="chat-not-available" style={{ width: "100%", height: "80vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px" }}>
                                            <IoChatboxEllipses style={{ color: "blue", fontSize: "60px" }} />
                                            <p style={{ color: "black", font: "40px" }}>Chat Anywhere, Anytime</p>
                                        </div>
                                    )
                                }
                            </div>
                            <div className={`chat-right ${profileVisible ? "profile-visible" : "profile-invisible"}`}>
                                <div className="right-header">
                                    {/* {image ? (
                                        <img src={imageUrl} alt="profile" style={{ maxWidth: '50px' }} />
                                    ) : ( */}
                                    <CgProfile size={50} style={{ color: "white" }} />
                                    {/* )} */}

                                    <div className="chat-right-header">
                                        <h3 style={{ color: "white" }}>
                                            {isUserOnline(chatUser?.userData?.lastSeen) && <span className="green-dot"></span>}
                                            {chatUser?.userData?.name}
                                        </h3>                                    </div>
                                    <p className="description" style={{ color: "white" }}>
                                        {chatUser?.userData?.bio}
                                    </p>
                                </div>

                                <hr className="horizontal-line" />

                                <div className="chat-right-center-media">
                                    <h2 style={{ color: "white" }}>Media</h2>
                                    <div className="images">
                                        <h4 style={{ color: "white" }}>There is no media image available</h4>
                                    </div>
                                </div>

                                <button className="logout-btn" onClick={() => logout()}>Logout</button>
                            </div>
                        </div>
                    )
                }
            </div>
        </>
    )
}

export default Chat;