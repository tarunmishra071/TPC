import "./Login.css";
import { Button } from "@material-ui/core";
import { auth, provider } from "../../firebase";
import { CometChat } from "@cometchat-pro/chat";
import { cometChat } from "../../app.config";
import { useState } from "react";
import gaoQiQiang from "../../img/gaoqiqiang.jpg";
import daSao from "../../img/dasao.jpeg";

const userData = {
  uid: "8787",
  name: "Suraj Verma",
};

const testUser = new CometChat.User(userData.uid);

function Login() {
  const [loading, setLoading] = useState(false);

  const signIn = () => {
    setLoading(true)
    auth
      .signInWithPopup(provider)
      .then((res) => loginCometChat(res.user))
      .catch((error) => {
        setLoading(false)
        alert(error.message)
      })
  };

  const loginCometChat = (data) => {
    const authKey = cometChat.AUTH_KEY;

    CometChat.login(data.uid, authKey)
      .then((userData) => {
        console.log("login user", userData);
        localStorage.setItem("user", JSON.stringify(userData));
        window.location.href = "/";
        console.log("login successfully", userData);
        setLoading(false);
      })
      .catch((error) => {
        if (error.code === "ERR_UID_NOT_FOUND") {
          signUpWithCometChat(data);
        } else {
          console.log(error);
          setLoading(false);
          alert(error.message);
        }
      });
  };

  const signUpWithCometChat = (data) => {
    const authKey = cometChat.AUTH_KEY;
    const user = new CometChat.User(data.uid);

    user.setName(data.name);
    user.setAvatar(data.avatar);

    CometChat.createUser(user, authKey)
      .then(() => {
        setLoading(false);
        alert("You are now signed up, click the button again to login");
      })
      .catch((error) => {
        setLoading(false);
        alert(error.message);
      });
  };

  return (
    <div className="login">
      <div className="login__container">
        <img src={"/logo.png"} alt="Slack Logo" />

        <h4>Sign in to CometChat</h4>
        <p>cometchat.slack.com</p>
        <div className="third_party_login">
          <Button className="google" onClick={signIn}>
            <img src={"/icons8-google-48.png"} alt="Google Logo Icon" />
            {!loading ? "Continue With Google" : <div id="loading"></div>}
          </Button>
          <Button className="apple" onClick={() => loginCometChat(userData)}>
            <img src={"/icons8-apple-logo-30.png"} alt="Apple Logo Icon" />
            {!loading ? "Continue With Apple" : <div id="loading"></div>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Login;
