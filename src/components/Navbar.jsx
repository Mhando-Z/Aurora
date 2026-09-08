"use client";

import React from "react";
import Auroralogo from "../../public/Auroraicon.png";
import Image from "next/image";

function Navbar() {
  return (
    <div className="bg-white fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* logo section */}
        <div className=" flex gap-2">
          <Image src={Auroralogo} alt="Aurora logo" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-bold ">Aurora</h1>
            <h2 className="text-lg text-gray-300">Spare Parts</h2>
          </div>
        </div>

        <h1 className="text-xl font-bold">Aurora Marketplace</h1>
      </div>
    </div>
  );
}

export default Navbar;
