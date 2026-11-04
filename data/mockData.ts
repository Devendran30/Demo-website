export interface Student {
  id: string;
  name: string;
  grade: string;
  attendance: string;
  performance: string;
  feesStatus: 'Paid' | 'Pending';
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  email: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
}

export const initialStudents: Student[] = [
  { id: '1', name: 'Aarav Sharma', grade: '10th A', attendance: '95%', performance: 'A', feesStatus: 'Paid' },
  { id: '2', name: 'Diya Patel', grade: '10th A', attendance: '92%', performance: 'B+', feesStatus: 'Pending' },
  { id: '3', name: 'Rohan Gupta', grade: '9th B', attendance: '88%', performance: 'A-', feesStatus: 'Paid' },
];

export const initialTeachers: Teacher[] = [
  { id: 't1', name: 'Mr. Rajesh Kumar', subject: 'Mathematics', email: 'rajesh@school.edu' },
  { id: 't2', name: 'Ms. Priya Singh', subject: 'Science', email: 'priya@school.edu' },
];

export const initialAnnouncements: Announcement[] = [
  { id: 'a1', title: 'Annual Sports Meet', date: '2026-08-20', content: 'Annual sports meet scheduled for next week.' },
  { id: 'a2', title: 'Parent-Teacher Meeting', date: '2026-08-25', content: 'PTM will be held in the main auditorium.' },
];