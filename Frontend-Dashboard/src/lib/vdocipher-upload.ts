/**
 * Browser upload directly to VdoCipher storage using credentials from PUT /api/videos/upload-credentials/.
 * No file bytes pass through Django.
 */

export type VdoCipherClientPayload = {
  uploadLink: string;
  policy?: string;
  key?: string;
  "x-amz-signature"?: string;
  "x-amz-algorithm"?: string;
  "x-amz-date"?: string;
  "x-amz-credential"?: string;
  [key: string]: string | undefined;
};

export type UploadCredentialsResponse = {
  clientPayload: VdoCipherClientPayload;
  videoId: string;
};

/**
 * POST multipart to `uploadLink` with policy fields + file.
 * VdoCipher/S3 POST policies typically expect `file` as the file field name.
 */
export function uploadFileToVdoCipher(
  creds: UploadCredentialsResponse,
  file: File,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const { clientPayload } = creds;
  const url = clientPayload.uploadLink;
  if (!url) {
    return Promise.reject(new Error("Missing uploadLink in clientPayload"));
  }

  const fd = new FormData();
  const skip = new Set(["uploadLink"]);
  for (const [k, v] of Object.entries(clientPayload)) {
    if (skip.has(k) || v === undefined || v === null) continue;
    fd.append(k, v);
  }
  fd.append("file", file, file.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) onProgress(ev.loaded, ev.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText?.slice(0, 400) || xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(fd);
  });
}
