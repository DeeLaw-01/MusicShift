import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isAudioFile(file: File): boolean {
  const acceptedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/wave', 'audio/x-wav'];
  return acceptedTypes.includes(file.type);
}

export const GENRES = [
  { id: 'rock', name: 'Rock', icon: 'electric_guitar' },
  { id: 'pop', name: 'Pop', icon: 'music_note' },
  { id: 'jazz', name: 'Jazz', icon: 'piano' },
  { id: 'classical', name: 'Classical', icon: 'music_note' },
  { id: 'electronic', name: 'Electronic', icon: 'speaker' },
  { id: 'hiphop', name: 'Hip Hop', icon: 'headphones' },
  { id: 'reggae', name: 'Reggae', icon: 'music_note' },
  { id: 'country', name: 'Country', icon: 'music_note' }
];
