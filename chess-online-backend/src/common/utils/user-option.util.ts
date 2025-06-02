export function calculateRankName(rankPoint: number): string {
  if (rankPoint <= 100) return 'Rookie';
  if (rankPoint <= 500) return 'Primary';
  if (rankPoint <= 1000) return 'Veteran';
  if (rankPoint <= 2000) return 'Master';
  if (rankPoint <= 5000) return 'Grandmaster';
  
  // God ranks: God 1, God 2, etc.
  const godLevel = Math.floor((rankPoint - 5000) / 5000) + 1;
  return `God tier ${godLevel}`;
}

export function generateRandomAvatar(): string {
  const randomId = Math.floor(Math.random() * 50) + 1;
  return `https://i.pravatar.cc/150?img=${randomId}`;
}

export function generateRandomFrame(): string {
  const randomId = Math.floor(Math.random() * 50) + 1;
  return `https://i.pravatar.cc/170?img=${randomId}`;
}

export async function generateRandomBackground(): Promise<string> {
  try {
    // Fetch to get image URL after fetched
    const response = await fetch('https://picsum.photos/1200/800', { method: 'HEAD' });
    return response.url;
  } catch (error) {
    // Fallback if we cannot fetch a random image
    return 'https://fastly.picsum.photos/id/103/1200/800.jpg?hmac=b2AE3PeWAbLIkanUK0pL6YqxPY2YGaqb3dCxNVcSOV8';
  }
}