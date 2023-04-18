import "./Sidebar.css";
import { useState, useEffect } from "react";
import { auth } from "../../firebase";
import SidebarOption from "../sidebarOption/SidebarOption";
import SidebarOptionHeader from "../sidebarOptionHeader/SidebarOptionHeader";
import CreateIcon from "@material-ui/icons/Create";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import InsertCommentIcon from "@material-ui/icons/InsertComment";
import AlternateEmailIcon from "@material-ui/icons/AlternateEmail";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import AddIcon from "@material-ui/icons/Add";
import { CometChat } from "@cometchat-pro/chat";
import { Link, useHistory } from "react-router-dom";

function Sidebar() {
  const [channels, setChannels] = useState([]);
  const [user, setUser] = useState(null);
  const [dms, setDms] = useState([]);
  const [channelExpanded, setChannelExpanded] = useState(true);
  const [dmExpanded, setDmExpanded] = useState(true);
  const history = useHistory();

  const getDirectMessages = () => {
    const limit = 10;
    const usersRequest = new CometChat.UsersRequestBuilder()
      .setLimit(limit)
      //   .friendsOnly(true)
      .build();

    usersRequest
      .fetchNext()
      .then((userList) => {
        setDms(userList);
        console.log("userList", userList);
      })
      .catch((error) => {
        console.log("User list fetching failed with error:", error);
      });
    // let conversationType = "user";
    // let conversationRequest = new CometChat.ConversationsRequestBuilder()
    //   .setLimit(limit)
    //   .setConversationType(conversationType)
    //   .build();
    // conversationRequest.fetchNext().then(
    //   (conversationList) => {
    //     console.log("Conversation list received:", conversationList);
    //     setDms(conversationList);
    //   },
    //   (error) => {
    //     console.log("Conversation list fetching failed with error:", error);
    //   }
    // );
  };

  const getChannels = () => {
    const limit = 30;
    const groupsRequest = new CometChat.GroupsRequestBuilder()
      .setLimit(limit)
      .joinedOnly(true)
      .build();

    groupsRequest
      .fetchNext()
      .then((groupList) => setChannels(groupList))
      .catch((error) => {
        console.log("Groups list fetching failed with error", error);
      });
  };

  const logOut = () => {
    auth
      .signOut()
      .then(() => {
        localStorage.removeItem("user");
        history.push("/login");
      })
      .catch((error) => console.log(error.message));
  };

  useEffect(() => {
    const data = localStorage.getItem("user");
    setUser(JSON.parse(data));

    getChannels();
    getDirectMessages();
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__info">
          <h2>
            <Link to="/">MY Chat</Link>
          </h2>
          <h3>
            <FiberManualRecordIcon />
            {user?.name}
          </h3>
        </div>
        <CreateIcon />
      </div>
      <div className="sidebar__options">
        <SidebarOption Icon={InsertCommentIcon} title="Thread" />
        <SidebarOption Icon={AlternateEmailIcon} title="Mentions & Reactions" />
        <SidebarOption Icon={MoreVertIcon} title="More" />
        <hr />
        <SidebarOptionHeader
          Icon={channelExpanded ? ArrowDropDownIcon : ArrowRightIcon}
          title="Channels"
          onClickHandler={() => {
            setChannelExpanded(!channelExpanded);
          }}
        />
        <hr />
        {channelExpanded
          ? channels.map((channel) =>
              channel.type === "private" ? (
                <SidebarOption
                  Icon={LockOutlinedIcon}
                  title={channel.name}
                  id={channel.guid}
                  key={channel.guid}
                  sub="sidebarOption__sub"
                />
              ) : (
                <SidebarOption
                  title={channel.name}
                  id={channel.guid}
                  key={channel.guid}
                  sub="sidebarOption__sub"
                />
              )
            )
          : null}

        <SidebarOption
          Icon={AddIcon}
          title="Add Channel"
          sub="sidebarOption__sub"
          addChannelOption
        />
        <hr />
        <SidebarOptionHeader
          Icon={dmExpanded ? ArrowDropDownIcon : ArrowRightIcon}
          title="Direct Messages"
          onClickHandler={() => setDmExpanded(!dmExpanded)}
        />
        <hr />
        {dmExpanded
          ? dms.map((dm) => (
              <SidebarOption
                Icon={FiberManualRecordIcon}
                title={dm.name}
                id={dm.uid}
                key={dm.uid}
                sub="sidebarOption__sub sidebarOption__color"
                user
                avatar={dm.avatar}
                online={dm.status === "online" ? "isOnline" : ""}
              />
            ))
          : null}
      </div>

      <button className="sidebar__logout" onClick={logOut}>
        Logout
      </button>
    </div>
  );
}

export default Sidebar;
