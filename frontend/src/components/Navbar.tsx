import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PenguinCircle from '../assets/pgc.svg';
import Penguin from '../assets/Penguin.svg'
import face from '../assets/face.svg'
import pingu from '../assets/pingu.svg'

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="w-full px-4 my-4">
      {/* Desktop Navbar */}
      <nav className="hidden lg:flex items-center justify-between px-6 py-3 bg-gradient-to-b from-[#067BC2] to-[#84BCDA] rounded-full shadow-xl w-fit mx-auto">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-xl font-semibold"><img src={face} alt="" /></span>
          </div>
          <Link to="/home" className="text-white font-medium">Home</Link>
          <Link to="/logbook" className="text-white font-medium">LogBook</Link>
          <Link to="/trends" className="text-white font-medium">Trends</Link>
          <Link to="/meal-planner" className="text-white font-medium">Meal Planner</Link>
          <Link to="/goals" className="text-white font-medium">Goals</Link>
        </div>
        <button className="bg-white text-[#067BC2] px-4 py-1 rounded-full font-semibold shadow-md flex items-center gap-2 ml-8">
          Ask Pebbl
          <img src={pingu} alt="Penguin" className="w-6 h-6" />
        </button>
      </nav>

      {/* Tablet Navbar */}
      <nav className="hidden md:flex lg:hidden items-center justify-between px-4 py-3 bg-gradient-to-b from-[#067BC2] to-[#84BCDA] rounded-full shadow-lg mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold"><img src={Penguin} alt="" /></span>
          </div>
          <Link to="/home" className="text-white font-medium text-sm">Home</Link>
          <Link to="/logbook" className="text-white font-medium text-sm">LogBook</Link>
          <Link to="/trends" className="text-white font-medium text-sm">Trends</Link>
          <Link to="/meal-planner" className="text-white font-medium text-sm">Meal Planner</Link>
          <Link to="/goals" className="text-white font-medium text-sm">Goals</Link>
        </div>
        <button className="bg-white text-[#067BC2] px-3 py-1 rounded-full font-semibold shadow-md flex items-center gap-2 ml-4">
          Ask Pebbl
          <img src={PenguinCircle} alt="Penguin" className="w-5 h-5" />
        </button>
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden bg-gradient-to-b from-[#067BC2] to-[#84BCDA] rounded-2xl shadow-lg mx-auto max-w-sm">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold"><img src={Penguin } alt="" /></span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="px-4 pb-4 space-y-2">
            <Link to="/home" className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10">Home</Link>
            <Link to="/logbook" className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10">LogBook</Link>
            <Link to="/trends" className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10">Trends</Link>
            <Link to="/meal-planner" className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10">Meal Planner</Link>
            <Link to="/goals" className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10">Goals</Link>
            <button className="w-full bg-white text-[#067BC2] px-4 py-2 rounded-full font-semibold shadow-md flex items-center justify-center gap-2 mt-3">
              Ask Pebbl
              <img src={PenguinCircle} alt="Penguin" className="w-5 h-5" />
            </button>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;