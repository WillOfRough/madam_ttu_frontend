import { apiFetch } from './config';

export async function createProfile(accountId, profileJson) {
  // Backend expects profileJson as a JSON string, not an object
  return apiFetch('/api/profiles', {
    method: 'POST',
    body: {
      accountId: Number(accountId),
      profileJson: typeof profileJson === 'string'
        ? profileJson
        : JSON.stringify(profileJson),
    },
  });
}

export async function getProfile(accountId) {
  return apiFetch(`/api/profiles/account/${accountId}`, {
    method: 'GET',
  });
}

export async function getProfileById(profileId) {
  return apiFetch(`/api/profiles/${profileId}`, {
    method: 'GET',
  });
}

export async function listProfiles() {
  return apiFetch('/api/profiles', {
    method: 'GET',
  });
}

export async function updateProfileStatus(profileId, status) {
  return apiFetch(`/api/profiles/${profileId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
