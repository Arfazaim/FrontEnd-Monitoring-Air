import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Fungsi 'cn' (Class Name) digunakan oleh Shadcn/UI 
 * untuk menggabungkan class Tailwind CSS secara efisien.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}