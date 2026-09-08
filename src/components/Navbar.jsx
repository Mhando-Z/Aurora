"use client";

import React from "react";
import Auroralogo from "../../public/Auroraicon.png";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";

function Navbar() {
  return (
    <div className="bg-white fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* logo section */}
        <div className="flex gap-2">
          <Image src={Auroralogo} alt="Aurora logo" className="h-10 w-auto" />
          <div>
            <h1 className="text-sm font-bold ">Aurora</h1>
            <h2 className="text-xs font-medium">Spare Parts</h2>
          </div>
        </div>
        {/* navigation links and profile */}
        <div className="flex items-center gap-4">
          {/* navigation links */}
          <nav className="flex gap-4">
            <a href="#" className="text-gray-700 hover:text-gray-900">
              Home
            </a>
            <a href="#" className="text-gray-700 hover:text-gray-900">
              About
            </a>
            <a href="#" className="text-gray-700 hover:text-gray-900">
              Contact
            </a>
          </nav>
          {/* profile section */}
          <div className="flex items-center gap-4">
            <div>
              <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-gray-900" />
            </div>
            <div className="">
              <button className="cursor-pointer py-2 px-4 rounded-lg bg-black text-white hover:text-gray-900">
                sign in/ sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
