const SideBar = () => (
  <aside className="flex w-13 shrink-0 flex-col items-center gap-2 border-r border-gray-border bg-white px-3 py-5">
    {" "}
    {sidebarItems.map((item) => {
      const isActive = item.id === activeView;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => setActiveView(item.id)}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
            isActive ? "bg-light-gray" : "bg-transparent hover:bg-light-gray"
          }`}
          aria-label={`sidebar-${item.id}`}
        >
          <img src={item.icon} alt="" className="h-5 w-5" />
        </button>
      );
    })}
  </aside>
);

export default SideBar;
