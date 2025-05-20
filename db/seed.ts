import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Define storage paths
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const TRANSFORMATIONS_DIR = path.join(process.cwd(), "transformations");

// Ensure directories exist
for (const dir of [UPLOADS_DIR, TRANSFORMATIONS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Seed genres
const genres = [
  { id: 'rock', name: 'Rock', icon: 'electric_guitar' },
  { id: 'pop', name: 'Pop', icon: 'music_note' },
  { id: 'jazz', name: 'Jazz', icon: 'piano' },
  { id: 'classical', name: 'Classical', icon: 'music_note' },
  { id: 'electronic', name: 'Electronic', icon: 'speaker' },
  { id: 'hiphop', name: 'Hip Hop', icon: 'headphones' },
  { id: 'reggae', name: 'Reggae', icon: 'music_note' },
  { id: 'country', name: 'Country', icon: 'music_note' }
];

async function seed() {
  try {
    console.log("Starting to seed database...");
    
    // Check if the database tables exist
    try {
      const tablesExist = await db.query.audioFiles.findFirst();
      console.log("Tables already exist in database.");
    } catch (err) {
      console.log("Tables don't exist yet, pushing schema...");
      // The db:push script should be run separately
    }
    
    // Check if users table has any data
    const usersExist = await db.query.users.findFirst();
    
    if (!usersExist) {
      console.log("Adding default user...");
      await db.insert(schema.users).values({
        username: "demo",
        password: "password123", // In production, this would be hashed
      });
    }

    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
