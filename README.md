# 🍷 Wine Cellar Manager

A modern, Git-based wine inventory management system built with Next.js, TypeScript, and Tailwind CSS. Perfect for wine enthusiasts who want to track their collection, manage inventory, and keep detailed notes about their wines.

## ✨ Features

### 🏠 **Dashboard & Overview**
- **Statistics Dashboard**: View total wines, wines in cellar, consumed wines, and total collection value
- **Real-time Updates**: Instant updates as you modify your wine collection
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### 🍇 **Wine Management**
- **Add New Wines**: Comprehensive form with all essential wine details
- **Edit Existing Wines**: Modify any wine information at any time
- **Mark as Consumed**: Track when you drink wines and add ratings
- **Delete Wines**: Remove wines from your collection when needed

### 🔍 **Advanced Filtering & Search**
- **Country Filter**: Filter by wine-producing countries
- **Style Filter**: Filter by wine style (Red, White, Rosé, Sparkling, Sweet, Fortified)
- **Vintage Filter**: Filter by specific vintages
- **Status Filter**: Filter by wine status (In Cellar, Consumed, Sold, Gifted)
- **Global Search**: Search across all wine data including names, grapes, food pairings, and notes

### 📊 **Data Tracking**
- **Wine Details**: Bottle name, producer, country, region, vintage, peak year
- **Tasting Notes**: Food pairing suggestions, meal recommendations, personal notes
- **Inventory Management**: Storage location, quantity, price tracking
- **Consumption History**: Track when wines were consumed with ratings

### 🎨 **Modern UI/UX**
- **Clean Interface**: Beautiful, intuitive design with wine-themed styling
- **Responsive Tables**: Easy-to-read wine information in organized tables
- **Modal Forms**: Streamlined forms for adding and editing wines
- **Status Badges**: Visual indicators for wine status and location

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd wine-cellar-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
wine-cellar-manager/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── wines/         # Wine management endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/             # React components
│   ├── AddWineModal.tsx   # Add new wine form
│   ├── WineFilters.tsx    # Filtering and search
│   ├── WineModal.tsx      # Edit wine form
│   └── WineTable.tsx      # Wine display table
├── data/                   # Data storage
│   └── wines.json         # Wine inventory data
├── types/                  # TypeScript definitions
│   └── wine.ts            # Wine interface types
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md              # This file
```

## 🗄️ Data Management

### Git-based CMS
This system uses a Git-based approach to manage wine data:
- **JSON Storage**: Wine data is stored in `data/wines.json`
- **Version Control**: All changes are tracked through Git commits
- **Collaboration**: Multiple users can manage the same wine cellar
- **Backup**: Easy backup and restoration through Git history

### Data Structure
Each wine entry includes:
```typescript
interface Wine {
  id: string;                    // Unique identifier
  bottle: string;                // Bottle name/producer
  country: string;               // Country of origin
  region: string;                // Wine region/appellation
  vintage: number;               // Vintage year
  drinkingWindow: string;        // Drinking window
  peakYear: number;              // Peak drinking year
  foodPairingNotes: string;      // Food pairing suggestions
  mealToHaveWithThisWine: string; // Suggested meals
  style: string;                 // Wine style
  grapes: string;                // Grape varieties
  status: 'in_cellar' | 'consumed' | 'sold' | 'gifted';
  consumedDate: string | null;   // When consumed
  notes: string;                 // Personal notes
  rating: number | null;         // Personal rating (1-5)
  price: number | null;          // Purchase price
  location: string;              // Storage location
  quantity: number;              // Number of bottles
}
```

## 🔧 API Endpoints

### GET `/api/wines`
- **Query Parameters**: `country`, `style`, `vintage`, `status`, `search`
- **Response**: Filtered list of wines

### POST `/api/wines`
- **Body**: Wine data for new wine
- **Response**: Created wine object

### GET `/api/wines/[id]`
- **Response**: Single wine by ID

### PUT `/api/wines/[id]`
- **Body**: Updated wine data
- **Response**: Updated wine object

### DELETE `/api/wines/[id]`
- **Response**: Success message

## 🎯 Usage Examples

### Adding a New Wine
1. Click the "Add Wine" button in the header
2. Fill out the comprehensive form with wine details
3. Submit to add the wine to your cellar

### Marking a Wine as Consumed
1. Find the wine in the table
2. Click the calendar icon (📅) in the Actions column
3. Confirm the consumption
4. Add a rating and notes if desired

### Filtering Your Collection
1. Use the filter dropdowns for Country, Style, Vintage, and Status
2. Use the search bar for text-based searches
3. Clear filters using the "Clear" button

### Editing Wine Information
1. Click the edit icon (✏️) in the Actions column
2. Modify any wine details
3. Save changes

## 🎨 Customization

### Styling
- **Tailwind CSS**: Easy to customize colors, spacing, and components
- **Wine Theme**: Custom wine color palette in `tailwind.config.js`
- **Component Classes**: Reusable CSS classes in `globals.css`

### Adding New Fields
1. Update the `Wine` interface in `types/wine.ts`
2. Modify the forms in `AddWineModal.tsx` and `WineModal.tsx`
3. Update the table display in `WineTable.tsx`
4. Add validation in the form components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Wine Data**: Initial dataset based on a curated wine collection
- **Icons**: [Lucide React](https://lucide.dev/) for beautiful icons
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for modern design
- **Framework**: [Next.js](https://nextjs.org/) for the application framework

## 📞 Support

If you have any questions or need help with the Wine Cellar Manager, please:
- Open an issue on GitHub
- Check the existing documentation
- Review the code examples

---

**Happy wine collecting! 🍷✨**
