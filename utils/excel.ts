import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export interface FeatureWine {
    'Country Name': string;
    'Wine Name': string;
    'Tasting Notes': string;
    'LCBO#': number;
    'Region': string;
    'Score': string;
    'ML': number;
    '$BTL': number;
}

export const getDecemberFeatures = async (): Promise<FeatureWine[]> => {
    try {
        const filePath = path.join(process.cwd(), 'data', 'december_features_additional.xlsx');

        // Read file buffer
        const fileBuffer = fs.readFileSync(filePath);

        // Parse workbook
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json<FeatureWine>(sheet);

        return data;
    } catch (error) {
        console.error('Error reading Excel file:', error);
        return [];
    }
};
