import React from "react";

const AfterAuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="bg-primary-gray">{children}</div>;
};

export default AfterAuthLayout;
