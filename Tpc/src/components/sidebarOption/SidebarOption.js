import "./SidebarOption.css";
import { useHistory } from "react-router-dom";
import { Avatar } from "@mui/material";

function SidebarOption({
  Icon,
  title,
  sub,
  id,
  addChannelOption,
  user,
  avatar,
  online,
}) {
  const history = useHistory();
  const selectChannel = () => {
    if (id) {
      if (user) {
        history.push(`/users/${id}`);
      } else {
        history.push(`/channels/${id}`);
      }
    } else {
      history.push(title);
    }
  };

  const addChannel = () => {
    history.push("/add/channel");
  };

  const userPresenceClass = online ? "user__online" : "user__offline";
  return (
    <div
      className={`sidebarOption ${online} ${sub}`}
      onClick={addChannelOption ? addChannel : selectChannel}
    >
      {avatar ? (
        <div className="sidebarAvatar">
          <Avatar src={avatar} alt={title} />
          <Icon className={userPresenceClass} />
        </div>
      ) : (
        Icon && <Icon className="sidebarOption__icon" />
      )}
      {Icon ? (
        <h3>{title}</h3>
      ) : (
        <h3 className="sidebarOption__channel">
          <span className="sidebarOption__hash">#</span> {title}
        </h3>
      )}
    </div>
  );
}

export default SidebarOption;
