import "./User.css";
import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import StarBorderOutlinedIcon from "@material-ui/icons/StarBorderOutlined";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import CallIcon from "@material-ui/icons/Call";
import CallEndIcon from "@material-ui/icons/CallEnd";
import PersonAddOutlinedIcon from "@material-ui/icons/PersonAddOutlined";
import PersonAddDisabledIcon from "@material-ui/icons/PersonAddDisabled";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import SearchIcon from "@material-ui/icons/Search";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import CloseIcon from "@material-ui/icons/Close";
import { CometChat } from "@cometchat-pro/chat";
import { cometChat } from "../../app.config";
import { Avatar, Button } from "@material-ui/core";
import MessageInput from "../../components/message/MessageInput";
import MessageGroup from "../../components/message/MessageGroup";
import IconButton from "@mui/material/IconButton";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { storage } from "../../firebase";

function User() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [keyword, setKeyword] = useState(null);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [calling, setCalling] = useState(false);
  const [sessionID, setSessionID] = useState("");
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isOutgoingCall, setIsOutgoingCall] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const messageInputRef = useRef(null);

  const togglerDetail = () => {
    setToggle(!toggle);
  };

  const findUser = (e) => {
    e.preventDefault();
    searchTerm(keyword);
  };

  const searchTerm = (keyword) => {
    setSearching(true);
    const limit = 30;
    const usersRequest = new CometChat.UsersRequestBuilder()
      .setLimit(limit)
      .setSearchKeyword(keyword)
      .build();

    usersRequest
      .fetchNext()
      .then((userList) => {
        setUsers(userList);
        setSearching(false);
      })
      .catch((error) => {
        console.log("User list fetching failed with error:", error);
        setSearching(false);
      });
  };

  const getUser = (UID) => {
    CometChat.getUser(UID)
      .then((user) => setUser(user))
      .catch((error) => {
        console.log("User details fetching failed with error:", error);
      });
  };

  const getMessages = (uid) => {
    const limit = 50;

    const messagesRequest = new CometChat.MessagesRequestBuilder()
      .setLimit(limit)
      .setUID(uid)
      .hideDeletedMessages(true)
      .build();

    messagesRequest
      .fetchPrevious()
      .then((msgs) => {
        setMessages(msgs.filter((m) => m.type === "text"));
        scrollToEnd();
      })
      .catch((error) =>
        console.log("Message fetching failed with error:", error)
      );
  };

  const getMessageGroups = () => {
    const messageGroups = messages.reduce((groups, message) => {
      const date = formatDate(new Date(message.sentAt * 1000));
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});
    return Object.keys(messageGroups).map((date) => {
      return {
        date,
        messages: messageGroups[date],
        id: "mg-" + messageGroups[date][0].id,
      };
    });
  };

  function formatDate(date) {
    let d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }
  const listenForMessage = (listenerID) => {
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message) => {
          setMessages((prevState) => [...prevState, message]);
          scrollToEnd();
        },
      })
    );
  };

  const listenForCall = (listnerID) => {
    CometChat.addCallListener(
      listnerID,
      new CometChat.CallListener({
        onIncomingCallReceived(call) {
          console.log("Incoming call:", call);
          // Handle incoming call
          setSessionID(call.sessionId);
          setIsIncomingCall(true);
          setCalling(true);
        },
        onOutgoingCallAccepted(call) {
          console.log("Outgoing call accepted:", call);
          // Outgoing Call Accepted
          startCall(call);
        },
        onOutgoingCallRejected(call) {
          console.log("Outgoing call rejected:", call);
          // Outgoing Call Rejected
          setIsIncomingCall(false);
          setIsOutgoingCall(false);
          setCalling(false);
        },
        onIncomingCallCancelled(call) {
          console.log("Incoming call calcelled:", call);
          setIsIncomingCall(false);
          setIsIncomingCall(false);
          setCalling(false);
        },
      })
    );
  };

  const listFriends = () => {
    const limit = 10;
    const usersRequest = new CometChat.UsersRequestBuilder()
      .setLimit(limit)
      .friendsOnly(true)
      .build();

    usersRequest
      .fetchNext()
      .then((userList) => setUsers(userList))
      .catch((error) => {
        console.log("User list fetching failed with error:", error);
      });
  };

  const remFriend = (uid, fid) => {
    if (window.confirm("Are you sure?")) {
      const url = `https://api-us.cometchat.io/v2.0/users/${uid}/friends`;
      const options = {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          appId: cometChat.APP_ID,
          apiKey: cometChat.REST_KEY,
        },
        body: JSON.stringify({ friends: [fid] }),
      };

      fetch(url, options)
        .then(() => {
          const index = users.findIndex((user) => user.uid === fid);
          users.splice(index, 1);
          alert("Friend Removed successfully!");
        })
        .catch((err) => console.error("error:" + err));
    }
  };

  const addFriend = (uid) => {
    const user = JSON.parse(localStorage.getItem("user"));

    const url = `https://api-us.cometchat.io/v2.0/users/${user.uid}/friends`;
    const options = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        appId: cometChat.APP_ID,
        apiKey: cometChat.REST_KEY,
      },
      body: JSON.stringify({ accepted: [uid] }),
    };
    fetch(url, options)
      .then(() => {
        setToggle(false);
        alert("Added as friend successfully");
      })
      .catch((err) => console.error("error:" + err));
  };

  const scrollToEnd = () => {
    const elmnt = document.getElementById("messages-container");
    elmnt.scrollTop = elmnt.scrollHeight;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage(id, message);
  };

  const sendMessage = (uid, message) => {
    const receiverID = uid;
    const messageText = message;
    const receiverType = CometChat.RECEIVER_TYPE.USER;
    const textMessage = new CometChat.TextMessage(
      receiverID,
      messageText,
      receiverType
    );

    CometChat.sendMessage(textMessage)
      .then((message) => {
        setMessages((prevState) => [...prevState, message]);
        setMessage("");
        messageInputRef.current.clearMessage();
        scrollToEnd();
      })
      .catch((error) =>
        console.log("Message sending failed with error:", error)
      );
  };

  const initiateCall = () => {
    const receiverID = id; //The uid of the user to be called
    const callType = CometChat.CALL_TYPE.VIDEO;
    const receiverType = CometChat.RECEIVER_TYPE.USER;

    const call = new CometChat.Call(receiverID, callType, receiverType);

    CometChat.initiateCall(call)
      .then((outGoingCall) => {
        console.log("Call initiated successfully:", outGoingCall);
        // perform action on success. Like show your calling screen.
        setSessionID(outGoingCall.sessionId);
        setIsOutgoingCall(true);
        setCalling(true);
      })
      .catch((error) => {
        console.log("Call initialization failed with exception:", error);
      });
  };

  const startCall = (call) => {
    const sessionId = call.sessionId;
    const callType = call.type;
    const callSettings = new CometChat.CallSettingsBuilder()
      .setSessionID(sessionId)
      .enableDefaultLayout(true)
      .setIsAudioOnlyCall(callType === "audio" ? true : false)
      .build();

    setSessionID(sessionId);
    setIsOutgoingCall(false);
    setIsIncomingCall(false);
    setCalling(false);
    setIsLive(true);

    CometChat.startCall(
      callSettings,
      document.getElementById("callScreen"),
      new CometChat.OngoingCallListener({
        onUserJoined: (user) => {
          /* Notification received here if another user joins the call. */
          console.log("User joined call:", user);
          /* this method can be use ao display message or perform any actions if someone joining the call */
        },
        onUserLeft: (user) => {
          /* Notification received here if another user left the call. */
          console.log("User left call:", user);
          /* this method can be use to display message or perform any actions if someone leaving the call */
        },
        onUserListUpdated: (userList) => {
          console.log("user list:", userList);
        },
        onCallEnded: (call) => {
          /* Notification received here if current ongoing call is ended. */
          console.log("Call ended:", call);
          /* hiding/closing the call screen can be done here. */
          setIsIncomingCall(false);
          setIsOutgoingCall(false);
          setCalling(false);
          setIsLive(false);
        },
        onError: (error) => {
          console.log("Error :", error);
          /* hiding/closing the call screen can be done here. */
        },
        onMediaDeviceListUpdated: (deviceList) => {
          console.log("Device List:", deviceList);
        },
      })
    );
  };

  const acceptCall = (sessionID) => {
    CometChat.acceptCall(sessionID)
      .then((call) => {
        console.log("Call accepted successfully:", call);
        // start the call using the startCall() method
        startCall(call);
      })
      .catch((error) => {
        console.log("Call acceptance failed with error", error);
        // handle exception
      });
  };

  const rejectCall = (sessionID) => {
    const status = CometChat.CALL_STATUS.REJECTED;

    CometChat.rejectCall(sessionID, status)
      .then((call) => {
        console.log("Call rejected successfully", call);
        setCalling(false);
        setIsIncomingCall(false);
        setIsOutgoingCall(false);
        setIsLive(false);
      })
      .catch((error) => {
        console.log("Call rejection failed with error:", error);
      });
  };

  const endCall = (sessionID) => {
    CometChat.endCall(sessionID)
      .then((call) => {
        console.log("call ended", call);
        setCalling(false);
        setIsIncomingCall(false);
        setIsIncomingCall(false);
      })
      .catch((error) => {
        console.log("error", error);
      });
  };
  /**
   * this endpoint is buggy, it always return the same avatar
   * @param {avatar} base64
   */
  const uploadToCometChat = async (base64) => {
    console.log("uploading avatar");
    try {
      const response = await CometChat.callExtension(
        "avatar",
        "POST",
        "v1/upload",
        {
          avatar: base64,
        }
      );
      // update local user object
      setUser((prevState) => ({ ...prevState, avatar: response.avatarURL }));
      console.log("response", response);
      let localStorageUser = JSON.parse(localStorage.getItem("user"));
      localStorageUser.avatar = response.avatarURL;
      localStorage.setItem("user", JSON.stringify(localStorageUser));
    } catch (error) {
      console.log(error);
    }
  };

  const uploadAvatar = (e) => {
    const storageRef = storage.ref();

    const file = e.target.files[0];
    if (!file) return;
    const metadata = {
      contentType: file.type,
    };

    const uploadTask = storageRef
      .child("images/" + file.name)
      .put(file, metadata);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
          default:
            break;
        }
      },
      (error) => {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
          case "storage/unauthorized":
            // User doesn't have permission to access the object
            break;

          case "storage/canceled":
            // User canceled the upload
            break;

          case "storage/unknown":
            // Unknown error occurred, inspect error.serverResponse
            break;
          default:
            break;
        }
      },
      () => {
        // Upload completed successfully, now we can get the download URL
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          console.log("File available at", downloadURL);
          // update user avatar in comet chat
          // request builder
          const authKey = cometChat.AUTH_KEY;
          const user = new CometChat.User(
            JSON.parse(localStorage.getItem("user"))
          );
          user.setAvatar(downloadURL);
          CometChat.updateUser(user, authKey).then(
            (user) => {
              console.log("User details updated successfully", user);
              // update local user object
              setUser((prevState) => ({ ...prevState, avatar: user.avatar }));
              let localStorageUser = JSON.parse(localStorage.getItem("user"));
              localStorageUser.avatar = user.avatar;
              localStorage.setItem("user", JSON.stringify(localStorageUser));
            },
            (error) => {
              console.log(
                "User details updation failed with exception:",
                error
              );
            }
          );
        });
      }
    );

    //get base64 encoded image
    // const reader = new FileReader();
    // reader.readAsDataURL(file);
    // reader.onload = () => {
    //   const base64 = reader.result;
    //   uploadToCometChat(base64);
    // };
  };

  const uploadAvatarStyle = {
    position: "relative",
    top: "208px",
    right: "-47px",
    padding: " 5px",
    backgroundColor: "lightgrey",
    color: "black",
  };
  useEffect(() => {
    getUser(id);
    getMessages(id);
    listenForMessage(id);
    listenForCall(id);
    listFriends(id);

    setCurrentUser(JSON.parse(localStorage.getItem("user")));
  }, [id]);
  const messageGroups = getMessageGroups();
  return (
    <div className="user">
      {calling ? (
        <div className="callScreen">
          <div className="callScreen__container">
            <div className="call-animation">
              <img
                className="img-circle"
                src={user?.avatar}
                alt=""
                width="135"
              />
            </div>
            {isOutgoingCall ? (
              <h4>Calling {user?.name}</h4>
            ) : (
              <h4>{user?.name} Calling</h4>
            )}

            {isIncomingCall ? (
              <div className="callScreen__btns">
                <Button onClick={() => acceptCall(sessionID)}>
                  <CallIcon />
                </Button>
                <Button onClick={() => rejectCall(sessionID)}>
                  <CallEndIcon />
                </Button>
              </div>
            ) : (
              <div className="callScreen__btns">
                <Button onClick={() => endCall(sessionID)}>
                  <CallEndIcon />
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        ""
      )}
      <div className="user__chat">
        <div className="user__header">
          <div className="user__headerLeft">
            <h4 className="user__userName">
              <strong className={user?.status === "online" ? "isOnline" : ""}>
                <FiberManualRecordIcon />
                {user?.name}
              </strong>
              <StarBorderOutlinedIcon />
            </h4>
          </div>
          <div className="user__headerRight">
            <CallIcon onClick={initiateCall} />
            <InfoOutlinedIcon onClick={togglerDetail} />
          </div>
        </div>

        <div id="messages-container" className="user__messages">
          {messageGroups.map((messageGroup) => {
            return (
              <MessageGroup
                title={messageGroup.date}
                messages={messageGroup.messages}
                key={messageGroup.id}
              />
            );
          })}
        </div>
        <MessageInput
          ref={messageInputRef}
          placeholder={`Message ${user?.name.toLowerCase()}`}
          onMessageChange={(newValue) => setMessage(newValue)}
          onMessageSubmit={(e) => onSubmit(e)}
        />
      </div>

      <div className={`user__details ${!toggle ? "hide__details" : ""}`}>
        <div className="user__header">
          <div className="user__headerLeft">
            <h4 className="user__userName">
              <strong>Details</strong>
            </h4>
          </div>
          <div className="user__headerRight">
            <CloseIcon onClick={togglerDetail} />
          </div>
        </div>
        <div className="user__detailsBody">
          <div className="user__detailsIdentity">
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="label"
              sx={uploadAvatarStyle}
            >
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={(e) => {
                  uploadAvatar(e);
                }}
              />
              <PhotoCamera />
            </IconButton>
            <div className="avatar__container">
              <img
                className="user__avatar"
                src={user?.avatar}
                alt={user?.name}
              />
            </div>

            {/* <input
              className="upload__avatar"
              type="file"
              accept="image/jpeg, image/png, image/jpg"
              onChange={(e) => uploadAvatar(e)}
            /> */}
            <h4 className={user?.status === "online" ? "isOnline" : ""}>
              {user?.name}
              <FiberManualRecordIcon />
            </h4>
          </div>
          <div className="user__detailsActions">
            <span>
              <PersonAddOutlinedIcon onClick={() => addFriend(user?.uid)} />
              Add
            </span>
            <span>
              <SearchIcon />
              Find
            </span>
            <span>
              <CallIcon onClick={initiateCall} />
              Call
            </span>
            <span>
              <MoreHorizIcon />
              More
            </span>
          </div>
          <form onSubmit={(e) => findUser(e)} className="channel__detailsForm">
            <input
              placeholder="Search for a user"
              onChange={(e) => setKeyword(e.target.value)}
              required
            />
            <Button onClick={(e) => findUser(e)}>
              {!searching ? "Find" : <div id="loading"></div>}
            </Button>
          </form>
          <hr />
          <div className="channel__detailsMembers">
            <h4>Friends</h4>
            {users.map((user) => (
              <div
                key={user?.uid}
                className={`available__member ${user?.status === "online" ? "isOnline" : ""
                  }`}
              >
                <Avatar src={user?.avatar} alt={user?.name} />
                <Link to={`/users/${user?.uid}`}>{user?.name}</Link>
                <FiberManualRecordIcon />
                {currentUser?.uid.toLowerCase() === id.toLowerCase() ? (
                  <PersonAddDisabledIcon
                    onClick={() => remFriend(id, user?.uid)}
                  />
                ) : (
                  ""
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {isLive ? <div id="callScreen"></div> : ""}
    </div>
  );
}

export default User;
