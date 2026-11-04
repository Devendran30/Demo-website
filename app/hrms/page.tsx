'use client';

import { useState } from 'react';

/* ============================================================================
   HRMS PORTAL — Demo
   Single-file demo: shared login + Employee Console + Management Panel
   ============================================================================ */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Employee {
  id: string;
  empId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
}

interface ProjectItem {
  id: string;
  name: string;
  client: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  progress: number;
  deadline: string;
  team: string[];
  description: string;
}

interface DocItem {
  id: string;
  name: string;
  category: 'ID Proof' | 'Address Proof' | 'Education' | 'Experience Letter' | 'Other';
  status: 'Pending' | 'Submitted' | 'Verified' | 'Rejected';
  uploadedOn?: string;
}

interface AttendanceDay {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hours?: string;
  workSummary?: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Weekend';
}

interface LeaveRequest {
  id: string;
  employeeName: string;
  empId: string;
  type: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Unpaid Leave';
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  appliedOn: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  day: string;
  type: 'National' | 'Festival' | 'Optional';
}

interface Payslip {
  id: string;
  month: string;
  year: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: 'Paid' | 'Processing';
  paidOn?: string;
}

interface RoleConfig {
  id: string;
  name: string;
  permissions: string[];
  employeeCount: number;
}

interface EmailRecord {
  id: string;
  subject: string;
  to: string;
  body: string;
  sentOn: string;
  status: 'Sent' | 'Opened' | 'Failed';
  opens: number;
}

interface AttendanceSummaryRow {
  empId: string;
  name: string;
  department: string;
  present: number;
  absent: number;
  workingDays: number;
}

interface SubAdminItem {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  status: 'Active' | 'Suspended';
}

interface CredentialRow {
  empId: string;
  name: string;
  email: string;
  tempPassword: string;
  access: 'Enabled' | 'Disabled';
  lastLogin: string;
}

type Role = 'employee' | 'admin' | null;
type EmployeeTab =
  | 'dashboard' | 'documentation' | 'projects' | 'attendance' | 'leaves' | 'calendar' | 'payslips';
type AdminTab =
  | 'dashboard' | 'roles' | 'projects' | 'employees' | 'emails' | 'email-tracking'
  | 'attendance' | 'leave-approvals' | 'calendar' | 'payroll' | 'access' | 'sub-admin';

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&bold=true&font-size=0.4`;

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Opened: 'bg-sky-50 text-sky-700 border-sky-200',
    Submitted: 'bg-sky-50 text-sky-700 border-sky-200',
    'In Progress': 'bg-sky-50 text-sky-700 border-sky-200',
    Processing: 'bg-amber-50 text-amber-700 border-amber-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'Half Day': 'bg-amber-50 text-amber-700 border-amber-200',
    Planning: 'bg-amber-50 text-amber-700 border-amber-200',
    Inactive: 'bg-rose-50 text-rose-700 border-rose-200',
    Absent: 'bg-rose-50 text-rose-700 border-rose-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    Failed: 'bg-rose-50 text-rose-700 border-rose-200',
    Disabled: 'bg-rose-50 text-rose-700 border-rose-200',
    Suspended: 'bg-rose-50 text-rose-700 border-rose-200',
    'On Hold': 'bg-rose-50 text-rose-700 border-rose-200',
    Weekend: 'bg-slate-100 text-slate-500 border-slate-200',
    Completed: 'bg-violet-50 text-violet-700 border-violet-200',
    Enabled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#e7e7ee] rounded-[28px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </div>
  );
}

function EmptyState({ icon, title, note }: { icon: string; title: string; note: string }) {
  return (
    <div className="py-14 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="font-bold text-[#14141f] text-[15px]">{title}</p>
      <p className="text-[13px] text-[#6b6b76] font-medium mt-1">{note}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function HRMSPortal() {
  // Auth
  const [role, setRole] = useState<Role>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  // Nav
  const [empTab, setEmpTab] = useState<EmployeeTab>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ---------------------------------------------------------------------
  // Mock data
  // ---------------------------------------------------------------------
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 'e1', empId: 'RKV-1042', name: 'Ananya Reddy', email: 'ananya.reddy@Demo.in', department: 'Engineering', designation: 'Frontend Developer', role: 'Employee', joinDate: '2024-02-12', status: 'Active' },
    { id: 'e2', empId: 'RKV-1043', name: 'Karthik Iyer', email: 'karthik.iyer@Demo.in', department: 'Engineering', designation: 'Backend Developer', role: 'Employee', joinDate: '2023-11-04', status: 'Active' },
    { id: 'e3', empId: 'RKV-1044', name: 'Meera Nair', email: 'meera.nair@Demo.in', department: 'Design', designation: 'UI/UX Designer', role: 'Employee', joinDate: '2024-05-20', status: 'Active' },
    { id: 'e4', empId: 'RKV-1045', name: 'Suresh Pillai', email: 'suresh.pillai@Demo.in', department: 'QA', designation: 'QA Engineer', role: 'Employee', joinDate: '2023-08-01', status: 'Active' },
    { id: 'e5', empId: 'RKV-1046', name: 'Divya Krishnan', email: 'divya.krishnan@Demo.in', department: 'HR', designation: 'HR Executive', role: 'Employee', joinDate: '2024-01-15', status: 'Inactive' },
    { id: 'e6', empId: 'RKV-1001', name: 'Priya Sharma', email: 'admin@Demo.in', department: 'Management', designation: 'HR Manager', role: 'Admin', joinDate: '2021-06-01', status: 'Active' },
  ]);

  const [projects, setProjects] = useState<ProjectItem[]>([
    { id: 'p1', name: 'Demo Client Portal Revamp', client: 'Internal', status: 'In Progress', progress: 68, deadline: '2026-10-15', team: ['Ananya Reddy', 'Karthik Iyer'], description: 'Redesign the client-facing portal with a new component system and faster load times.' },
    { id: 'p2', name: 'Nimbus Retail — POS Integration', client: 'Nimbus Retail', status: 'In Progress', progress: 42, deadline: '2026-11-02', team: ['Karthik Iyer', 'Suresh Pillai'], description: 'Integrate the in-store POS terminals with the central inventory service.' },
    { id: 'p3', name: 'Orbit Health App', client: 'Orbit Health', status: 'Planning', progress: 10, deadline: '2026-12-20', team: ['Meera Nair'], description: 'Patient scheduling and records app for a chain of clinics.' },
    { id: 'p4', name: 'Ferro Logistics Dashboard', client: 'Ferro Logistics', status: 'Completed', progress: 100, deadline: '2026-08-05', team: ['Ananya Reddy', 'Suresh Pillai', 'Meera Nair'], description: 'Fleet tracking dashboard with live GPS and delivery SLAs.' },
  ]);

  const [documents, setDocuments] = useState<DocItem[]>([
    { id: 'd1', name: 'Aadhaar Card', category: 'ID Proof', status: 'Verified', uploadedOn: '2024-02-14' },
    { id: 'd2', name: 'PAN Card', category: 'ID Proof', status: 'Verified', uploadedOn: '2024-02-14' },
    { id: 'd3', name: 'Rental Agreement', category: 'Address Proof', status: 'Submitted', uploadedOn: '2026-08-30' },
    { id: 'd4', name: 'Degree Certificate', category: 'Education', status: 'Pending' },
    { id: 'd5', name: 'Relieving Letter — Previous Employer', category: 'Experience Letter', status: 'Rejected', uploadedOn: '2026-08-10' },
  ]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<DocItem['category']>('Other');

  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceDay[]>([
    { id: 'a1', date: '2026-09-06', checkIn: '09:42 AM', checkOut: '06:51 PM', hours: '9h 09m', workSummary: 'Shipped the leave-approval flow and fixed two dashboard chart bugs.', status: 'Present' },
    { id: 'a2', date: '2026-09-05', checkIn: '09:38 AM', checkOut: '06:40 PM', hours: '9h 02m', workSummary: 'Paired with Karthik on the POS integration API contract.', status: 'Present' },
    { id: 'a3', date: '2026-09-04', checkIn: '10:05 AM', checkOut: '02:15 PM', hours: '4h 10m', workSummary: 'Half day — attended a family function in the afternoon.', status: 'Half Day' },
    { id: 'a4', date: '2026-09-03', checkIn: '09:30 AM', checkOut: '06:35 PM', hours: '9h 05m', workSummary: 'Client portal revamp: component library cleanup.', status: 'Present' },
    { id: 'a5', date: '2026-09-02', status: 'Absent', workSummary: 'On approved sick leave.' },
  ]);
  const [checkInState, setCheckInState] = useState<'idle' | 'checked-in' | 'checked-out'>('idle');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [captureStage, setCaptureStage] = useState<'idle' | 'capturing' | 'captured'>('idle');
  const [todayWorkNote, setTodayWorkNote] = useState('');

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    { id: 'l1', employeeName: 'Ananya Reddy', empId: 'RKV-1042', type: 'Casual Leave', fromDate: '2026-09-15', toDate: '2026-09-16', days: 2, reason: 'Attending a cousin\u2019s wedding out of town.', appliedOn: '2026-09-04', status: 'Pending' },
    { id: 'l2', employeeName: 'Karthik Iyer', empId: 'RKV-1043', type: 'Sick Leave', fromDate: '2026-09-08', toDate: '2026-09-08', days: 1, reason: 'Fever and needs rest.', appliedOn: '2026-09-06', status: 'Pending' },
    { id: 'l3', employeeName: 'Meera Nair', empId: 'RKV-1044', type: 'Earned Leave', fromDate: '2026-08-20', toDate: '2026-08-22', days: 3, reason: 'Pre-planned family trip.', appliedOn: '2026-08-05', status: 'Approved' },
    { id: 'l4', employeeName: 'Suresh Pillai', empId: 'RKV-1045', type: 'Unpaid Leave', fromDate: '2026-08-12', toDate: '2026-08-12', days: 1, reason: 'Personal errand, insufficient leave balance.', appliedOn: '2026-08-04', status: 'Rejected' },
  ]);
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('Casual Leave');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFormError, setLeaveFormError] = useState('');

  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: 'h1', name: 'Gandhi Jayanti', date: '2026-10-02', day: 'Friday', type: 'National' },
    { id: 'h2', name: 'Dussehra', date: '2026-10-20', day: 'Tuesday', type: 'Festival' },
    { id: 'h3', name: 'Diwali', date: '2026-11-08', day: 'Sunday', type: 'Festival' },
    { id: 'h4', name: 'Kannada Rajyotsava', date: '2026-11-01', day: 'Sunday', type: 'Optional' },
    { id: 'h5', name: 'Christmas', date: '2026-12-25', day: 'Friday', type: 'National' },
  ]);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayType, setNewHolidayType] = useState<Holiday['type']>('National');

  const [payslips] = useState<Payslip[]>([
    { id: 'ps1', month: 'August', year: '2026', basic: 45000, hra: 18000, allowances: 6000, deductions: 5200, netPay: 63800, status: 'Paid', paidOn: '2026-09-01' },
    { id: 'ps2', month: 'July', year: '2026', basic: 45000, hra: 18000, allowances: 6000, deductions: 5200, netPay: 63800, status: 'Paid', paidOn: '2026-08-01' },
    { id: 'ps3', month: 'June', year: '2026', basic: 45000, hra: 18000, allowances: 4000, deductions: 5200, netPay: 61800, status: 'Paid', paidOn: '2026-07-01' },
    { id: 'ps4', month: 'September', year: '2026', basic: 45000, hra: 18000, allowances: 6000, deductions: 5200, netPay: 63800, status: 'Processing' },
  ]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([
    { id: 'r1', name: 'Frontend Developer', permissions: ['Projects', 'Attendance', 'Leaves'], employeeCount: 4 },
    { id: 'r2', name: 'Backend Developer', permissions: ['Projects', 'Attendance', 'Leaves'], employeeCount: 3 },
    { id: 'r3', name: 'UI/UX Designer', permissions: ['Projects', 'Attendance', 'Leaves'], employeeCount: 2 },
    { id: 'r4', name: 'HR Executive', permissions: ['Employees', 'Leaves', 'Payroll', 'Attendance'], employeeCount: 1 },
  ]);
  const [newRoleName, setNewRoleName] = useState('');
  const allPermissions = ['Projects', 'Attendance', 'Leaves', 'Employees', 'Payroll', 'Emails'];
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);

  const [emails, setEmails] = useState<EmailRecord[]>([
    { id: 'em1', subject: 'Welcome to Demo — Onboarding Checklist', to: 'ananya.reddy@Demo.in', body: 'Hi Ananya, welcome aboard! Please complete the checklist attached...', sentOn: '2026-09-05 11:20 AM', status: 'Opened', opens: 3 },
    { id: 'em2', subject: 'September Payroll Processed', to: 'all-employees@Demo.in', body: 'Hi team, your September payslip is now available in the portal.', sentOn: '2026-09-01 09:05 AM', status: 'Sent', opens: 0 },
    { id: 'em3', subject: 'Leave Request Approved', to: 'meera.nair@Demo.in', body: 'Hi Meera, your leave request from Aug 20 to Aug 22 has been approved.', sentOn: '2026-08-06 03:40 PM', status: 'Opened', opens: 1 },
    { id: 'em4', subject: 'Reminder: Submit Pending Documents', to: 'suresh.pillai@Demo.in', body: 'Hi Suresh, a reminder to upload your pending documents this week.', sentOn: '2026-08-28 10:00 AM', status: 'Failed', opens: 0 },
  ]);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const attendanceSummary: AttendanceSummaryRow[] = [
    { empId: 'RKV-1042', name: 'Ananya Reddy', department: 'Engineering', present: 21, absent: 1, workingDays: 22 },
    { empId: 'RKV-1043', name: 'Karthik Iyer', department: 'Engineering', present: 22, absent: 0, workingDays: 22 },
    { empId: 'RKV-1044', name: 'Meera Nair', department: 'Design', present: 19, absent: 3, workingDays: 22 },
    { empId: 'RKV-1045', name: 'Suresh Pillai', department: 'QA', present: 20, absent: 2, workingDays: 22 },
    { empId: 'RKV-1046', name: 'Divya Krishnan', department: 'HR', present: 15, absent: 7, workingDays: 22 },
  ];

  const [subAdmins, setSubAdmins] = useState<SubAdminItem[]>([
    { id: 'sa1', name: 'Rahul Menon', email: 'rahul.menon@Demo.in', permissions: ['Employees', 'Attendance', 'Leaves'], status: 'Active' },
    { id: 'sa2', name: 'Kavya Das', email: 'kavya.das@Demo.in', permissions: ['Payroll', 'Emails'], status: 'Active' },
  ]);
  const [newSubAdminName, setNewSubAdminName] = useState('');
  const [newSubAdminEmail, setNewSubAdminEmail] = useState('');
  const [newSubAdminPerms, setNewSubAdminPerms] = useState<string[]>([]);

  const credentials: CredentialRow[] = employees
    .filter((e) => e.role === 'Employee')
    .map((e) => ({
      empId: e.empId,
      name: e.name,
      email: e.email,
      tempPassword: 'Rkv@' + e.empId.split('-')[1],
      access: e.status === 'Active' ? 'Enabled' : 'Disabled',
      lastLogin: '2026-09-06 09:41 AM',
    }));
  const [accessOverrides, setAccessOverrides] = useState<Record<string, 'Enabled' | 'Disabled'>>({});

  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjDeadline, setNewProjDeadline] = useState('');
  const [newProjTeam, setNewProjTeam] = useState<string[]>([]);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Engineering');
  const [newEmpDesignation, setNewEmpDesignation] = useState('');

  const [payrollMonth, setPayrollMonth] = useState('September 2026');
  const [payrollUpdates, setPayrollUpdates] = useState<Record<string, number>>({});

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------
  const handleLogin = () => {
    if (loginEmail === 'employee@Demo.in' && loginPassword === 'employee123') {
      setRole('employee');
      setCurrentUserName('Ananya Reddy');
      setLoginError('');
    } else if (loginEmail === 'admin@Demo.in' && loginPassword === 'admin123') {
      setRole('admin');
      setCurrentUserName('Priya Sharma');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Use one of the demo logins below.');
    }
  };

  const fillDemo = (which: 'employee' | 'admin') => {
    if (which === 'employee') {
      setLoginEmail('employee@Demo.in');
      setLoginPassword('employee123');
    } else {
      setLoginEmail('admin@Demo.in');
      setLoginPassword('admin123');
    }
    setLoginError('');
  };

  const handleLogout = () => {
    setRole(null);
    setLoginEmail('');
    setLoginPassword('');
    setEmpTab('dashboard');
    setAdminTab('dashboard');
  };

  const handleCheckIn = () => {
    setCaptureStage('capturing');
    setTimeout(() => {
      setCaptureStage('captured');
      const now = new Date();
      setCheckInTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCheckInState('checked-in');
    }, 1400);
  };

  const handleCheckOut = () => {
    const now = new Date();
    setCheckOutTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setCheckInState('checked-out');
    setAttendanceHistory([
      {
        id: `a-${Date.now()}`,
        date: 'Today',
        checkIn: checkInTime,
        checkOut: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hours: '—',
        workSummary: todayWorkNote || 'No summary added.',
        status: 'Present',
      },
      ...attendanceHistory,
    ]);
  };

  const daysBetween = (from: string, to: string) => {
    if (!from || !to) return 0;
    const diff = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 ? diff + 1 : 0;
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveFormError('');
    if (!leaveFrom || !leaveTo || !leaveReason.trim()) {
      setLeaveFormError('Please fill in the dates and a reason.');
      return;
    }
    const today = new Date('2026-09-07');
    const fromDate = new Date(leaveFrom);
    const noticeDays = (fromDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (noticeDays < 7) {
      setLeaveFormError('Leaves must be applied at least one week (7 days) in advance. Choose a later start date, or contact HR directly for urgent cases.');
      return;
    }
    setLeaveRequests([
      {
        id: `l-${Date.now()}`,
        employeeName: currentUserName,
        empId: 'RKV-1042',
        type: leaveType,
        fromDate: leaveFrom,
        toDate: leaveTo,
        days: daysBetween(leaveFrom, leaveTo),
        reason: leaveReason,
        appliedOn: '2026-09-07',
        status: 'Pending',
      },
      ...leaveRequests,
    ]);
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReason('');
  };

  const handleAddDocument = () => {
    if (!newDocName.trim()) return;
    setDocuments([
      { id: `d-${Date.now()}`, name: newDocName, category: newDocCategory, status: 'Submitted', uploadedOn: '2026-09-07' },
      ...documents,
    ]);
    setNewDocName('');
  };

  const handleAddHoliday = () => {
    if (!newHolidayName.trim() || !newHolidayDate) return;
    const dayName = new Date(newHolidayDate).toLocaleDateString('en-US', { weekday: 'long' });
    setHolidays([
      ...holidays,
      { id: `h-${Date.now()}`, name: newHolidayName, date: newHolidayDate, day: dayName, type: newHolidayType },
    ].sort((a, b) => a.date.localeCompare(b.date)));
    setNewHolidayName('');
    setNewHolidayDate('');
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    setRoleConfigs([
      ...roleConfigs,
      { id: `r-${Date.now()}`, name: newRoleName, permissions: newRolePerms, employeeCount: 0 },
    ]);
    setNewRoleName('');
    setNewRolePerms([]);
  };

  const handleSendEmail = () => {
    if (!composeTo.trim() || !composeSubject.trim()) return;
    setEmails([
      { id: `em-${Date.now()}`, subject: composeSubject, to: composeTo, body: composeBody, sentOn: 'Just now', status: 'Sent', opens: 0 },
      ...emails,
    ]);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
  };

  const handleLeaveDecision = (id: string, decision: 'Approved' | 'Rejected') => {
    setLeaveRequests(leaveRequests.map((l) => (l.id === id ? { ...l, status: decision } : l)));
  };

  const toggleAccess = (empId: string) => {
    setAccessOverrides((prev) => ({
      ...prev,
      [empId]: (prev[empId] || credentials.find((c) => c.empId === empId)?.access) === 'Enabled' ? 'Disabled' : 'Enabled',
    }));
  };

  const handleAddProject = () => {
    if (!newProjName.trim() || !newProjClient.trim()) return;
    setProjects([
      { id: `p-${Date.now()}`, name: newProjName, client: newProjClient, status: 'Planning', progress: 0, deadline: newProjDeadline || 'TBD', team: newProjTeam, description: 'New project — details to be added.' },
      ...projects,
    ]);
    setNewProjName('');
    setNewProjClient('');
    setNewProjDeadline('');
    setNewProjTeam([]);
    setIsAddProjectModalOpen(false);
  };

  const handleAddEmployee = () => {
    if (!newEmpName.trim() || !newEmpEmail.trim()) return;
    const nextNum = 1047 + employees.filter((e) => e.role === 'Employee').length;
    setEmployees([
      ...employees,
      { id: `e-${Date.now()}`, empId: `RKV-${nextNum}`, name: newEmpName, email: newEmpEmail, department: newEmpDept, designation: newEmpDesignation || 'Team Member', role: 'Employee', joinDate: '2026-09-07', status: 'Active' },
    ]);
    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpDesignation('');
    setIsAddEmployeeModalOpen(false);
  };

  const staffCount = employees.filter((e) => e.role === 'Employee').length;

  // =======================================================================
  // LOGIN SCREEN
  // =======================================================================
  if (!role) {
    return (
      <div
        className="min-h-screen bg-[#f4f5fb] flex items-center justify-center p-4 antialiased"
        style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25 mb-4">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-[#14141f]">Demo HRMS</h1>
            <p className="text-[13px] text-[#6b6b76] font-medium mt-1">Sign in to your workspace</p>
          </div>

          <SectionCard className="p-7">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#6b6b76] uppercase tracking-wide mb-1.5">Work email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="you@Demo.in"
                  className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[14px] text-[#14141f] focus:outline-none focus:bg-white focus:border-[#4f46e5] transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6b6b76] uppercase tracking-wide mb-1.5">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[14px] text-[#14141f] focus:outline-none focus:bg-white focus:border-[#4f46e5] transition-all font-medium"
                />
              </div>

              {loginError && (
                <p className="text-rose-600 text-[13px] font-semibold bg-rose-50 px-4 py-2.5 rounded-xl">{loginError}</p>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[14px] rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
              >
                Sign in
              </button>
            </div>
          </SectionCard>

          {/* Demo credentials */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => fillDemo('employee')}
              className="text-left p-4 bg-white hover:border-[#4f46e5] border border-[#e7e7ee] rounded-2xl transition-all group"
            >
              <p className="text-[10px] font-extrabold text-[#4f46e5] uppercase tracking-wider mb-2">Demo — Employee Console</p>
              <p className="text-[12px] font-semibold text-[#6b6b76]">employee@Demo.in</p>
              <p className="text-[12px] font-semibold text-[#6b6b76]">employee123</p>
              <span className="text-[11px] font-bold text-[#4f46e5] mt-2 inline-block group-hover:underline">Fill this in →</span>
            </button>
            <button
              onClick={() => fillDemo('admin')}
              className="text-left p-4 bg-white hover:border-[#4f46e5] border border-[#e7e7ee] rounded-2xl transition-all group"
            >
              <p className="text-[10px] font-extrabold text-[#7c3aed] uppercase tracking-wider mb-2">Demo — Management Panel</p>
              <p className="text-[12px] font-semibold text-[#6b6b76]">admin@Demo.in</p>
              <p className="text-[12px] font-semibold text-[#6b6b76]">admin123</p>
              <span className="text-[11px] font-bold text-[#7c3aed] mt-2 inline-block group-hover:underline">Fill this in →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // SHARED CHROME (Sidebar + Header) — content switches on `role`
  // =======================================================================
  const empNavItems: { id: EmployeeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
    { id: 'documentation', label: 'Documentation Process', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
    { id: 'projects', label: 'My Projects', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> },
    { id: 'attendance', label: 'Attendance', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
    { id: 'leaves', label: 'Apply Leaves', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    { id: 'calendar', label: 'Holidays & Calendar', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg> },
    { id: 'payslips', label: 'My Payslips', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg> },
  ];

  const adminNavItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
    { id: 'roles', label: 'Role Configurations', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg> },
    { id: 'projects', label: 'Project List', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> },
    { id: 'employees', label: 'Employee List', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    { id: 'emails', label: 'Emails', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" /><path d="m4 6 8 7 8-7" /></svg> },
    { id: 'email-tracking', label: 'Email Tracking', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
    { id: 'attendance', label: 'Attendance Tracking', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
    { id: 'leave-approvals', label: 'Leave Approvals', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg> },
    { id: 'calendar', label: 'Holidays & Calendar', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    { id: 'payroll', label: 'Payroll & Salary', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
    { id: 'access', label: 'Employee Access', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> },
    { id: 'sub-admin', label: 'Sub Admin', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /><path d="M19 8h3M20.5 6.5v3" /></svg> },
  ];

  const navItems = role === 'employee' ? empNavItems : adminNavItems;
  const activeId = role === 'employee' ? empTab : adminTab;
  const setActive = (id: string) => {
    if (role === 'employee') setEmpTab(id as EmployeeTab);
    else setAdminTab(id as AdminTab);
    setIsMobileSidebarOpen(false);
  };
  const portalLabel = role === 'employee' ? 'Employee Console' : 'Management Panel';
  const activeLabel = navItems.find((n) => n.id === activeId)?.label || '';

  return (
    <div
      className="min-h-screen bg-[#f4f5fb] text-[#14141f] flex antialiased selection:bg-indigo-100 selection:text-[#4f46e5]"
      style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-[270px] min-w-[270px] bg-white border-r border-[#e7e7ee] flex flex-col justify-between h-screen z-40 transition-transform duration-300 ${isMobileSidebarOpen ? 'fixed top-0 bottom-0 left-0 translate-x-0' : 'fixed top-0 bottom-0 left-0 -translate-x-full md:translate-x-0 md:sticky md:top-0'}`}>
        <div className="overflow-y-auto px-4 pt-7 pb-4">
          <div className="flex items-center gap-3 px-2 pb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <div>
              <p className="font-extrabold text-[15px] tracking-tight leading-none">Demo HRMS</p>
              <p className="text-[11px] text-[#6b6b76] font-semibold mt-1">{portalLabel}</p>
            </div>
          </div>

          <nav className="space-y-1 text-[14px]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 ${activeId === item.id ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold shadow-sm' : 'text-[#4b4b58] font-semibold hover:bg-[#f4f5fb]'}`}
              >
                <span className="opacity-80 flex-shrink-0">{item.icon}</span>
                <span className="leading-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#e7e7ee]">
          <div className="flex items-center gap-3 px-2 pb-4">
            <img src={avatarUrl(currentUserName)} alt={currentUserName} className="w-9 h-9 rounded-full" />
            <div className="min-w-0">
              <p className="font-bold text-[13px] truncate">{currentUserName}</p>
              <p className="text-[11px] text-[#6b6b76] font-medium">{role === 'employee' ? 'RKV-1042' : 'RKV-1001'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-[#f4f5fb] hover:bg-rose-50 text-[#4b4b58] hover:text-rose-600 font-bold rounded-xl text-[13px] transition-all flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 pt-16 md:pt-6 md:p-9 lg:p-10 overflow-y-auto max-h-screen">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="fixed top-4 left-4 z-20 md:hidden w-10 h-10 bg-white border border-[#e7e7ee] rounded-full flex items-center justify-center shadow-md"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14141f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileSidebarOpen ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)}
          </svg>
        </button>

        <div className="max-w-6xl mx-auto space-y-7">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-[#e7e7ee]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#8a8a95] uppercase tracking-wide mb-1">
                <span>{portalLabel}</span><span>/</span><span className="text-[#4f46e5]">{activeLabel}</span>
              </div>
              <h1 className="text-2xl md:text-[28px] font-extrabold tracking-tight">{activeLabel}</h1>
            </div>
            <span className="px-3.5 py-1.5 bg-white border border-[#e7e7ee] text-[#14141f] rounded-full text-[12px] font-bold shadow-sm flex items-center gap-2 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sep 7, 2026
            </span>
          </header>

          {role === 'employee' ? (
            <EmployeeContent
              tab={empTab}
              currentUserName={currentUserName}
              documents={documents}
              newDocName={newDocName} setNewDocName={setNewDocName}
              newDocCategory={newDocCategory} setNewDocCategory={setNewDocCategory}
              handleAddDocument={handleAddDocument}
              projects={projects}
              attendanceHistory={attendanceHistory}
              checkInState={checkInState} checkInTime={checkInTime} checkOutTime={checkOutTime}
              captureStage={captureStage}
              todayWorkNote={todayWorkNote} setTodayWorkNote={setTodayWorkNote}
              handleCheckIn={handleCheckIn} handleCheckOut={handleCheckOut}
              leaveRequests={leaveRequests.filter((l) => l.empId === 'RKV-1042')}
              leaveType={leaveType} setLeaveType={setLeaveType}
              leaveFrom={leaveFrom} setLeaveFrom={setLeaveFrom}
              leaveTo={leaveTo} setLeaveTo={setLeaveTo}
              leaveReason={leaveReason} setLeaveReason={setLeaveReason}
              leaveFormError={leaveFormError}
              handleApplyLeave={handleApplyLeave}
              holidays={holidays}
              payslips={payslips}
              selectedPayslip={selectedPayslip} setSelectedPayslip={setSelectedPayslip}
            />
          ) : (
            <AdminContent
              tab={adminTab}
              employees={employees}
              projects={projects}
              roleConfigs={roleConfigs}
              newRoleName={newRoleName} setNewRoleName={setNewRoleName}
              allPermissions={allPermissions}
              newRolePerms={newRolePerms} setNewRolePerms={setNewRolePerms}
              handleAddRole={handleAddRole}
              isAddProjectModalOpen={isAddProjectModalOpen} setIsAddProjectModalOpen={setIsAddProjectModalOpen}
              newProjName={newProjName} setNewProjName={setNewProjName}
              newProjClient={newProjClient} setNewProjClient={setNewProjClient}
              newProjDeadline={newProjDeadline} setNewProjDeadline={setNewProjDeadline}
              newProjTeam={newProjTeam} setNewProjTeam={setNewProjTeam}
              handleAddProject={handleAddProject}
              isAddEmployeeModalOpen={isAddEmployeeModalOpen} setIsAddEmployeeModalOpen={setIsAddEmployeeModalOpen}
              newEmpName={newEmpName} setNewEmpName={setNewEmpName}
              newEmpEmail={newEmpEmail} setNewEmpEmail={setNewEmpEmail}
              newEmpDept={newEmpDept} setNewEmpDept={setNewEmpDept}
              newEmpDesignation={newEmpDesignation} setNewEmpDesignation={setNewEmpDesignation}
              handleAddEmployee={handleAddEmployee}
              emails={emails}
              composeTo={composeTo} setComposeTo={setComposeTo}
              composeSubject={composeSubject} setComposeSubject={setComposeSubject}
              composeBody={composeBody} setComposeBody={setComposeBody}
              handleSendEmail={handleSendEmail}
              attendanceSummary={attendanceSummary}
              leaveRequests={leaveRequests}
              handleLeaveDecision={handleLeaveDecision}
              holidays={holidays}
              newHolidayName={newHolidayName} setNewHolidayName={setNewHolidayName}
              newHolidayDate={newHolidayDate} setNewHolidayDate={setNewHolidayDate}
              newHolidayType={newHolidayType} setNewHolidayType={setNewHolidayType}
              handleAddHoliday={handleAddHoliday}
              setHolidays={setHolidays}
              payrollMonth={payrollMonth} setPayrollMonth={setPayrollMonth}
              payrollUpdates={payrollUpdates} setPayrollUpdates={setPayrollUpdates}
              credentials={credentials}
              accessOverrides={accessOverrides} toggleAccess={toggleAccess}
              subAdmins={subAdmins} setSubAdmins={setSubAdmins}
              newSubAdminName={newSubAdminName} setNewSubAdminName={setNewSubAdminName}
              newSubAdminEmail={newSubAdminEmail} setNewSubAdminEmail={setNewSubAdminEmail}
              newSubAdminPerms={newSubAdminPerms} setNewSubAdminPerms={setNewSubAdminPerms}
              staffCount={staffCount}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// EMPLOYEE CONSOLE CONTENT
// =============================================================================
function EmployeeContent(props: any) {
  const {
    tab, currentUserName, documents, newDocName, setNewDocName, newDocCategory, setNewDocCategory, handleAddDocument,
    projects, attendanceHistory, checkInState, checkInTime, checkOutTime, captureStage, todayWorkNote, setTodayWorkNote,
    handleCheckIn, handleCheckOut, leaveRequests, leaveType, setLeaveType, leaveFrom, setLeaveFrom, leaveTo, setLeaveTo,
    leaveReason, setLeaveReason, leaveFormError, handleApplyLeave, holidays, payslips, selectedPayslip, setSelectedPayslip,
  } = props;

  if (tab === 'dashboard') {
    const stats = [
      { label: 'Present This Month', value: '21 / 22', sub: '95% attendance', icon: '🗓️' },
      { label: 'Active Projects', value: projects.filter((p: ProjectItem) => p.status === 'In Progress').length.toString(), sub: 'Across the team', icon: '📁' },
      { label: 'Leave Balance', value: '9 days', sub: 'Casual + Earned', icon: '🌴' },
      { label: 'Pending Documents', value: documents.filter((d: DocItem) => d.status === 'Pending').length.toString(), sub: 'Needs your action', icon: '📄' },
    ];
    return (
      <div className="space-y-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <SectionCard key={i} className="p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-bold text-[#8a8a95] uppercase tracking-wide">{s.label}</p>
                <span className="text-lg p-2 bg-[#f4f5fb] rounded-lg">{s.icon}</span>
              </div>
              <p className="text-[26px] font-extrabold tracking-tight">{s.value}</p>
              <p className="text-[12px] text-[#6b6b76] font-medium mt-1.5">{s.sub}</p>
            </SectionCard>
          ))}
        </div>

        <SectionCard className="p-7">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Your attendance — last 7 days</h3>
              <p className="text-[12px] text-[#6b6b76] font-medium mt-0.5">Hours logged each working day</p>
            </div>
          </div>
          <div className="h-52 flex items-end justify-between gap-2 px-1">
            {[8.9, 9.1, 4.1, 9.0, 0, 9.2, 9.0].map((h, i) => (
              <div key={i} className="w-full bg-[#f4f5fb] rounded-t-lg relative h-full flex items-end">
                <div className="w-full bg-gradient-to-t from-[#4f46e5] to-[#7c3aed] rounded-t-lg opacity-85" style={{ height: `${(h / 9.5) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[11px] font-bold text-[#8a8a95] uppercase tracking-wide px-1">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Today</span>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard className="p-7">
            <h3 className="text-lg font-bold tracking-tight mb-4">Your projects</h3>
            <div className="space-y-3">
              {projects.slice(0, 3).map((p: ProjectItem) => (
                <div key={p.id} className="p-4 bg-[#f4f5fb] rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-[13px]">{p.name}</span>
                    <StatusPill status={p.status} />
                  </div>
                  <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-[#e7e7ee]">
                    <div className="h-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="p-7">
            <h3 className="text-lg font-bold tracking-tight mb-4">Upcoming holiday</h3>
            {holidays.length > 0 ? (
              <div className="p-5 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-2xl text-white">
                <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{holidays[0].type} Holiday</p>
                <p className="text-xl font-extrabold mt-1">{holidays[0].name}</p>
                <p className="text-[13px] font-medium opacity-90 mt-1">{holidays[0].date} · {holidays[0].day}</p>
              </div>
            ) : <EmptyState icon="🌴" title="No holidays scheduled" note="Check back later." />}
            <p className="text-[12px] text-[#6b6b76] font-medium mt-4">Reminder: leave requests need at least a week's notice — plan ahead of long weekends.</p>
          </SectionCard>
        </div>
      </div>
    );
  }

  if (tab === 'documentation') {
    return (
      <div className="space-y-6">
        <SectionCard className="p-7">
          <h3 className="text-lg font-bold tracking-tight mb-1">Send a document to the company</h3>
          <p className="text-[13px] text-[#6b6b76] font-medium mb-5">Upload ID proofs, certificates, or letters requested by HR.</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3">
            <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="Document name (e.g. Passport Copy)" className="px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[14px] font-medium focus:outline-none focus:bg-white focus:border-[#4f46e5]" />
            <select value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)} className="px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[14px] font-semibold focus:outline-none focus:bg-white focus:border-[#4f46e5]">
              {['ID Proof', 'Address Proof', 'Education', 'Experience Letter', 'Other'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={handleAddDocument} className="px-6 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[13px] rounded-xl shadow-md">Upload & Submit</button>
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
                <tr>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Document</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Category</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Uploaded</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f5]">
                {documents.map((d: DocItem) => (
                  <tr key={d.id} className="hover:bg-[#f4f5fb]/60">
                    <td className="py-3.5 px-3 font-bold">{d.name}</td>
                    <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{d.category}</td>
                    <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{d.uploadedOn || '—'}</td>
                    <td className="py-3.5 px-3"><StatusPill status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (tab === 'projects') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((p: ProjectItem) => (
          <SectionCard key={p.id} className="p-7">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-[16px] leading-snug">{p.name}</h4>
                <p className="text-[12px] text-[#6b6b76] font-medium mt-0.5">Client: {p.client}</p>
              </div>
              <StatusPill status={p.status} />
            </div>
            <p className="text-[13px] text-[#4b4b58] font-medium leading-relaxed mb-4">{p.description}</p>
            <div className="mb-3">
              <div className="flex justify-between text-[12px] font-bold mb-1.5">
                <span className="text-[#6b6b76]">Progress</span><span className="text-[#4f46e5]">{p.progress}%</span>
              </div>
              <div className="w-full bg-[#f4f5fb] rounded-full h-2.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-[#f0f0f5]">
              <div className="flex -space-x-2">
                {p.team.map((t) => <img key={t} src={avatarUrl(t)} alt={t} title={t} className="w-7 h-7 rounded-full border-2 border-white" />)}
              </div>
              <span className="text-[12px] font-bold text-[#6b6b76]">Due {p.deadline}</span>
            </div>
          </SectionCard>
        ))}
      </div>
    );
  }

  if (tab === 'attendance') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <SectionCard className="lg:col-span-2 p-7 space-y-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Today — Sep 7, 2026</h3>
            <p className="text-[12px] text-[#6b6b76] font-medium mt-0.5">Check in with a photo, then log what you worked on.</p>
          </div>

          <div className="h-44 bg-[#14141f] rounded-2xl relative overflow-hidden flex flex-col items-center justify-center text-white border-2 border-dashed border-[#4f46e5]/50">
            {captureStage === 'capturing' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] font-bold text-violet-300">Capturing photo…</span>
              </div>
            ) : captureStage === 'captured' ? (
              <div className="text-center space-y-1.5">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-black uppercase">Photo Captured</span>
                <p className="text-[13px] font-bold text-neutral-200">Checked in at {checkInTime}</p>
              </div>
            ) : (
              <div className="text-center text-neutral-400 text-[13px] font-medium">Camera preview appears here</div>
            )}
          </div>

          {checkInState === 'idle' && (
            <button onClick={handleCheckIn} className="w-full py-3.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[14px] rounded-xl shadow-md">Check In with Photo</button>
          )}
          {checkInState === 'checked-in' && (
            <>
              <div className="p-3.5 bg-[#f4f5fb] rounded-xl flex justify-between text-[13px] font-semibold">
                <span className="text-[#6b6b76]">Checked in</span><span className="text-[#14141f] font-bold">{checkInTime}</span>
              </div>
              <textarea rows={3} value={todayWorkNote} onChange={(e) => setTodayWorkNote(e.target.value)} placeholder="What are you working on today?" className="w-full p-4 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#4f46e5] resize-none" />
              <button onClick={handleCheckOut} className="w-full py-3.5 bg-[#14141f] hover:bg-black text-white font-bold text-[14px] rounded-xl shadow-md">Check Out</button>
            </>
          )}
          {checkInState === 'checked-out' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <p className="font-bold text-emerald-700 text-[14px]">Day complete ✓</p>
              <p className="text-[12px] text-emerald-700 font-medium mt-1">{checkInTime} – {checkOutTime}</p>
            </div>
          )}
        </SectionCard>

        <SectionCard className="lg:col-span-3 p-6">
          <h3 className="text-lg font-bold tracking-tight mb-4 px-1">Recent history</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
                <tr>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Date</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">In / Out</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Work Summary</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f5]">
                {attendanceHistory.map((a: AttendanceDay) => (
                  <tr key={a.id}>
                    <td className="py-3 px-3 font-bold whitespace-nowrap">{a.date}</td>
                    <td className="py-3 px-3 text-[#6b6b76] font-medium whitespace-nowrap">{a.checkIn ? `${a.checkIn} – ${a.checkOut}` : '—'}</td>
                    <td className="py-3 px-3 text-[#4b4b58] font-medium max-w-xs">{a.workSummary}</td>
                    <td className="py-3 px-3"><StatusPill status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (tab === 'leaves') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <SectionCard className="lg:col-span-2 p-7">
          <h3 className="text-lg font-bold tracking-tight mb-1">Apply for leave</h3>
          <p className="text-[12px] text-[#6b6b76] font-medium mb-5">Must be submitted at least 7 days before the start date.</p>
          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#8a8a95] uppercase tracking-wide mb-1.5">Leave type</label>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-semibold focus:outline-none focus:bg-white focus:border-[#4f46e5]">
                {['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#8a8a95] uppercase tracking-wide mb-1.5">From</label>
                <input type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} className="w-full px-3 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-semibold focus:outline-none focus:bg-white focus:border-[#4f46e5]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#8a8a95] uppercase tracking-wide mb-1.5">To</label>
                <input type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} className="w-full px-3 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-semibold focus:outline-none focus:bg-white focus:border-[#4f46e5]" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8a8a95] uppercase tracking-wide mb-1.5">Reason</label>
              <textarea rows={3} value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Briefly explain the reason for your leave" className="w-full p-4 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#4f46e5] resize-none" />
            </div>
            {leaveFormError && <p className="text-rose-600 text-[12px] font-semibold bg-rose-50 px-4 py-2.5 rounded-xl">{leaveFormError}</p>}
            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[14px] rounded-xl shadow-md">Submit Request</button>
          </form>
        </SectionCard>

        <SectionCard className="lg:col-span-3 p-6">
          <h3 className="text-lg font-bold tracking-tight mb-4 px-1">Your leave history</h3>
          {leaveRequests.length === 0 ? <EmptyState icon="🌴" title="No leave requests yet" note="Requests you submit will appear here." /> : (
            <div className="space-y-3">
              {leaveRequests.map((l: LeaveRequest) => (
                <div key={l.id} className="p-4 bg-[#f4f5fb] rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <span className="font-bold text-[13px]">{l.type}</span>
                    <p className="text-[12px] text-[#6b6b76] font-medium mt-0.5">{l.fromDate} → {l.toDate} · {l.days} day(s)</p>
                    <p className="text-[12px] text-[#4b4b58] font-medium mt-1 max-w-md">{l.reason}</p>
                  </div>
                  <StatusPill status={l.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  if (tab === 'calendar') {
    return (
      <SectionCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
              <tr>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Holiday</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Date</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Day</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f5]">
              {holidays.map((h: Holiday) => (
                <tr key={h.id} className="hover:bg-[#f4f5fb]/60">
                  <td className="py-3.5 px-3 font-bold">{h.name}</td>
                  <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{h.date}</td>
                  <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{h.day}</td>
                  <td className="py-3.5 px-3"><StatusPill status={h.type} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    );
  }

  if (tab === 'payslips') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {payslips.map((p: Payslip) => (
          <SectionCard key={p.id} className="p-7 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-[17px]">{p.month} {p.year}</h4>
                  <p className="text-[12px] text-[#6b6b76] font-medium mt-0.5">{p.status === 'Paid' ? `Paid on ${p.paidOn}` : 'Processing this month'}</p>
                </div>
                <StatusPill status={p.status} />
              </div>
              <p className="text-[28px] font-extrabold tracking-tight text-[#4f46e5]">₹{p.netPay.toLocaleString()}</p>
              <p className="text-[12px] text-[#6b6b76] font-medium mt-1">Net pay</p>
            </div>
            <button onClick={() => setSelectedPayslip(p)} className="mt-5 w-full py-3 bg-[#f4f5fb] hover:bg-[#e9e9f4] text-[#4f46e5] font-bold text-[13px] rounded-xl transition-all">View Breakdown</button>
          </SectionCard>
        ))}

        {selectedPayslip && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedPayslip(null)}>
            <div className="bg-white rounded-[28px] p-8 max-w-sm w-full shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{selectedPayslip.month} {selectedPayslip.year} Payslip</h3>
                <button onClick={() => setSelectedPayslip(null)} className="w-8 h-8 rounded-full bg-[#f4f5fb] hover:bg-[#e7e7ee] flex items-center justify-center font-bold">✕</button>
              </div>
              <div className="space-y-2.5 text-[13px] font-semibold">
                <div className="flex justify-between"><span className="text-[#6b6b76]">Basic Pay</span><span>₹{selectedPayslip.basic.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#6b6b76]">HRA</span><span>₹{selectedPayslip.hra.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#6b6b76]">Allowances</span><span>₹{selectedPayslip.allowances.toLocaleString()}</span></div>
                <div className="flex justify-between text-rose-600"><span>Deductions</span><span>−₹{selectedPayslip.deductions.toLocaleString()}</span></div>
                <div className="pt-3 border-t border-[#e7e7ee] flex justify-between text-[16px] font-extrabold"><span>Net Pay</span><span className="text-[#4f46e5]">₹{selectedPayslip.netPay.toLocaleString()}</span></div>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="w-full py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[13px] rounded-xl">Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// =============================================================================
// MANAGEMENT PANEL CONTENT
// =============================================================================
function AdminContent(props: any) {
  const {
    tab, employees, projects, roleConfigs, newRoleName, setNewRoleName, allPermissions, newRolePerms, setNewRolePerms,
    handleAddRole, isAddProjectModalOpen, setIsAddProjectModalOpen, newProjName, setNewProjName, newProjClient, setNewProjClient,
    newProjDeadline, setNewProjDeadline, newProjTeam, setNewProjTeam, handleAddProject, isAddEmployeeModalOpen,
    setIsAddEmployeeModalOpen, newEmpName, setNewEmpName, newEmpEmail, setNewEmpEmail, newEmpDept, setNewEmpDept,
    newEmpDesignation, setNewEmpDesignation, handleAddEmployee, emails, composeTo, setComposeTo, composeSubject,
    setComposeSubject, composeBody, setComposeBody, handleSendEmail, attendanceSummary, leaveRequests, handleLeaveDecision,
    holidays, newHolidayName, setNewHolidayName, newHolidayDate, setNewHolidayDate, newHolidayType, setNewHolidayType,
    handleAddHoliday, setHolidays, payrollMonth, setPayrollMonth, payrollUpdates, setPayrollUpdates, credentials,
    accessOverrides, toggleAccess, subAdmins, setSubAdmins, newSubAdminName, setNewSubAdminName, newSubAdminEmail,
    setNewSubAdminEmail, newSubAdminPerms, setNewSubAdminPerms, staffCount,
  } = props;

  if (tab === 'dashboard') {
    const stats = [
      { label: 'Total Employees', value: staffCount.toString(), sub: '5 departments', icon: '🧑\u200d💼' },
      { label: 'Active Projects', value: projects.filter((p: ProjectItem) => p.status === 'In Progress').length.toString(), sub: `${projects.length} total`, icon: '📁' },
      { label: 'Pending Leaves', value: leaveRequests.filter((l: LeaveRequest) => l.status === 'Pending').length.toString(), sub: 'Awaiting decision', icon: '🗓️' },
      { label: 'Payroll This Month', value: '₹3.18L', sub: 'Across all staff', icon: '💰' },
    ];
    return (
      <div className="space-y-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <SectionCard key={i} className="p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-bold text-[#8a8a95] uppercase tracking-wide">{s.label}</p>
                <span className="text-lg p-2 bg-[#f4f5fb] rounded-lg">{s.icon}</span>
              </div>
              <p className="text-[26px] font-extrabold tracking-tight">{s.value}</p>
              <p className="text-[12px] text-[#6b6b76] font-medium mt-1.5">{s.sub}</p>
            </SectionCard>
          ))}
        </div>

        <SectionCard className="p-7">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Attendance across the company</h3>
              <p className="text-[12px] text-[#6b6b76] font-medium mt-0.5">Present days this month, out of 22 working days</p>
            </div>
          </div>
          <div className="space-y-3">
            {attendanceSummary.map((row: AttendanceSummaryRow) => (
              <div key={row.empId} className="flex items-center gap-4">
                <div className="w-36 text-[13px] font-bold truncate">{row.name}</div>
                <div className="flex-1 bg-[#f4f5fb] rounded-full h-3 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-full" style={{ width: `${(row.present / row.workingDays) * 100}%` }} />
                </div>
                <div className="w-20 text-right text-[12px] font-extrabold text-[#4f46e5]">{row.present}/{row.workingDays}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard className="p-7">
            <h3 className="text-lg font-bold tracking-tight mb-4">Leave requests awaiting review</h3>
            <div className="space-y-3">
              {leaveRequests.filter((l: LeaveRequest) => l.status === 'Pending').slice(0, 3).map((l: LeaveRequest) => (
                <div key={l.id} className="p-4 bg-[#f4f5fb] rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[13px]">{l.employeeName}</span>
                    <p className="text-[12px] text-[#6b6b76] font-medium">{l.type} · {l.days} day(s)</p>
                  </div>
                  <StatusPill status={l.status} />
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard className="p-7">
            <h3 className="text-lg font-bold tracking-tight mb-4">Recently sent emails</h3>
            <div className="space-y-3">
              {emails.slice(0, 3).map((em: EmailRecord) => (
                <div key={em.id} className="p-4 bg-[#f4f5fb] rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[13px] truncate max-w-[70%]">{em.subject}</span>
                    <StatusPill status={em.status} />
                  </div>
                  <p className="text-[12px] text-[#6b6b76] font-medium mt-1">To {em.to}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  if (tab === 'roles') {
    return (
      <div className="space-y-6">
        <SectionCard className="p-7">
          <h3 className="text-lg font-bold tracking-tight mb-1">Create a role</h3>
          <p className="text-[12px] text-[#6b6b76] font-medium mb-5">Define what each role can access in the portal.</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mb-4">
            <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role name (e.g. Product Manager)" className="px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[14px] font-medium focus:outline-none focus:bg-white focus:border-[#4f46e5]" />
            <button onClick={handleAddRole} className="px-6 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[13px] rounded-xl shadow-md">Create Role</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allPermissions.map((perm: string) => (
              <button key={perm} onClick={() => setNewRolePerms((prev: string[]) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm])} className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all ${newRolePerms.includes(perm) ? 'bg-[#4f46e5] text-white border-transparent' : 'bg-[#f4f5fb] text-[#6b6b76] border-[#e7e7ee]'}`}>{perm}</button>
            ))}
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roleConfigs.map((r: RoleConfig) => (
            <SectionCard key={r.id} className="p-6">
              <h4 className="font-bold text-[15px] mb-1">{r.name}</h4>
              <p className="text-[12px] text-[#6b6b76] font-medium mb-3">{r.employeeCount} employee(s)</p>
              <div className="flex flex-wrap gap-1.5">
                {r.permissions.map((p) => <span key={p} className="px-2.5 py-1 bg-[#f4f5fb] text-[#4b4b58] rounded-full text-[11px] font-bold">{p}</span>)}
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'projects') {
    const employeeNames = employees.filter((e: Employee) => e.role === 'Employee').map((e: Employee) => e.name);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-5 rounded-[24px] border border-[#e7e7ee]">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Project List</h3>
            <p className="text-[12px] text-[#6b6b76] font-medium">{projects.length} projects on file</p>
          </div>
          <button onClick={() => setIsAddProjectModalOpen(true)} className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-full text-[13px] font-bold shadow-md">+ New Project</button>
        </div>

        <SectionCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
                <tr>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Project</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Client</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Team</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Deadline</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f5]">
                {projects.map((p: ProjectItem) => (
                  <tr key={p.id} className="hover:bg-[#f4f5fb]/60">
                    <td className="py-3.5 px-3 font-bold">{p.name}</td>
                    <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{p.client}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex -space-x-2">{p.team.map((t) => <img key={t} src={avatarUrl(t)} title={t} className="w-7 h-7 rounded-full border-2 border-white" />)}</div>
                    </td>
                    <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{p.deadline}</td>
                    <td className="py-3.5 px-3"><StatusPill status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {isAddProjectModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddProjectModalOpen(false)}>
            <div className="bg-white rounded-[28px] p-8 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Allocate a new project</h3>
                <button onClick={() => setIsAddProjectModalOpen(false)} className="w-8 h-8 rounded-full bg-[#f4f5fb] hover:bg-[#e7e7ee] flex items-center justify-center font-bold">✕</button>
              </div>
              <input type="text" value={newProjName} onChange={(e) => setNewProjName(e.target.value)} placeholder="Project name" className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
              <input type="text" value={newProjClient} onChange={(e) => setNewProjClient(e.target.value)} placeholder="Client name" className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
              <input type="date" value={newProjDeadline} onChange={(e) => setNewProjDeadline(e.target.value)} className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
              <div className="flex flex-wrap gap-2">
                {employeeNames.map((n: string) => (
                  <button key={n} onClick={() => setNewProjTeam((prev: string[]) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n])} className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${newProjTeam.includes(n) ? 'bg-[#4f46e5] text-white border-transparent' : 'bg-[#f4f5fb] text-[#6b6b76] border-[#e7e7ee]'}`}>{n}</button>
                ))}
              </div>
              <button onClick={handleAddProject} className="w-full py-3.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[13px] rounded-xl shadow-md">Allocate Project</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (tab === 'employees') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-5 rounded-[24px] border border-[#e7e7ee]">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Employee List</h3>
            <p className="text-[12px] text-[#6b6b76] font-medium">{employees.length} people on record</p>
          </div>
          <button onClick={() => setIsAddEmployeeModalOpen(true)} className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-full text-[13px] font-bold shadow-md">+ Add Employee</button>
        </div>

        <SectionCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
                <tr>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Employee</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">ID</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Department</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Joined</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f5]">
                {employees.map((e: Employee) => (
                  <tr key={e.id} className="hover:bg-[#f4f5fb]/60">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <img src={avatarUrl(e.name)} className="w-9 h-9 rounded-full" />
                        <div>
                          <span className="font-bold block">{e.name}</span>
                          <span className="text-[11px] text-[#8a8a95] font-medium">{e.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#4f46e5] text-[12px]">{e.empId}</td>
                    <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{e.department}</td>
                    <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{e.joinDate}</td>
                    <td className="py-3.5 px-3"><StatusPill status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {isAddEmployeeModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddEmployeeModalOpen(false)}>
            <div className="bg-white rounded-[28px] p-8 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Add employee</h3>
                <button onClick={() => setIsAddEmployeeModalOpen(false)} className="w-8 h-8 rounded-full bg-[#f4f5fb] hover:bg-[#e7e7ee] flex items-center justify-center font-bold">✕</button>
              </div>
              <input type="text" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} placeholder="Full name" className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
              <input type="email" value={newEmpEmail} onChange={(e) => setNewEmpEmail(e.target.value)} placeholder="Work email" className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
              <select value={newEmpDept} onChange={(e) => setNewEmpDept(e.target.value)} className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-semibold">
                {['Engineering', 'Design', 'QA', 'HR', 'Management'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="text" value={newEmpDesignation} onChange={(e) => setNewEmpDesignation(e.target.value)} placeholder="Designation" className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
              <button onClick={handleAddEmployee} className="w-full py-3.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[13px] rounded-xl shadow-md">Add to Roster</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (tab === 'emails') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <SectionCard className="lg:col-span-2 p-7">
          <h3 className="text-lg font-bold tracking-tight mb-5">Compose email</h3>
          <div className="space-y-4">
            <input type="text" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="To (employee email or 'all-employees@Demo.in')" className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
            <input type="text" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject" className="w-full px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
            <textarea rows={6} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your message…" className="w-full p-4 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium resize-none" />
            <button onClick={handleSendEmail} className="w-full py-3.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[14px] rounded-xl shadow-md">Send Email</button>
          </div>
        </SectionCard>
        <SectionCard className="lg:col-span-3 p-6">
          <h3 className="text-lg font-bold tracking-tight mb-4 px-1">Recently sent</h3>
          <div className="space-y-3">
            {emails.slice(0, 5).map((em: EmailRecord) => (
              <div key={em.id} className="p-4 bg-[#f4f5fb] rounded-2xl">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-[13px]">{em.subject}</span>
                  <StatusPill status={em.status} />
                </div>
                <p className="text-[12px] text-[#6b6b76] font-medium mt-1">To {em.to} · {em.sentOn}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  if (tab === 'email-tracking') {
    return (
      <SectionCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
              <tr>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Subject</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Recipient</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Sent</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Opens</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f5]">
              {emails.map((em: EmailRecord) => (
                <tr key={em.id} className="hover:bg-[#f4f5fb]/60">
                  <td className="py-3.5 px-3 font-bold">{em.subject}</td>
                  <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{em.to}</td>
                  <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{em.sentOn}</td>
                  <td className="py-3.5 px-3 font-bold">{em.opens}</td>
                  <td className="py-3.5 px-3"><StatusPill status={em.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    );
  }

  if (tab === 'attendance') {
    return (
      <SectionCard className="p-6">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-bold tracking-tight">Monthly attendance — September 2026</h3>
          <span className="px-3.5 py-1.5 bg-[#f4f5fb] text-[#4f46e5] rounded-full text-[12px] font-bold">22 working days</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
              <tr>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Employee</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Department</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Present</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Absent</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f5]">
              {attendanceSummary.map((row: AttendanceSummaryRow) => (
                <tr key={row.empId} className="hover:bg-[#f4f5fb]/60">
                  <td className="py-3.5 px-3 font-bold">{row.name}</td>
                  <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{row.department}</td>
                  <td className="py-3.5 px-3 font-bold text-emerald-600">{row.present}</td>
                  <td className="py-3.5 px-3 font-bold text-rose-600">{row.absent}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-[#f4f5fb] rounded-full h-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-full" style={{ width: `${(row.present / row.workingDays) * 100}%` }} /></div>
                      <span className="font-bold text-[12px]">{Math.round((row.present / row.workingDays) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    );
  }

  if (tab === 'leave-approvals') {
    return (
      <SectionCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
              <tr>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Employee</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Type</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Dates</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Reason</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Status</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f5]">
              {leaveRequests.map((l: LeaveRequest) => (
                <tr key={l.id} className="hover:bg-[#f4f5fb]/60">
                  <td className="py-3.5 px-3">
                    <span className="font-bold block">{l.employeeName}</span>
                    <span className="text-[11px] text-[#8a8a95] font-medium">{l.empId}</span>
                  </td>
                  <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{l.type}</td>
                  <td className="py-3.5 px-3 text-[#6b6b76] font-medium whitespace-nowrap">{l.fromDate} → {l.toDate}</td>
                  <td className="py-3.5 px-3 text-[#4b4b58] font-medium max-w-xs">{l.reason}</td>
                  <td className="py-3.5 px-3"><StatusPill status={l.status} /></td>
                  <td className="py-3.5 px-3 text-right">
                    {l.status === 'Pending' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleLeaveDecision(l.id, 'Approved')} className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-[12px] font-bold">Approve</button>
                        <button onClick={() => handleLeaveDecision(l.id, 'Rejected')} className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full text-[12px] font-bold">Reject</button>
                      </div>
                    ) : <span className="text-[12px] text-[#8a8a95] font-medium">Decided</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    );
  }

  if (tab === 'calendar') {
    return (
      <div className="space-y-6">
        <SectionCard className="p-7">
          <h3 className="text-lg font-bold tracking-tight mb-1">Add a holiday</h3>
          <p className="text-[12px] text-[#6b6b76] font-medium mb-5">Published holidays appear on every employee's calendar.</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="text" value={newHolidayName} onChange={(e) => setNewHolidayName(e.target.value)} placeholder="Holiday name" className="px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
            <input type="date" value={newHolidayDate} onChange={(e) => setNewHolidayDate(e.target.value)} className="px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
            <select value={newHolidayType} onChange={(e) => setNewHolidayType(e.target.value)} className="px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-semibold">
              {['National', 'Festival', 'Optional'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={handleAddHoliday} className="px-6 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[13px] rounded-xl shadow-md">Add Holiday</button>
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
                <tr>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Holiday</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Date</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Type</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f5]">
                {holidays.map((h: Holiday) => (
                  <tr key={h.id} className="hover:bg-[#f4f5fb]/60">
                    <td className="py-3.5 px-3 font-bold">{h.name}</td>
                    <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{h.date} · {h.day}</td>
                    <td className="py-3.5 px-3"><StatusPill status={h.type} /></td>
                    <td className="py-3.5 px-3 text-right">
                      <button onClick={() => setHolidays((prev: Holiday[]) => prev.filter((x) => x.id !== h.id))} className="text-rose-500 hover:text-rose-700 text-[12px] font-bold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (tab === 'payroll') {
    const activeStaff = employees.filter((e: Employee) => e.role === 'Employee');
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-5 rounded-[24px] border border-[#e7e7ee]">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Payroll & Salary</h3>
            <p className="text-[12px] text-[#6b6b76] font-medium">Update and release this month's pay</p>
          </div>
          <select value={payrollMonth} onChange={(e) => setPayrollMonth(e.target.value)} className="px-4 py-2.5 bg-[#f4f5fb] border border-[#e7e7ee] rounded-full text-[13px] font-bold">
            {['September 2026', 'August 2026', 'July 2026'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <SectionCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
                <tr>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Employee</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Department</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Net Pay (₹)</th>
                  <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f5]">
                {activeStaff.map((e: Employee) => {
                  const base = 63800;
                  const value = payrollUpdates[e.id] ?? base;
                  return (
                    <tr key={e.id} className="hover:bg-[#f4f5fb]/60">
                      <td className="py-3.5 px-3 font-bold">{e.name}</td>
                      <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{e.department}</td>
                      <td className="py-3.5 px-3">
                        <input
                          type="number"
                          value={value}
                          onChange={(ev) => setPayrollUpdates((prev: Record<string, number>) => ({ ...prev, [e.id]: parseFloat(ev.target.value) || 0 }))}
                          className="w-28 px-3 py-1.5 bg-[#f4f5fb] border border-[#e7e7ee] rounded-lg text-[13px] font-bold"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button onClick={() => alert(`Payslip released to ${e.name} for ${payrollMonth}: ₹${value.toLocaleString()}`)} className="px-4 py-1.5 bg-[#f4f5fb] hover:bg-[#e9e9f4] text-[#4f46e5] rounded-full text-[12px] font-bold">Release Payslip</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (tab === 'access') {
    return (
      <SectionCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[#8a8a95] border-b border-[#e7e7ee]">
              <tr>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Employee</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Login Email</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Temp Password</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Last Login</th>
                <th className="pb-3 pt-1 px-3 font-bold uppercase text-[11px] tracking-wide">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f5]">
              {credentials.map((c: CredentialRow) => {
                const access = accessOverrides[c.empId] || c.access;
                return (
                  <tr key={c.empId} className="hover:bg-[#f4f5fb]/60">
                    <td className="py-3.5 px-3 font-bold">{c.name} <span className="text-[11px] text-[#8a8a95] font-medium">({c.empId})</span></td>
                    <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{c.email}</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[12px]">{c.tempPassword}</td>
                    <td className="py-3.5 px-3 text-[#6b6b76] font-medium">{c.lastLogin}</td>
                    <td className="py-3.5 px-3">
                      <button onClick={() => toggleAccess(c.empId)} className="flex items-center gap-2">
                        <StatusPill status={access} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    );
  }

  if (tab === 'sub-admin') {
    return (
      <div className="space-y-6">
        <SectionCard className="p-7">
          <h3 className="text-lg font-bold tracking-tight mb-1">Create sub admin</h3>
          <p className="text-[12px] text-[#6b6b76] font-medium mb-5">Sub admins get scoped access to specific modules only.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input type="text" value={newSubAdminName} onChange={(e) => setNewSubAdminName(e.target.value)} placeholder="Full name" className="px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
            <input type="email" value={newSubAdminEmail} onChange={(e) => setNewSubAdminEmail(e.target.value)} placeholder="Work email" className="px-4 py-3 bg-[#f4f5fb] border border-[#e7e7ee] rounded-xl text-[13px] font-medium" />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {allPermissions.map((perm: string) => (
              <button key={perm} onClick={() => setNewSubAdminPerms((prev: string[]) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm])} className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border ${newSubAdminPerms.includes(perm) ? 'bg-[#4f46e5] text-white border-transparent' : 'bg-[#f4f5fb] text-[#6b6b76] border-[#e7e7ee]'}`}>{perm}</button>
            ))}
          </div>
          <button
            onClick={() => {
              if (!newSubAdminName.trim() || !newSubAdminEmail.trim()) return;
              setSubAdmins((prev: SubAdminItem[]) => [...prev, { id: `sa-${Date.now()}`, name: newSubAdminName, email: newSubAdminEmail, permissions: newSubAdminPerms, status: 'Active' }]);
              setNewSubAdminName(''); setNewSubAdminEmail(''); setNewSubAdminPerms([]);
            }}
            className="px-6 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[13px] rounded-xl shadow-md"
          >
            Create Sub Admin
          </button>
        </SectionCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {subAdmins.map((sa: SubAdminItem) => (
            <SectionCard key={sa.id} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <img src={avatarUrl(sa.name)} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-bold text-[14px]">{sa.name}</p>
                    <p className="text-[11px] text-[#8a8a95] font-medium">{sa.email}</p>
                  </div>
                </div>
                <StatusPill status={sa.status} />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {sa.permissions.map((p) => <span key={p} className="px-2.5 py-1 bg-[#f4f5fb] text-[#4b4b58] rounded-full text-[11px] font-bold">{p}</span>)}
              </div>
              <button
                onClick={() => setSubAdmins((prev: SubAdminItem[]) => prev.map((x) => x.id === sa.id ? { ...x, status: x.status === 'Active' ? 'Suspended' : 'Active' } : x))}
                className="w-full py-2.5 bg-[#f4f5fb] hover:bg-[#e9e9f4] text-[#4b4b58] font-bold text-[12px] rounded-xl"
              >
                {sa.status === 'Active' ? 'Suspend Access' : 'Reactivate Access'}
              </button>
            </SectionCard>
          ))}
        </div>
      </div>
    );
  }

  return null;
}