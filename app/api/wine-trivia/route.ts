import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'wine-trivia.json');

// GET trivia questions
export async function GET(request: NextRequest) {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    const allQuestions = JSON.parse(data);
    
    // Split questions into multiple sets (15 questions each)
    const set1 = allQuestions.slice(0, 15);   // Classic Wine Knowledge
    const set2 = allQuestions.slice(15, 30);  // Advanced Wine Expertise
    const set3 = allQuestions.slice(30, 45);  // Regional Wine Specialties
    const set4 = allQuestions.slice(45, 60);  // Wine Production & Techniques
    
    const questionSets = [
      { id: 1, name: 'Classic Wine Knowledge', questions: set1 },
      { id: 2, name: 'Advanced Wine Expertise', questions: set2 },
      { id: 3, name: 'Regional Wine Specialties', questions: set3 },
      { id: 4, name: 'Wine Production & Techniques', questions: set4 }
    ];
    
    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const completedSetsParam = searchParams.get('completedSets');
    const selectedSetIdParam = searchParams.get('selectedSetId');
    const completedSets = completedSetsParam ? JSON.parse(completedSetsParam) : [];
    
    // Determine which set to use
    let selectedSet = questionSets[0]; // Default to first set
    
    if (selectedSetIdParam) {
      // User selected a specific set
      const setId = parseInt(selectedSetIdParam);
      const requestedSet = questionSets.find(set => set.id === setId);
      if (requestedSet) {
        selectedSet = requestedSet;
      }
    } else if (completedSets.length > 0) {
      // Auto-select next uncompleted set
      const nextSet = questionSets.find(set => !completedSets.includes(set.id));
      if (nextSet) {
        selectedSet = nextSet;
      } else {
        // All sets completed, cycle back to the first set
        selectedSet = questionSets[0];
      }
    }
    
    // Shuffle the selected set to randomize order
    const shuffledQuestions = selectedSet.questions.sort(() => Math.random() - 0.5);
    
    return NextResponse.json({
      questions: shuffledQuestions,
      setInfo: {
        id: selectedSet.id,
        name: selectedSet.name,
        totalSets: questionSets.length
      },
      allSets: questionSets.map(set => ({
        id: set.id,
        name: set.name,
        isCompleted: completedSets.includes(set.id)
      }))
    });
  } catch (error) {
    console.error('Error reading trivia questions:', error);
    return NextResponse.json({ error: 'Failed to fetch trivia questions' }, { status: 500 });
  }
}
