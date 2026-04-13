"use client";

import { useState } from "react";
import styles from "./donationPage.module.css";

type PaymentMethod = "ath" | "paypal" | "card";

export default function DonationPage() {
  const stats = [
    { value: "500+", label: "Animales rescatados" },
    { value: "300+", label: "Adopciones exitosas" },
    { value: "30+", label: "Años de servicio" },
  ];

  const amounts = ["$10", "$25", "$50", "$100", "Otro"];
  const [selectedAmount, setSelectedAmount] = useState("$50");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ath");

  const donationUses = [
    "Atención veterinaria y medicinas",
    "Alimento y suministros",
    "Hogares temporales",
    "Campañas de esterilización",
  ];

  const openModal = () => {
    setPaymentMethod("ath");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <main className={styles.page} aria-label="Sección de donaciones">
      <section className={styles.heroSection}>
        <div className={styles.heroCentered}>
          <h1 className={styles.heroTitle}>Ayúdanos a Salvar Vidas</h1>
          <p className={styles.heroText}>
            Cada donación nos permite rescatar, alimentar y cuidar animales
            abandonados
          </p>
        </div>
      </section>

      <section className={styles.donationLayout}>
        <div className={styles.statsGrid}>
          {stats.map((stat) => (
            <article key={stat.label} className={styles.statCard}>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
            </article>
          ))}
        </div>

        <div className={styles.amountSection}>
          <h2 className={styles.amountTitle}>Selecciona la cantidad</h2>

          <div
            className={styles.amountButtons}
            role="group"
            aria-label="Cantidad de donación"
          >
            {amounts.map((amount) => {
              const isActive = amount === selectedAmount;

              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedAmount(amount)}
                  className={`${styles.amountButton} ${
                    isActive ? styles.amountButtonActive : ""
                  }`}
                  aria-pressed={isActive}
                >
                  {amount}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.usesCard}>
          <h3 className={styles.usesTitle}>¿A dónde va tu donación?</h3>

          <div className={styles.usesGrid}>
            {donationUses.map((item) => (
              <div key={item} className={styles.useItem}>
                <span className={styles.useBullet}>[+]</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.donateAction}>
          <button
            type="button"
            onClick={openModal}
            className={styles.primaryDonateButton}
          >
            Donar {selectedAmount} →
          </button>

          <p className={styles.paymentNote}>
            Opens payment modal (ATH Móvil, PayPal, or Card)
          </p>
        </div>
      </section>

      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={closeModal}
          aria-hidden="true"
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="donation-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id="donation-modal-title" className={styles.modalTitle}>
                Donación — {selectedAmount}
              </h2>

              <button
                type="button"
                onClick={closeModal}
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
                  paymentMethod === "ath" ? styles.paymentTabActive : ""
                }`}
              >
                ATH Móvil
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`${styles.paymentTab} ${
                  paymentMethod === "paypal" ? styles.paymentTabActive : ""
                }`}
              >
                PayPal
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`${styles.paymentTab} ${
                  paymentMethod === "card" ? styles.paymentTabActive : ""
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
                    <img
                      src="/ATH-movil-number.png"
                      alt={`Código QR para donar ${selectedAmount} con ATH Móvil`}
                      className={styles.qrImage}
                    />
                  </div>

                  <p className={styles.panelText}>
                    Abre la app de ATH Móvil y escanea este código QR para
                    completar tu donación de {selectedAmount}.00
                  </p>

                  <p className={styles.panelMeta}>
                    El código expira en 10 minutos · Transacción segura
                  </p>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className={styles.paymentPanel}>
                  <h3 className={styles.panelTitle}>Pagar con PayPal</h3>
                  <p className={styles.panelText}>
                    Continúa a PayPal para completar tu donación de{" "}
                    {selectedAmount}.
                  </p>

                  <a
                    href="https://www.paypal.com/donate?token=xtjs1DXaBZLSUELKEMHyMNHSmylJSD4E5bDYwFPTSyEMyMzRTvcymWXT9NNX7z4JagxRtEJyY7oUWilB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.panelAction}
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
                    procesar la donación de {selectedAmount}.
                  </p>

                  <a
                    href="https://stripe.com/payments/payment-links"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.panelAction}
                  >
                    Pagar con tarjeta
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}