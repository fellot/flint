import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'wine-trivia.json');

// GET trivia questions
export async function GET(request: NextRequest) {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    const questions = JSON.parse(data);
    
    // Shuffle questions to randomize order
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    
    return NextResponse.json(shuffledQuestions);
  } catch (error) {
    console.error('Error reading trivia questions:', error);
    return NextResponse.json({ error: 'Failed to fetch trivia questions' }, { status: 500 });
  }
}
