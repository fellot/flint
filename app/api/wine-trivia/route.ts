import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'wine-trivia.json');

// GET trivia questions
export async function GET(request: NextRequest) {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    const allQuestions = JSON.parse(data);
    
    // Split questions into two sets (first 15 and last 15)
    const set1 = allQuestions.slice(0, 15);
    const set2 = allQuestions.slice(15, 30);
    
    // Get current date to determine which set to use
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Alternate between sets based on day of year
    const useSet1 = dayOfYear % 2 === 0;
    const selectedSet = useSet1 ? set1 : set2;
    
    // Shuffle the selected set to randomize order
    const shuffledQuestions = selectedSet.sort(() => Math.random() - 0.5);
    
    return NextResponse.json(shuffledQuestions);
  } catch (error) {
    console.error('Error reading trivia questions:', error);
    return NextResponse.json({ error: 'Failed to fetch trivia questions' }, { status: 500 });
  }
}
