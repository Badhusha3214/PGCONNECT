// Choices shared by the List Property form and the owner dashboard editors.
// ROOM_TYPES must match the property_rooms.type CHECK constraint in
// backend/supabase-schema.sql (and ROOM_TYPES in the Worker).
export const ROOM_TYPES = ["Single", "Double", "Triple", "4 Sharing", "5+ Sharing"];

// "Double" -> "Double sharing"; types that already say "Sharing" are left alone.
export const roomLabel = (type) => (/sharing/i.test(type || "") ? type : `${type} sharing`);
export const GENDERS = ["Boys", "Girls", "Co-ed"];
export const AMENITIES = ["Wi-Fi", "AC", "Meals", "Laundry", "Kitchen", "Security", "Gym", "Parking"];
