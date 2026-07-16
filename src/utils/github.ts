import { getCache, setCache, getCacheEvenExpired } from './storage';

// 仓库指向 84（柱状图最大矩形）母仓：85 的可视化项目从 84 派生，
// GitHub stars 计数统一归 84 母仓，故此处用 84 而非 85。
// 84 仓库已设为 public，链接与 stars API 均可正常访问。
const REPO_OWNER = 'fuck-algorithm';
const REPO_NAME = 'leetcode-84-largest-rectangle-in-histogram';
const CACHE_KEY = 'github-stars';
const CACHE_TTL = 60 * 60 * 1000; // 1小时

export const GITHUB_REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;

export async function getGitHubStars(): Promise<number> {
  // 先尝试从缓存获取
  const cachedStars = await getCache<number>(CACHE_KEY);
  if (cachedStars !== null) {
    return cachedStars;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub stars');
    }

    const data = await response.json();
    const stars = data.stargazers_count || 0;

    // 缓存结果
    await setCache(CACHE_KEY, stars, CACHE_TTL);

    return stars;
  } catch (error) {
    console.error('Error fetching GitHub stars:', error);
    
    // 尝试获取过期的缓存
    const expiredCache = await getCacheEvenExpired<number>(CACHE_KEY);
    if (expiredCache !== null) {
      return expiredCache;
    }
    
    return 0;
  }
}
