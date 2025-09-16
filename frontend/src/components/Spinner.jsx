import React from "react";

const Spinner = ({ size = "normal" }) => {
  const sizeClasses = size === "large" ? "h-12 w-12" : "h-6 w-6";
  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-t-2 border-blue-500 ${sizeClasses}`}
      ></div>
    </div>
  );
};

export default Spinner;
