import { NavLink, Outlet } from "react-router-dom";

export default function ProfilesPage() {
  const profiles = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ];
  return (
    <div className="flex gap-10 min-w-full">
      <div className="flex flex-col gap-2 items-start">
        {profiles.map((profile) => (
          <NavLink
            key={profile.id}
            to={`/profiles/${profile.id}`}
            className={({ isActive }) => {
              return isActive ? "bg-red-200" : "";
            }}
          >
            Profile of {profile.name}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
