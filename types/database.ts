// Kept in sync with supabase/migrations/*.sql.
export type Cellar = { id: string; name: string; locale: 'en' | 'pt'; created_at: string };
export type WineRow = {
  id: string;
  cellar_id: string;
  bottle: string;
  country: string;
  region: string;
  vintage: number;
  drinking_window: string;
  peak_year: string;
  food_pairing_notes: string;
  meal_suggestion: string;
  style: string;
  grapes: string;
  status: 'in_cellar' | 'consumed' | 'sold' | 'gifted';
  consumed_date: string | null;
  notes: string;
  rating: number | null;
  // Optional for projects that have not run the critic-rating import yet.
  critic_rating?: number | null;
  critic_ratings?: unknown;
  price: number | null;
  location: string;
  quantity: number;
  technical_sheet_url: string | null;
  bottle_image_url: string | null;
  from_cellar: boolean;
  coravin: boolean;
  coravin_date: string | null;
  created_at: string;
  updated_at: string;
};

export type WineWrite = Omit<WineRow, 'id' | 'cellar_id' | 'created_at' | 'updated_at'>;
type Table<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
type Membership = { cellar_id: string; user_id: string; role: 'owner' | 'member'; created_at: string };
export type CellarPerson = { id: string; cellar_id: string; user_id: string | null; name: string; email: string; created_at: string };
export type Person = CellarPerson & { isMe: boolean; active: boolean };
export type WineParticipant = { cellar_id: string; wine_id: string; person_id: string };
export type WineReview = WineParticipant & { rating: number | null; comment: string; created_at: string; updated_at: string };
export type TastingInput = { quantity: number; consumedDate: string; personIds: string[]; rating: number | null; comment: string };
export type CellarFridge = { id: string; cellar_id: string; name: string; level_count: number; first_level: number };
export type StorageLocation = { cellar_id: string; label: string; fridge_id: string | null; level: number | null };
export type CellarStorage = { fridges: CellarFridge[]; locations: StorageLocation[] };
export type FridgeInput = { id?: string; name: string; levelCount: number; firstLevel: number };
export type Database = {
  public: {
    Tables: {
      cellar_fridges: Table<CellarFridge, never, never>;
      cellar_storage_locations: Table<StorageLocation, never, never>;
      cellars: Table<Cellar, Omit<Cellar, 'created_at'>, Partial<Omit<Cellar, 'created_at'>>>;
      cellar_members: Table<Membership, Omit<Membership, 'created_at' | 'role'> & { role?: 'owner' | 'member' }, never>;
      wines: Table<WineRow, WineWrite & { id?: string; cellar_id: string }, Partial<WineWrite>>;
      cellar_people: Table<CellarPerson, never, never>;
      wine_participants: Table<WineParticipant, never, never>;
      wine_reviews: Table<WineReview, Omit<WineReview, 'created_at' | 'updated_at'>, Partial<WineReview>>;
    };
    Views: { [_ in never]: never };
    Functions: {
      save_cellar_fridge: {
        Args: { p_cellar_id: string; p_name: string; p_level_count: number; p_first_level?: number; p_id?: string };
        Returns: string;
      };
      delete_cellar_fridge: { Args: { p_cellar_id: string; p_id: string }; Returns: undefined };
      add_wine_participants: {
        Args: { p_cellar_id: string; p_wine_id: string; p_person_ids: string[] };
        Returns: undefined;
      };
      consume_wine: {
        Args: { p_cellar_id: string; p_wine_id: string; p_quantity: number; p_consumed_date: string; p_person_ids: string[]; p_rating?: number | null; p_comment?: string };
        Returns: WineRow[];
      };
      log_consumed_wine: {
        Args: { p_cellar_id: string; p_wine: WineWrite; p_person_ids: string[]; p_rating?: number | null; p_comment?: string };
        Returns: WineRow;
      };
      save_cellar_person: {
        Args: { p_cellar_id: string; p_name: string; p_email: string; p_person_id?: string; p_allow_pending?: boolean };
        Returns: CellarPerson;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
