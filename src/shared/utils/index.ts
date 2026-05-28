export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export {
  readTruthSource,
  writeTruthSource,
  validateTruthSourceData,
  TruthSourceValidationError,
} from './markdown-parser';
