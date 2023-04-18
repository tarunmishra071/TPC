import "./SidebarOptionHeader.css";

function SidebarOptionHeader({ Icon, title, onClickHandler }) {
  return (
    <div className="sidebarOption" onClick={onClickHandler}>
      {Icon && <Icon className="sidebarOption__icon" />}
      <h3>{title}</h3>
    </div>
  );
}

export default SidebarOptionHeader;
