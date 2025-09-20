import { cn } from "@/lib/utils";
import React from "react";

const Logo = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 160 40"
      className={cn("text-primary", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Qmuter Logo</title>
      <text
        x="0"
        y="30"
        fontFamily="Inter, sans-serif"
        fontSize="32"
        fontWeight="bold"
        fill="currentColor"
      >
        Qmuter
      </text>
    </svg>
  );
};

export default Logo;
