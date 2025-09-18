import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PenguinCircle from "../assets/pgc.svg";
import Penguin from "../assets/Penguin.svg";
import face from "../assets/face.svg";
import pingu from "../assets/pingu.svg";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    pathname === to
      ? "bg-white/25 text-white shadow-sm"
      : "hover:bg-white/10 hover:text-white/95";

  const linkBase =
    "px-4 py-2 rounded-xl transition text-sm md:text-base font-semibold text-white/90";

  return (
    <div className="w-full px-4 my-4">
      {/* Desktop / Tablet NAV — wide pill */}
      <nav
        className="
          hidden md:flex items-center justify-between
          max-w-6xl mx-auto
          px-8 py-3 rounded-full
          bg-gradient-to-br from-violet-600/30 to-indigo-600/30
          border border-white/25 shadow-[0_8px_30px_rgba(31,41,55,0.18)]
          backdrop-saturate-150
        "
      >
        {/* Left: logo + links */}
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-inner ring-1 ring-white/60">
            <img src={face} alt="Pebbl" className="h-7 w-7" />
          </div>

          <Link to="/home" className={`${linkBase} ${isActive("/home")}`}>
            Home
          </Link>
          <Link to="/logbook" className={`${linkBase} ${isActive("/logbook")}`}>
            LogBook
          </Link>
          <Link to="/trends" className={`${linkBase} ${isActive("/trends")}`}>
            Trends
          </Link>
          <Link
            to="/meal-planner"
            className={`${linkBase} ${isActive("/meal-planner")}`}
          >
            Meal Planner
          </Link>
          <Link to="/goals" className={`${linkBase} ${isActive("/goals")}`}>
            Goals
          </Link>
        </div>

        {/* Right CTA */}
        <Link
          to="/signin"
          className="
            flex items-center gap-2 px-5 py-2 rounded-full font-semibold
            text-[#2E1065]
            bg-gradient-to-r from-[#FDE68A]/90 via-[#FBCFE8]/90 to-[#DDD6FE]/90
            border border-white/60 shadow-md
            hover:shadow-lg hover:scale-[1.03] active:scale-[0.98]
            transition
          "
        >
          Ask Pebbl
          <img src={pingu} alt="Penguin" className="h-6 w-6" />
        </Link>
      </nav>

      {/* Mobile — pill container */}
      <nav
        className="
          md:hidden mx-auto max-w-sm
          rounded-full px-4 py-2
          bg-gradient-to-br from-violet-600/30 to-indigo-600/30
          border border-white/25 shadow-[0_8px_30px_rgba(31,41,55,0.18)]
          backdrop-saturate-150
        "
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow-inner ring-1 ring-white/60">
            <img src={Penguin} alt="Pebbl" className="h-6 w-6" />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white/90 p-2 rounded-xl hover:bg-white/10 transition"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="px-1 pt-2 pb-2 space-y-2">
            <Link to="/home" className={`block ${linkBase} ${isActive("/home")}`}>
              Home
            </Link>
            <Link to="/logbook" className={`block ${linkBase} ${isActive("/logbook")}`}>
              LogBook
            </Link>
            <Link to="/trends" className={`block ${linkBase} ${isActive("/trends")}`}>
              Trends
            </Link>
            <Link
              to="/meal-planner"
              className={`block ${linkBase} ${isActive("/meal-planner")}`}
            >
              Meal Planner
            </Link>
            <Link to="/goals" className={`block ${linkBase} ${isActive("/goals")}`}>
              Goals
            </Link>

            <Link
              to="/signin"
              className="
                w-full flex items-center justify-center gap-2 mt-1 px-4 py-2 rounded-full font-semibold
                text-[#2E1065]
                bg-gradient-to-r from-[#FDE68A]/90 via-[#FBCFE8]/90 to-[#DDD6FE]/90
                border border-white/60 shadow-md hover:shadow-lg hover:scale-[1.02] transition
              "
            >
              Ask Pebbl
              <img src={PenguinCircle} alt="Penguin" className="w-5 h-5" />
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;