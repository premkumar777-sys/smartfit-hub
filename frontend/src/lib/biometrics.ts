// WebAuthn Biometrics Utility for Fingerprint / Face ID Login
// Uses native browser WebAuthn API for zero overhead & native device hardware performance

const BIOMETRIC_KEY_PREFIX = 'smartfit_biometric_';

/**
 * Check if the current device/browser supports WebAuthn Fingerprint/Face ID
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    if (!window.PublicKeyCredential) return false;
    
    // Check if biometric/platform authenticator (fingerprint, Touch ID, Face ID, Windows Hello) is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.warn("Biometrics check error:", error);
    return false;
  }
}

/**
 * Check if a biometric credential is already registered on this device for the user
 */
export function isBiometricRegistered(email?: string): boolean {
  if (!email) return false;
  const key = `${BIOMETRIC_KEY_PREFIX}${email.toLowerCase().trim()}`;
  return !!localStorage.getItem(key);
}

/**
 * Register device fingerprint / Face ID for a logged-in user
 */
export async function registerBiometric(email: string): Promise<boolean> {
  const isAvailable = await isBiometricsAvailable();
  if (!isAvailable) {
    throw new Error("Biometric authentication (fingerprint / Face ID) is not supported on this device.");
  }

  const cleanEmail = email.toLowerCase().trim();
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userId = new TextEncoder().encode(cleanEmail);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: "SmartFit AI",
      id: window.location.hostname,
    },
    user: {
      id: userId,
      name: cleanEmail,
      displayName: cleanEmail.split('@')[0],
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },  // ES256
      { alg: -257, type: "public-key" }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Enforce local fingerprint/Face ID sensor
      userVerification: "required",
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: "none",
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (credential) {
      const rawId = Array.from(new Uint8Array(credential.rawId));
      const credentialData = {
        id: credential.id,
        rawId: rawId,
        registeredAt: new Date().toISOString(),
      };

      localStorage.setItem(`${BIOMETRIC_KEY_PREFIX}${cleanEmail}`, JSON.stringify(credentialData));
      localStorage.setItem('smartfit_last_biometric_user', cleanEmail);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error("Error registering biometric:", error);
    if (error.name === "NotAllowedError") {
      throw new Error("Fingerprint scanning was canceled or denied.");
    }
    throw new Error(error.message || "Failed to register fingerprint.");
  }
}

/**
 * Prompt device Fingerprint / Face ID sensor and verify user identity
 */
export async function authenticateBiometric(email?: string): Promise<boolean> {
  const targetEmail = (email || localStorage.getItem('smartfit_last_biometric_user') || '').toLowerCase().trim();
  
  if (!targetEmail) {
    throw new Error("No registered fingerprint found for this account.");
  }

  const storedData = localStorage.getItem(`${BIOMETRIC_KEY_PREFIX}${targetEmail}`);
  if (!storedData) {
    throw new Error("No fingerprint registered on this device. Please log in with password once to enable fingerprint.");
  }

  const credentialData = JSON.parse(storedData);
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const rawIdArray = new Uint8Array(credentialData.rawId);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: 60000,
    rpId: window.location.hostname,
    allowCredentials: [
      {
        id: rawIdArray,
        type: "public-[#key]" as any,
      },
    ],
    userVerification: "required",
  };

  // Replace type workaround
  delete (publicKeyCredentialRequestOptions.allowCredentials![0] as any)['type'];
  (publicKeyCredentialRequestOptions.allowCredentials![0] as any).type = "public-key";

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (assertion) {
      return true;
    }
    return false;
  } catch (error: any) {
    console.error("Error during biometric authentication:", error);
    if (error.name === "NotAllowedError") {
      throw new Error("Fingerprint verification canceled.");
    }
    throw new Error(error.message || "Fingerprint verification failed.");
  }
}

/**
 * Clear registered fingerprint credential for user
 */
export function removeBiometric(email: string): void {
  const cleanEmail = email.toLowerCase().trim();
  localStorage.removeItem(`${BIOMETRIC_KEY_PREFIX}${cleanEmail}`);
  if (localStorage.getItem('smartfit_last_biometric_user') === cleanEmail) {
    localStorage.removeItem('smartfit_last_biometric_user');
  }
}
