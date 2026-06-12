import { apiFetch } from './config';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.8;

function compressImage(file) {
  return new Promise((resolve) => {
    // Skip non-image or already small files
    if (!file.type.startsWith('image/') || file.size <= 500 * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }

      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export async function checkNicknameAvailable(nickname) {
  const query = new URLSearchParams({ nickname });
  const res = await apiFetch(`/api/v1/clients/check-nickname?${query}`, { method: 'GET' });
  return res?.data === true;
}

export async function createClient(data, photos = []) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value != null && value !== '') {
      formData.append(key, String(value));
    }
  }

  const compressed = await Promise.all(photos.map(compressImage));
  compressed.forEach((file) => formData.append('photos', file));

  return apiFetch('/api/v1/clients', {
    method: 'POST',
    body: formData,
  });
}

export async function listClients(params = {}) {
  const query = new URLSearchParams();
  if (params.name) query.set('name', params.name);
  if (params.phone) query.set('phone', params.phone);
  if (params.gender) query.set('gender', params.gender);
  if (params.approval) query.set('approval', params.approval);
  if (params.status) query.set('status', params.status);
  if (params.owner) query.set('owner', params.owner);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiFetch(`/api/v1/clients${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

export async function getClientDetail(clientId) {
  return apiFetch(`/api/v1/clients/${clientId}`, { method: 'GET' });
}

export async function updateApproval(clientId, status) {
  return apiFetch(`/api/v1/clients/${clientId}/approval`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function updateNote(clientId, note) {
  return apiFetch(`/api/v1/clients/${clientId}/note`, {
    method: 'PATCH',
    body: { note },
  });
}

export async function updateClient(clientId, data) {
  return apiFetch(`/api/v1/clients/${clientId}`, {
    method: 'PUT',
    body: data,
  });
}

export async function addClientPhotos(clientId, photos = []) {
  const compressed = await Promise.all(photos.map(compressImage));
  const formData = new FormData();
  compressed.forEach((file) => formData.append('photos', file));
  return apiFetch(`/api/v1/clients/${clientId}/photos`, {
    method: 'POST',
    body: formData,
  });
}

export async function deleteClientPhoto(clientId, photoId) {
  return apiFetch(`/api/v1/clients/${clientId}/photos/${photoId}`, {
    method: 'DELETE',
  });
}

export async function deleteClient(clientId) {
  return apiFetch(`/api/v1/clients/${clientId}`, {
    method: 'DELETE',
  });
}

export async function getMyProfile({ id, verificationId }) {
  return apiFetch('/api/v1/clients/me', {
    method: 'POST',
    body: { id, verificationId },
  });
}

export async function updateMyProfile(id, phone, verificationId, data) {
  const query = new URLSearchParams({ id, phone, verificationId });
  return apiFetch(`/api/v1/clients/me?${query}`, {
    method: 'PUT',
    body: data,
  });
}

export async function deleteMyProfile(id, verificationId) {
  const query = new URLSearchParams({ id, verificationId });
  return apiFetch(`/api/v1/clients/me?${query}`, { method: 'DELETE' });
}

/* 회원 본인 사진 추가/삭제 (전화 인증) — id + verificationId 로 인증.
   verificationId 를 소모하지 않아 60분 인증 세션 내 여러 번 호출 가능. */
export async function addMyPhotos(id, verificationId, photos = []) {
  const compressed = await Promise.all(photos.map(compressImage));
  const formData = new FormData();
  compressed.forEach((file) => formData.append('photos', file));
  const query = new URLSearchParams({ id, verificationId });
  return apiFetch(`/api/v1/clients/me/photos?${query}`, {
    method: 'POST',
    body: formData,
  });
}

export async function deleteMyPhoto(id, verificationId, photoId) {
  const query = new URLSearchParams({ id, verificationId });
  return apiFetch(`/api/v1/clients/me/photos/${photoId}?${query}`, {
    method: 'DELETE',
  });
}

export async function updateClientStatus(clientId, status) {
  return apiFetch(`/api/v1/clients/${clientId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function submitInquiry(clientId, phone, verificationId, data) {
  const query = new URLSearchParams({ id: clientId, phone, verificationId });
  return apiFetch(`/api/v1/inquiries?${query}`, {
    method: 'POST',
    body: data,
  });
}

export async function submitProposalInquiry(token, phone, verificationId, data) {
  const query = new URLSearchParams({ phone, verificationId });
  return apiFetch(`/api/v1/proposals/${token}/inquiries?${query}`, {
    method: 'POST',
    body: data,
  });
}

export async function listInquiries({ status, category, matchId, page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (category) query.set('category', category);
  if (matchId) query.set('matchId', matchId);
  query.set('page', String(page));
  query.set('limit', String(limit));
  return apiFetch(`/api/v1/inquiries?${query}`);
}

export async function getInquiry(inquiryId) {
  return apiFetch(`/api/v1/inquiries/${inquiryId}`);
}

export async function answerInquiry(inquiryId, answer) {
  return apiFetch(`/api/v1/inquiries/${inquiryId}/answer`, {
    method: 'POST',
    body: { answer },
  });
}

export async function closeInquiry(inquiryId) {
  return apiFetch(`/api/v1/inquiries/${inquiryId}/close`, {
    method: 'PATCH',
  });
}
