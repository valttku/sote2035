"use client";
import Image from "next/image";

const AppLogo = () => {
  return (
    <Image
      priority
      width={60}
      height={60}
      src="/logo.svg"
      alt="Digital Twin Logo"
      className="absolute left-6 top-1 z-50 object-contain"
    />
  );
};

export default AppLogo;
