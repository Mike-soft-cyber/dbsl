import React from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ userData }) {
  const navigate = useNavigate();

  return (
    <nav className="bg-teal-900 text-white flex flex-column justify-between items-center px-4 py-2">
      <h1 className="font-bold">DBSL</h1>
      <div>
        <h2>{userData?.firstName + " " + userData?.lastName}</h2>
        <h3>{userData?.role}</h3>
      </div>
      <button onClick={() => navigate("/login")} className="flex flex-column gap-2 cursor-pointer bg-green-500 rounded hover:bg-green-600 p-1">
        <LogOut size={24} />Logout
      </button>
    </nav>
  );
}
