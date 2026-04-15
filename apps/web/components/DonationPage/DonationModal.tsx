"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./donationModal.module.css";

type PaymentMethod = "ath" | "paypal" | "card";

type DonationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedAmount: string;
};

export default function DonationModal({
  isOpen,
  onClose,
  selectedAmount,
}: DonationModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ath");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose} aria-hidden="true">
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id="donation-modal-title" className={styles.modalTitle}>
            Donación 
          </h2>

          <button
            type="button"
            onClick={onClose}
            className={styles.modalClose}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        <div className={styles.paymentTabs}>
          <button
            type="button"
            onClick={() => setPaymentMethod("ath")}
            className={`${styles.paymentTab} ${
              paymentMethod === "ath"
                ? `${styles.paymentTabActive} ${styles.paymentTabAthActive}`
                : ""
            }`}
          >
            ATH Móvil
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("paypal")}
            className={`${styles.paymentTab} ${
              paymentMethod === "paypal"
                ? `${styles.paymentTabActive} ${styles.paymentTabPaypalActive}`
                : ""
            }`}
          >
            PayPal
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={`${styles.paymentTab} ${
              paymentMethod === "card"
                ? `${styles.paymentTabActive} ${styles.paymentTabStripeActive}`
                : ""
            }`}
          >
            Tarjeta
          </button>
        </div>

        <div className={styles.modalBody}>
          {paymentMethod === "ath" && (
            <div className={styles.paymentPanel}>
              <h3 className={styles.panelTitle}>Escanea con ATH Móvil</h3>

              <div className={styles.qrBox}>
                <Image
                  src="/ATH-movil-number.png"
                  alt={`Código QR para donar ${selectedAmount} con ATH Móvil`}
                  className={styles.qrImage}
                  width={220}
                  height={220}
                  sizes="220px"
                />
              </div>

              <p className={styles.panelText}>
                Abre la app de ATH Móvil y escanea este código QR para completar
                tu donación 
              </p>

            </div>
          )}

          {paymentMethod === "paypal" && (
            <div className={styles.paymentPanel}>
              <h3 className={styles.panelTitle}>Pagar con PayPal</h3>
              <p className={styles.panelText}>
                Continúa a PayPal para completar tu donación.
              </p>

              <a
                href="https://www.paypal.com/us/home"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.panelAction} ${styles.panelActionPaypal}`}
              >
                Ir a PayPal
              </a>
            </div>
          )}

          {paymentMethod === "card" && (
            <div className={styles.paymentPanel}>
              <h3 className={styles.panelTitle}>Pagar con tarjeta</h3>
              <p className={styles.panelText}>
                Aquí puedes conectar tu formulario o enlace de Stripe para
                procesar la donación.
              </p>

              <a
                href="https://stripe.com/payments/payment-links"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.panelAction} ${styles.panelActionStripe}`}
              >
                Pagar con tarjeta
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
