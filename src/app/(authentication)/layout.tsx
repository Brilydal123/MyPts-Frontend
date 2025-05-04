import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/background.png')] bg-cover bg-center">
      {children}
    </div>
  );
};

export default AuthLayout;
