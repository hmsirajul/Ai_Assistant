// Real WebAuthn / Platform Biometric helper for Level 3 Safeguards (zero hardcoded PINs)

export interface BiometricSupportStatus {
  webAuthnAvailable: boolean;
  platformAuthenticatorAvailable: boolean;
}

export interface BiometricVerifyResult {
  verified: boolean;
  method: "webauthn" | "hold_confirm";
  credentialId?: string;
  error?: string;
}

function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function checkBiometricSupport(): Promise<BiometricSupportStatus> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return { webAuthnAvailable: false, platformAuthenticatorAvailable: false };
  }
  try {
    const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      webAuthnAvailable: true,
      platformAuthenticatorAvailable: platformAvailable
    };
  } catch {
    return { webAuthnAvailable: true, platformAuthenticatorAvailable: false };
  }
}

export async function enrollDeviceBiometric(userName: string): Promise<{
  success: boolean;
  credentialId?: string;
  error?: string;
}> {
  if (typeof window === "undefined" || !navigator.credentials?.create || !window.PublicKeyCredential) {
    return {
      success: false,
      error: "Device passkey biometrics are not supported in this browser context."
    };
  }

  try {
    const challenge = randomBytes(32);
    const userId = randomBytes(16);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        rp: {
          name: "DiptiK AI 3",
          id: window.location.hostname
        },
        user: {
          id: userId.buffer as ArrayBuffer,
          name: userName || "diptik-user",
          displayName: userName || "DiptiK AI 3 User"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred"
        },
        timeout: 45000
      }
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: "Biometric enrollment was cancelled." };
    }

    return {
      success: true,
      credentialId: bufferToBase64Url(credential.rawId)
    };
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (err?.name === "NotAllowedError") {
      return {
        success: false,
        error: "Biometric prompt was cancelled or blocked by embedded frame permissions. Hold-to-Confirm safeguard remains available."
      };
    }
    return {
      success: false,
      error: msg || "Unable to enroll device biometric authenticator."
    };
  }
}

export async function verifyDeviceBiometric(
  storedCredentialId?: string,
  userLabel?: string
): Promise<BiometricVerifyResult> {
  if (typeof window === "undefined" || !navigator.credentials?.get || !window.PublicKeyCredential) {
    return {
      verified: false,
      method: "webauthn",
      error: "Biometric WebAuthn is unavailable in this browser; use Hold-to-Confirm verification below."
    };
  }

  try {
    let credentialIdToUse = storedCredentialId;

    if (!credentialIdToUse) {
      const enrolled = await enrollDeviceBiometric(userLabel || "DiptiK User");
      if (!enrolled.success || !enrolled.credentialId) {
        return {
          verified: false,
          method: "webauthn",
          error: enrolled.error
        };
      }
      credentialIdToUse = enrolled.credentialId;
      // Enrollment itself verified user presence + biometric/device PIN
      return {
        verified: true,
        method: "webauthn",
        credentialId: credentialIdToUse
      };
    }

    const challenge = randomBytes(32);
    const credIdBytes = base64UrlToUint8Array(credentialIdToUse);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        allowCredentials: [
          {
            type: "public-key",
            id: credIdBytes.buffer as ArrayBuffer,
            transports: ["internal"]
          }
        ],
        userVerification: "required",
        timeout: 45000
      }
    });

    if (!assertion) {
      return {
        verified: false,
        method: "webauthn",
        error: "Biometric verification did not complete."
      };
    }

    return {
      verified: true,
      method: "webauthn",
      credentialId: credentialIdToUse
    };
  } catch (err: any) {
    return {
      verified: false,
      method: "webauthn",
      error:
        err?.name === "NotAllowedError"
          ? "Device biometric prompt was cancelled or restricted in this preview frame. Use Hold-to-Confirm below."
          : err?.message || "Biometric check could not complete."
    };
  }
}
