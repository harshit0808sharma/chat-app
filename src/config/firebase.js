import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, setDoc, doc, query, where, getDocs, collection } from "firebase/firestore";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyAs_KPSpgesQI4t5egt7ikVW85IdhV3rlE",
  authDomain: "chat-app-hs-a68fe.firebaseapp.com",
  projectId: "chat-app-hs-a68fe",
  storageBucket: "chat-app-hs-a68fe.appspot.com", // ✅ This is the correct domain
  messagingSenderId: "170094407494",
  appId: "1:170094407494:web:6b88136c9ddc54de627f47"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async (username, email, password) => {
    try{
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;
        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            username: username.toLowerCase(),
            email: email,
            name: "",
            bio: "Hey, There i am using chat app",
            lastSeen: Date.now(),
        });
        await setDoc(doc(db, "chats", user.uid), {
            chatsData: []
        });
    } catch (error){
        console.error(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));
    }
}

const login = async (email, password) => {
    try{
        await signInWithEmailAndPassword(auth, email, password)
    } catch (error){
        console.error(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));
    }
}

const logout = async () => {
    try{
        await signOut(auth)
    } catch(error){
        console.error(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));
    }
}

const resetPass = async (email) => {
    if(!email){
        toast.error("Enter your email");
        return null;
    }
    try{
        const userRef = collection(db, 'users');
        const q = query(userRef, where("email", "==", email));
        const querySnap = await getDocs(q);
        if(!querySnap.empty){
            await sendPasswordResetEmail(auth, email);
            toast.success("Reset Email Sent")
        }else{
            toast.error("Email doesn't exists");
        }
    }catch(error){
        console.error(error);
        toast.error(error.message);
    }
}

export { signup, login, logout, auth, db, resetPass }