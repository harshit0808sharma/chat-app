// import { cichat } from "react-icons/bi";

import { useState } from "react";
import { IoChatboxEllipses } from "react-icons/io5";
import { signup, login, resetPass } from "../config/firebase";
import img from '../assets/images/chat.jpg'

const Login = () => {

    const [checklogin, setCheckLogin] = useState(false);
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const onSubmitHandler = (event) => {
        event.preventDefault();
        if (checklogin) {
            signup(userName, email, password);
            // console.log("hii");
        } else {
            login(email, password);
        }
    }
    // console.log(checklogin);

    return (
        <>
            <div className="login-container">
                <div className="login-page">
                    <div className="login-left">
                        <h1 style={{color: "black"}}><IoChatboxEllipses /></h1>
                        <h2 style={{color: "black"}}>Chat App</h2>
                        <h3 style={{color: "black"}}>Hello, Friends!</h3>
                        {/* <img src={img} alt="chat image" /> */}
                    </div>
                    <div className="login-right">
                        <h1 style={{color: "black"}}>{checklogin ? "Sign up" : "Login"}</h1>
                        <form onSubmit={onSubmitHandler}>
                            {checklogin && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        name="userName"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        id="username"
                                        required
                                        style={{color: "black"}}
                                    />
                                    <label style={{color: "black"}} htmlFor="username">Username</label>
                                </>
                            )}
                            <input
                                type="email"
                                placeholder="Your email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                id="email"
                                required
                                style={{color: "black"}}
                            />
                            <label style={{color: "black"}} htmlFor="email">Email</label>
                            <input
                                type="password"
                                placeholder="Password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                id="password"
                                required
                                style={{color: "black"}}
                            />
                            <label style={{color: "black"}} htmlFor="password">Password</label>
                            <button style={{color: "black"}} type="submit">{checklogin ? "Create Account" : "Login"}</button>

                            <div className="login-terms">
                                <input style={{color: "black"}} type="checkbox" />
                                <p  style={{ color: "black" }}>Agree to the Terms of Use & Privacy Policy</p>
                            </div>

                            <div className="login-forgot">
                                <p className="login-toggle">
                                    {checklogin ? "Already have an account?" : "Create an account?"}{" "}
                                    <span
                                        style={{ color: "blue", cursor: "pointer" }}
                                        onClick={() => setCheckLogin(!checklogin)}
                                    >
                                        Click here
                                    </span>
                                </p>
                            </div>

                            {!checklogin && (
                                <p className="login-toggle" style={{ color: "black" }}>
                                    Forget Password?{" "}
                                    <span
                                        style={{ color: "red", cursor: "pointer" }}
                                        onClick={() => resetPass(email)}
                                    >
                                        Reset here
                                    </span>
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login;