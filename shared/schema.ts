import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Audio files table
export const audioFiles = pgTable("audio_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalPath: text("original_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  userId: integer("user_id").references(() => users.id),
  detectedGenre: text("detected_genre"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAudioFileSchema = createInsertSchema(audioFiles, {
  filename: (schema) => schema.min(1, "Filename is required"),
  originalPath: (schema) => schema.min(1, "Original path is required"),
  fileSize: (schema) => schema.positive("File size must be positive"),
  mimeType: (schema) => schema.refine(
    (val) => ["audio/mpeg", "audio/wav", "audio/mp3", "audio/wave", "audio/x-wav"].includes(val),
    "File must be an MP3 or WAV"
  ),
});

export type InsertAudioFile = z.infer<typeof insertAudioFileSchema>;
export type AudioFile = typeof audioFiles.$inferSelect;

// Transformations table
export const transformations = pgTable("transformations", {
  id: serial("id").primaryKey(),
  audioFileId: integer("audio_file_id").references(() => audioFiles.id).notNull(),
  targetGenre: text("target_genre").notNull(),
  transformedPath: text("transformed_path"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertTransformationSchema = createInsertSchema(transformations, {
  targetGenre: (schema) => schema.min(1, "Target genre is required"),
});

export type InsertTransformation = z.infer<typeof insertTransformationSchema>;
export type Transformation = typeof transformations.$inferSelect;

// Relationships
export const audioFilesRelations = relations(audioFiles, ({ one, many }) => ({
  user: one(users, {
    fields: [audioFiles.userId],
    references: [users.id],
  }),
  transformations: many(transformations),
}));

export const transformationsRelations = relations(transformations, ({ one }) => ({
  audioFile: one(audioFiles, {
    fields: [transformations.audioFileId],
    references: [audioFiles.id],
  }),
}));
