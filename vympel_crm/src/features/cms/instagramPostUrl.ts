const INSTAGRAM_POST_PATH = /^\/(p|reel)\/([A-Za-z0-9_-]+)\/?$/;

export function canonicalInstagramPostUrl(value: string | null | undefined) {
  const input = value?.trim();
  if (!input) return null;

  try {
    const authority = input.match(/^https:\/\/([^/?#]+)/i)?.[1];
    const url = new URL(input);
    if (
      url.protocol !== "https:"
      || (url.hostname !== "instagram.com" && url.hostname !== "www.instagram.com")
      || !authority
      || authority.includes(":")
      || url.username
      || url.password
      || url.port
    ) {
      return null;
    }

    const match = url.pathname.match(INSTAGRAM_POST_PATH);
    return match ? `https://www.instagram.com/${match[1]}/${match[2]}/` : null;
  } catch {
    return null;
  }
}
