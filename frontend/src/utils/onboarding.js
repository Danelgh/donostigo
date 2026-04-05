const STORAGE_PREFIX = "donostigo_onboarding";

function getStorageKey(userId, role) {
  return `${STORAGE_PREFIX}:${role}:${userId}`;
}

function readState(key) {
  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return {};
    }

    return JSON.parse(rawValue);
  } catch (_error) {
    return {};
  }
}

export function getOnboardingState(user) {
  if (!user?.id || !user?.role) {
    return {};
  }

  return readState(getStorageKey(user.id, user.role));
}

export function saveOnboardingState(user, nextState) {
  if (!user?.id || !user?.role) {
    return;
  }

  try {
    const key = getStorageKey(user.id, user.role);
    const currentState = readState(key);

    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...currentState,
        ...nextState
      })
    );
  } catch (_error) {
    // Ignoramos errores de localStorage para no bloquear el onboarding.
  }
}

export function isUserProfileReady(user) {
  return Boolean(user?.name?.trim() && user?.city?.trim() && user?.bio?.trim());
}

export function isBusinessProfileReady(business) {
  return Boolean(
    business?.name?.trim() &&
      business?.categoryId &&
      business?.description?.trim() &&
      business?.address?.trim() &&
      business?.serviceMode &&
      Array.isArray(business?.services) &&
      business.services.some((service) => service.title?.trim() && service.description?.trim())
  );
}

export function isOnboardingComplete({ user, business }) {
  const state = getOnboardingState(user);

  if (user?.role === "business") {
    return Boolean(state.completedAt) && isBusinessProfileReady(business);
  }

  return Boolean(state.completedAt) && isUserProfileReady(user);
}
