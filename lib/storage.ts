// Storage abstraction layer with GitHub integration
import { Wine } from '@/types/wine';

const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;
const branch = process.env.GITHUB_BRANCH ?? "main";
const token = process.env.GITHUB_TOKEN!;

// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com';
const getAuthHeaders = () => ({
  'Authorization': `token ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
});

// Get file path based on data source
function getFilePath(dataSource: string): string {
  return dataSource === '2' ? 'data/wines2.json' : 'data/wines.json';
}

// Get file SHA from GitHub
async function getFileSHA(filePath: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers: getAuthHeaders() }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.sha;
    }
    return null;
  } catch (error) {
    console.error('Error getting file SHA:', error);
    return null;
  }
}

export async function loadWines(dataSource: string = '1'): Promise<Wine[]> {
  const filePath = getFilePath(dataSource);
  
  // Check if we have GitHub credentials
  if (!owner || !repo || !token) {
    console.warn('GitHub credentials not configured, falling back to local file system');
    return loadWinesFromFileSystem(dataSource);
  }
  
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers: getAuthHeaders() }
    );
    
    if (response.ok) {
      const data = await response.json();
      const content = atob(data.content);
      return JSON.parse(content);
    } else {
      console.error('Error loading wines from GitHub:', response.statusText);
      // Fallback to local file system
      return loadWinesFromFileSystem(dataSource);
    }
  } catch (error) {
    console.error('Error loading wines from GitHub:', error);
    // Fallback to local file system
    return loadWinesFromFileSystem(dataSource);
  }
}

// Fallback function for local development
async function loadWinesFromFileSystem(dataSource: string): Promise<Wine[]> {
  try {
    const { promises as fs } = await import('fs');
    const path = await import('path');
    
    const dataFilePath = path.join(process.cwd(), 'data', 'wines.json');
    const dataFilePath2 = path.join(process.cwd(), 'data', 'wines2.json');
    const filePath = dataSource === '2' ? dataFilePath2 : dataFilePath;
    
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading wines from file system:', error);
    return [];
  }
}

export async function saveWines(wines: Wine[], dataSource: string = '1'): Promise<void> {
  const filePath = getFilePath(dataSource);
  const content = JSON.stringify(wines, null, 2);
  
  // Check if we have GitHub credentials
  if (!owner || !repo || !token) {
    console.warn('GitHub credentials not configured, falling back to local file system');
    return saveWinesToFileSystem(wines, dataSource);
  }
  
  const encodedContent = btoa(content);
  
  try {
    // Get current file SHA
    const sha = await getFileSHA(filePath);
    
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: `Update wine data (${new Date().toISOString()})`,
          content: encodedContent,
          sha: sha,
          branch: branch,
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error saving wines to GitHub:', errorData);
      // Fallback to local file system
      return saveWinesToFileSystem(wines, dataSource);
    }
  } catch (error) {
    console.error('Error saving wines to GitHub:', error);
    // Fallback to local file system
    return saveWinesToFileSystem(wines, dataSource);
  }
}

// Fallback function for local development
async function saveWinesToFileSystem(wines: Wine[], dataSource: string): Promise<void> {
  try {
    const { promises as fs } = await import('fs');
    const path = await import('path');
    
    const dataFilePath = path.join(process.cwd(), 'data', 'wines.json');
    const dataFilePath2 = path.join(process.cwd(), 'data', 'wines2.json');
    const filePath = dataSource === '2' ? dataFilePath2 : dataFilePath;
    
    await fs.writeFile(filePath, JSON.stringify(wines, null, 2));
  } catch (error) {
    console.error('Error saving wines to file system:', error);
    throw error;
  }
}
