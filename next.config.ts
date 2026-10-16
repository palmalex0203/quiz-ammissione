import type { NextConfig } from "next";

/** L'indirizzo che va negli annunci dell'open day. */
const HOST_OPEN_DAY = "openday.proforcorsi.it";

const nextConfig: NextConfig = {
  /*
   * Su `openday.proforcorsi.it` la radice porta alla pagina dell'open day.
   *
   * Quel nome è l'indirizzo che finisce negli annunci, e metà delle persone lo
   * scriverà a mano senza `/openday` in fondo: senza questo si troverebbero la
   * schermata di accesso del simulatore, che non è quello che gli abbiamo
   * promesso. Tutto il resto di quel nome continua a funzionare normalmente —
   * chi ci arriva su una pagina interna non viene rimbalzato.
   *
   * Temporaneo (307) e non permanente: un 308 se lo tengono i browser per
   * sempre, e dopo l'open day questo indirizzo servirà a qualcos'altro.
   */
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: HOST_OPEN_DAY }],
        destination: "/openday",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
