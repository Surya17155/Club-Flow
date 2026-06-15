export type QuestionType =
  | 'short'
  | 'long'
  | 'mcq'
  | 'checkbox'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'rating'
  | 'linear'
  | 'yesno'
  | 'file'
  | 'image';

export interface QuestionConfig {
  scaleMax?: number; // for rating / linear
  maxFileSizeMB?: number;
  acceptedTypes?: string; // comma list e.g. ".pdf,.docx"
}

export interface FormQuestion {
  id: string;
  form_id: string;
  position: number;
  type: QuestionType;
  label: string;
  description: string | null;
  required: boolean;
  options: string[];
  config: QuestionConfig;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short: 'Short Answer',
  long: 'Long Answer',
  mcq: 'Multiple Choice',
  checkbox: 'Checkboxes',
  dropdown: 'Dropdown',
  date: 'Date',
  time: 'Time',
  rating: 'Rating',
  linear: 'Linear Scale',
  yesno: 'Yes / No',
  file: 'File Upload',
  image: 'Image Upload',
};

export const NEEDS_OPTIONS: QuestionType[] = ['mcq', 'checkbox', 'dropdown'];
export const IS_FILE: QuestionType[] = ['file', 'image'];

export const PROFILE_SNAPSHOT_FIELDS = [
  'full_name',
  'email',
  'roll_no',
  'programme',
  'section',
  'semester',
  'year',
  'phone',
] as const;
