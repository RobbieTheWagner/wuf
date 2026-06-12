const BASE64_MARKER = ';base64,';

export default function convertDataURIToBinary(
  dataURI: string,
): Uint8Array<ArrayBuffer> {
  const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  const base64 = dataURI.substring(base64Index);
  const raw = window.atob(base64);
  const array = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i);
  }

  return array;
}
