import { onAuthStateChanged } from "firebase/auth";
import { useContext, useEffect, useState } from "react"
import { CgProfile } from "react-icons/cg"
import { auth, db } from "../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const Profile = () => {
  const navigate = useNavigate();
  const [name, setname] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  // const [prevImage, setPrevImage] = useState("");
  const { setUserData, image, setImage } = useContext(AppContext)

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      const docRef = doc(db, 'users', uid);

      await updateDoc(docRef, {
        name: name,
        bio: bio
      });
      const snap = await getDoc(docRef);
      setUserData(snap.data());
      navigate('/chat'); // Redirect if needed
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) {
            setname(data.name);
            if (data.bio) {
              setBio(data.bio);
            }
            // Name exists, you can redirect to chat or dashboard if you want here
            // For example: navigate('/chat');
          } else {
            // Name doesn't exist, redirect to profile page to update it
            navigate('/profile');
          }
        } else {
          // No document, probably treat same as no name
          navigate('/profile');
        }
      } else {
        navigate('/');
      }
    });
  }, []);






  return (
    <>
      <div className="profile-page">
        <div className="profile-page-inner">
          <div className="profile-page-left">
            {
              image ? <img src={URL.createObjectURL(image)} alt="random" /> : <CgProfile style={{color: "black", fontSize: "150px"}}/>
            }
            <h2 style={{color: "black"}}>Name: {name}</h2>
            <p style={{color: "black"}}>Bio: {bio}</p>
          </div>
          <div className="profile-page-right">
            <div className="profile-page-right-inner">
              <form onSubmit={profileUpdate} className="profile-form">
                <h1 style={{color: "black"}}>User Profile</h1>
                <div>
                  <input style={{color: "black"}} type="file" onChange={(e) => setImage(e.target.files[0])} id="image" hidden />
                  <label style={{color: "black"}} htmlFor="image">
                    {
                      image ? <img src={URL.createObjectURL(image)} alt="random" /> : <CgProfile style={{color: "black", fontSize: "50px"}}/>
                    }
                  </label>
                  <p style={{color: "black"}}>Upload profile image</p>
                </div>
                <input style={{color: "black"}} type="text" placeholder="Your Name" required name="name" value={name} onChange={(e) => setname(e.target.value)} />
                <textarea style={{color: "black"}} id="" placeholder="Your Bio" required name="bio" value={bio} onChange={(e) => setBio(e.target.value)}></textarea>
                <button style={{color: "black"}} type="submit">Save</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Profile