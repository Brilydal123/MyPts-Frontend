import React from "react";
import Modal from "@/components/shared/modal";

const AfterAuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-primary-gray">
      {children}
      <Modal />
    </div>
  );
};

export default AfterAuthLayout;
