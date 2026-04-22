import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function formatDistance(meters: number): string { return meters<1000 ? `${Math.round(meters)}م` : `${(meters/1000).toFixed(1)}كم` }
export function calculateFare(distanceKm: number): number { return Math.round((2.5 + distanceKm*1.5)*100)/100 }
