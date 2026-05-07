"use client";

import { ReactNode, useState } from "react";
import DonationModal from "./DonationModal";
import { DEFAULT_MODAL_AMOUNT } from "./donationOptions";

type DonationModalTriggerProps = {
  className: string;
  children: ReactNode;
  amount?: string;
  onOpen?: () => void;
};

export default function DonationModalTrigger({
  className,
  children,
  amount = DEFAULT_MODAL_AMOUNT,
  onOpen,
}: DonationModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    onOpen?.();
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleOpen}
      >
        {children}
      </button>

      <DonationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedAmount={amount}
      />
    </>
  );
}
