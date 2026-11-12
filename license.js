/* Offline signed-license verification. No server or API calls are made. */
(() => {
  const PUBLIC_KEY_SPKI_B64 = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEJ+2uwEw57byD3TcZhjzLBzLN/62h2kUV/MnunU6EtK4DoyVumGeCZNNRl8gwZ+zbjXBIBg7xaRMqzpNDGKYNOQ==";
  const ALL_FEATURES = ["promptStudio", "multiChat", "webResearch"];

  function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function importPublicKey() {
    const raw = Uint8Array.from(atob(PUBLIC_KEY_SPKI_B64), char => char.charCodeAt(0));
    return crypto.subtle.importKey("spki", raw, {name: "ECDSA", namedCurve: "P-256"}, false, ["verify"]);
  }

  async function verifyCode(code) {
    if (typeof code !== "string" || code.length > 5000) return {valid: false, reason: "The activation code is empty or too long."};
    const parts = code.trim().split(".");
    if (parts.length !== 2) return {valid: false, reason: "Code format is not recognized."};
    try {
      const payloadBytes = decodeBase64Url(parts[0]);
      const signature = decodeBase64Url(parts[1]);
      const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
      const publicKey = await importPublicKey();
      const verified = await crypto.subtle.verify({name: "ECDSA", hash: "SHA-256"}, publicKey, signature, payloadBytes);
      if (!verified) return {valid: false, reason: "Signature verification failed."};

      let features = [];
      let plan = "Pro";
      if (payload.v === 2) {
        if (payload.planId !== "complete-pro" || !Array.isArray(payload.features) || !ALL_FEATURES.every(feature => payload.features.includes(feature))) {
          return {valid: false, reason: "This code is not a valid Complete Pro license."};
        }
        features = [...ALL_FEATURES];
        plan = "Complete Pro";
      } else if (payload.v === 1 && Array.isArray(payload.features)) {
        // Existing v21 signed licenses remain valid with the features originally purchased.
        features = [...new Set(payload.features)].filter(feature => ALL_FEATURES.includes(feature));
        plan = String(payload.plan || "Legacy Pro").slice(0, 40);
        if (!features.length) return {valid: false, reason: "This license does not include a supported feature."};
      } else {
        return {valid: false, reason: "License data is not supported."};
      }

      const now = Date.now();
      if (typeof payload.iat !== "number" || payload.iat > now + 5 * 60 * 1000) return {valid: false, reason: "The license issue date is invalid."};
      if (payload.exp !== null && (!Number.isFinite(payload.exp) || now > payload.exp)) return {valid: false, reason: "This license has expired."};
      return {
        valid: true, features, plan,
        licenseId: String(payload.id || "").slice(0, 80),
        buyer: String(payload.buyer || "").slice(0, 80),
        expiresAt: payload.exp === null ? null : payload.exp,
        issuedAt: payload.iat,
        isCompletePro: payload.v === 2
      };
    } catch (error) {
      console.warn("License verification failed:", error);
      return {valid: false, reason: "Could not verify the activation code. Check that it was copied completely."};
    }
  }

  async function getLicense() {
    const saved = await browser.storage.local.get("signedLicenseCode");
    if (!saved.signedLicenseCode) return {valid: false, features: []};
    const result = await verifyCode(saved.signedLicenseCode);
    if (!result.valid) {
      await browser.storage.local.remove("signedLicenseCode");
      return {valid: false, features: [], reason: result.reason};
    }
    return result;
  }

  window.AILicense = {verifyCode, getLicense, allowedFeatures: [...ALL_FEATURES]};
})();
