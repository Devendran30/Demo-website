'use client';

import { useState } from 'react';

/* ============================================================================
   RAKVIH HR PORTAL
   Single-file demo: shared login + Recruitment Hub (admin) + Application
   Journey (external vendor/recruiter)
   ============================================================================ */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface JobRequirement {
  id: string;
  organization: string;
  jobTitle: string;
  experienceBand: string;
  vacancies: number;
  skills: string[];
  description: string;
  postedOn: string;
  status: 'Open' | 'On Hold' | 'Closed';
  applicants: number;
}

type CandidateStage = 'Screening' | 'Interview' | 'Offer' | 'Joining' | 'Rejected';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experienceStatus: 'Fresher' | 'Experienced';
  noticePeriod: 'Immediate' | '1 Month Notice' | '3 Months Notice';
  expectedSalary: string;
  aadhar: string;
  pan: string;
  requirement: string;
  screeningNotes: string;
  resumeFileName: string;
  stage: CandidateStage;
  addedBy: 'admin' | 'vendor';
  addedOn: string;
}

interface PanelMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
}

interface InterviewSlot {
  id: string;
  candidateName: string;
  requirement: string;
  panelMember: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

interface CredentialAccount {
  id: string;
  accountId: string;
  tier: 'INTERNAL' | 'EXTERNAL';
  generatedOn: string;
  status: 'Active' | 'Revoked';
}

type Role = 'admin' | 'vendor' | null;
type AdminTab =
  | 'dashboard' | 'post-job' | 'search-resumes' | 'manage-resumes' | 'panel-members'
  | 'track-stages' | 'interviews' | 'credentials';
type VendorTab = 'dashboard' | 'profile' | 'interview-details' | 'onboarding';

const experienceBands = [
  { years: '1–3 years', label: 'Junior / Associate' },
  { years: '3–5 years', label: 'Mid-Senior level' },
  { years: '5–8 years', label: 'Lead Specialist' },
  { years: '8+ years', label: 'Principal / Director' },
];

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=fff&bold=true&font-size=0.4`;

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Completed: 'bg-sky-50 text-sky-700 border-sky-200',
    Interview: 'bg-sky-50 text-sky-700 border-sky-200',
    'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
    Screening: 'bg-amber-50 text-amber-700 border-amber-200',
    Offer: 'bg-violet-50 text-violet-700 border-violet-200',
    Joining: 'bg-teal-50 text-teal-700 border-teal-200',
    Closed: 'bg-slate-100 text-slate-500 border-slate-200',
    Cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    Revoked: 'bg-rose-50 text-rose-700 border-rose-200',
    INTERNAL: 'bg-teal-50 text-teal-700 border-teal-200',
    EXTERNAL: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#e4eae8] rounded-[28px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </div>
  );
}

function EmptyState({ icon, title, note }: { icon: string; title: string; note: string }) {
  return (
    <div className="py-14 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="font-bold text-[#101615] text-[15px]">{title}</p>
      <p className="text-[13px] text-[#67736f] font-medium mt-1">{note}</p>
    </div>
  );
}

function Dropzone({ fileName, onPick }: { fileName: string; onPick: (name: string) => void }) {
  const sample = ['Resume_Final.pdf', 'CV_Updated.docx', 'Profile_2026.pdf'];
  return (
    <button
      type="button"
      onClick={() => onPick(sample[Math.floor(Math.random() * sample.length)])}
      className="w-full py-8 border-2 border-dashed border-[#cfe0dc] rounded-2xl bg-[#f3f8f6] hover:bg-[#eaf4f1] hover:border-[#0d9488] transition-all text-center"
    >
      {fileName ? (
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl">📄</span>
          <span className="font-bold text-[13px] text-[#101615]">{fileName}</span>
          <span className="text-[11px] text-[#0d9488] font-bold">Click to replace</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl opacity-60">📎</span>
          <span className="font-semibold text-[13px] text-[#4b544f]">Drag and drop resume document here</span>
          <span className="text-[11px] text-[#8a938f] font-medium">Supports PDF, DOCX up to 10MB</span>
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Candidate form state shape (shared by admin + vendor)
// ---------------------------------------------------------------------------
interface CandidateFormState {
  firstName: string; lastName: string; email: string; phone: string;
  experienceStatus: 'Fresher' | 'Experienced';
  noticePeriod: 'Immediate' | '1 Month Notice' | '3 Months Notice';
  expectedSalary: string; aadhar: string; pan: string;
  requirement: string; screeningNotes: string; resumeFileName: string;
}
const blankCandidateForm: CandidateFormState = {
  firstName: '', lastName: '', email: '', phone: '',
  experienceStatus: 'Fresher', noticePeriod: 'Immediate',
  expectedSalary: '', aadhar: '', pan: '', requirement: '', screeningNotes: '', resumeFileName: '',
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function HRRecruitmentPortal() {
  const [role, setRole] = useState<Role>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [vendorTab, setVendorTab] = useState<VendorTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // -----------------------------------------------------------------------
  // Shared data
  // -----------------------------------------------------------------------
  const [requirements, setRequirements] = useState<JobRequirement[]>([
    { id: 'req1', organization: 'Rakvih', jobTitle: 'Web Full Stack Development', experienceBand: '3–5 years — Mid-Senior level', vacancies: 4, skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'], description: 'Build and maintain client-facing web applications across the stack, from API design to production-ready UI.', postedOn: '2026-08-18', status: 'Open', applicants: 5 },
    { id: 'req2', organization: 'Dev Tech', jobTitle: 'junior developer', experienceBand: '1–3 years — Junior / Associate', vacancies: 2, skills: ['JavaScript', 'HTML/CSS'], description: 'Entry-level developer role supporting feature work on internal tools under senior guidance.', postedOn: '2026-08-25', status: 'Open', applicants: 2 },
    { id: 'req3', organization: 'Rakvih', jobTitle: 'Web stack', experienceBand: '5–8 years — Lead Specialist', vacancies: 1, skills: ['Next.js', 'GraphQL', 'AWS'], description: 'Lead architecture decisions for the platform team and mentor mid-level engineers.', postedOn: '2026-09-01', status: 'Open', applicants: 2 },
  ]);

  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: 'c1', firstName: 'Rohit', lastName: 'Bhatia', email: 'rohit.bhatia@mail.com', phone: '98450 11221', experienceStatus: 'Experienced', noticePeriod: '1 Month Notice', expectedSalary: '₹14 LPA', aadhar: '•••• •••• 4521', pan: 'ABCDE1234F', requirement: 'Web Full Stack Development (Rakvih)', screeningNotes: 'Strong React background, 4 yrs at a mid-size product company.', resumeFileName: 'Rohit_Bhatia_CV.pdf', stage: 'Screening', addedBy: 'admin', addedOn: '2026-08-20' },
    { id: 'c2', firstName: 'Sneha', lastName: 'Kapoor', email: 'sneha.kapoor@mail.com', phone: '98450 33441', experienceStatus: 'Experienced', noticePeriod: 'Immediate', expectedSalary: '₹16 LPA', aadhar: '•••• •••• 7842', pan: 'BCDEF2345G', requirement: 'Web Full Stack Development (Rakvih)', screeningNotes: 'Solid full-stack profile, good communication in screening call.', resumeFileName: 'Sneha_Kapoor_Resume.pdf', stage: 'Interview', addedBy: 'admin', addedOn: '2026-08-22' },
    { id: 'c3', firstName: 'Arjun', lastName: 'Verma', email: 'arjun.verma@mail.com', phone: '98450 55112', experienceStatus: 'Fresher', noticePeriod: 'Immediate', expectedSalary: '₹5 LPA', aadhar: '•••• •••• 1290', pan: 'CDEFG3456H', requirement: 'junior developer (Dev tech)', screeningNotes: 'Recent bootcamp graduate, keen and available immediately.', resumeFileName: 'Arjun_Verma_CV.pdf', stage: 'Screening', addedBy: 'admin', addedOn: '2026-08-27' },
    { id: 'c4', firstName: 'Lakshmi', lastName: 'Iyer', email: 'lakshmi.iyer@mail.com', phone: '98450 77332', experienceStatus: 'Experienced', noticePeriod: '3 Months Notice', expectedSalary: '₹24 LPA', aadhar: '•••• •••• 6603', pan: 'DEFGH4567I', requirement: 'Web stack (Rakvih )', screeningNotes: 'Ex-lead engineer, excellent system design round.', resumeFileName: 'Lakshmi_Iyer_Profile.pdf', stage: 'Offer', addedBy: 'admin', addedOn: '2026-09-02' },
    { id: 'c5', firstName: 'Mohit', lastName: 'Malhotra', email: 'mohit.malhotra@mail.com', phone: '98450 99213', experienceStatus: 'Fresher', noticePeriod: 'Immediate', expectedSalary: '₹6 LPA', aadhar: '•••• •••• 3387', pan: 'EFGHI5678J', requirement: 'Web Full Stack Development (Rakvih)', screeningNotes: 'Good fundamentals, needs mentoring on backend.', resumeFileName: 'Mohit_Malhotra_CV.pdf', stage: 'Interview', addedBy: 'admin', addedOn: '2026-09-03' },
    { id: 'c6', firstName: 'Pooja', lastName: 'Agarwal', email: 'pooja.agarwal@mail.com', phone: '98450 22156', experienceStatus: 'Fresher', noticePeriod: 'Immediate', expectedSalary: '₹5.5 LPA', aadhar: '•••• •••• 9021', pan: 'FGHIJ6789K', requirement: 'junior developer (Dev tech)', screeningNotes: 'Offer accepted, awaiting joining formalities.', resumeFileName: 'Pooja_Agarwal_Resume.pdf', stage: 'Joining', addedBy: 'admin', addedOn: '2026-08-15' },
    { id: 'c7', firstName: 'Vivek', lastName: 'Chandran', email: 'vivek.chandran@mail.com', phone: '98450 44887', experienceStatus: 'Experienced', noticePeriod: '3 Months Notice', expectedSalary: '₹28 LPA', aadhar: '•••• •••• 5514', pan: 'GHIJK7890L', requirement: 'Web stack (Rakvih )', screeningNotes: 'Salary expectations exceeded budget for this role.', resumeFileName: 'Vivek_Chandran_CV.pdf', stage: 'Rejected', addedBy: 'admin', addedOn: '2026-08-10' },
    { id: 'c8', firstName: 'Neha', lastName: 'Kulkarni', email: 'neha.kulkarni@mail.com', phone: '98450 66778', experienceStatus: 'Fresher', noticePeriod: 'Immediate', expectedSalary: '₹4.5 LPA', aadhar: '•••• •••• 2231', pan: 'HIJKL8901M', requirement: 'Web Full Stack Development (Rakvih)', screeningNotes: 'Referred through NextGen Staffing, solid portfolio projects.', resumeFileName: 'Neha_Kulkarni_CV.pdf', stage: 'Screening', addedBy: 'vendor', addedOn: '2026-09-04' },
    { id: 'c9', firstName: 'Aditya', lastName: 'Rao', email: 'aditya.rao@mail.com', phone: '98450 88990', experienceStatus: 'Experienced', noticePeriod: '1 Month Notice', expectedSalary: '₹15 LPA', aadhar: '•••• •••• 7765', pan: 'IJKLM9012N', requirement: 'Web Full Stack Development (Rakvih)', screeningNotes: 'Strong TypeScript skills, cleared technical round comfortably.', resumeFileName: 'Aditya_Rao_Resume.pdf', stage: 'Offer', addedBy: 'vendor', addedOn: '2026-09-05' },
  ]);

  const [panelMembers, setPanelMembers] = useState<PanelMember[]>([
    { id: 'pm1', name: 'Kavitha Suresh', email: 'kavitha.suresh@rakvih.in', phone: '98450 10101', roles: ['HR Screening'] },
    { id: 'pm2', name: 'Naveen Kumar', email: 'naveen.kumar@rakvih.in', phone: '98450 20202', roles: ['Technical (Ops)'] },
    { id: 'pm3', name: 'Priya Sharma', email: 'priya.sharma@rakvih.in', phone: '98450 30303', roles: ['HR Screening', 'Final Round'] },
  ]);

  const [interviews, setInterviews] = useState<InterviewSlot[]>([
    { id: 'iv1', candidateName: 'Sneha Kapoor', requirement: 'Web Full Stack Development (Rakvih)', panelMember: 'Naveen Kumar', date: '2026-09-10', time: '11:00 AM', status: 'Scheduled' },
    { id: 'iv2', candidateName: 'Mohit Malhotra', requirement: 'Web Full Stack Development (Rakvih)', panelMember: 'Kavitha Suresh', date: '2026-09-09', time: '3:00 PM', status: 'Scheduled' },
    { id: 'iv3', candidateName: 'Aditya Rao', requirement: 'Web Full Stack Development (Rakvih)', panelMember: 'Naveen Kumar', date: '2026-09-05', time: '10:30 AM', status: 'Completed' },
  ]);

  const [credentialAccounts, setCredentialAccounts] = useState<CredentialAccount[]>([
    { id: 'ca1', accountId: 'vendor@rakvih.in', tier: 'EXTERNAL', generatedOn: '2026-08-20', status: 'Active' },
    { id: 'ca2', accountId: 'ops.lead@rakvih.in', tier: 'INTERNAL', generatedOn: '2026-07-15', status: 'Active' },
  ]);

  // -----------------------------------------------------------------------
  // Post Job Requirement form state
  // -----------------------------------------------------------------------
  const [reqOrg, setReqOrg] = useState('');
  const [reqTitle, setReqTitle] = useState('');
  const [reqBand, setReqBand] = useState(experienceBands[0]);
  const [reqVacancies, setReqVacancies] = useState('1');
  const [reqSkillInput, setReqSkillInput] = useState('');
  const [reqSkills, setReqSkills] = useState<string[]>([]);
  const [reqDescription, setReqDescription] = useState('');

  const handleAddSkill = () => {
    if (!reqSkillInput.trim()) return;
    setReqSkills([...reqSkills, reqSkillInput.trim()]);
    setReqSkillInput('');
  };
  const handleDiscardReq = () => {
    setReqOrg(''); setReqTitle(''); setReqBand(experienceBands[0]); setReqVacancies('1'); setReqSkills([]); setReqSkillInput(''); setReqDescription('');
  };
  const handleDeployReq = () => {
    if (!reqOrg.trim() || !reqTitle.trim()) return;
    setRequirements([
      { id: `req-${Date.now()}`, organization: reqOrg, jobTitle: reqTitle, experienceBand: `${reqBand.years} — ${reqBand.label}`, vacancies: parseInt(reqVacancies) || 1, skills: reqSkills, description: reqDescription, postedOn: '2026-09-07', status: 'Open', applicants: 0 },
      ...requirements,
    ]);
    handleDiscardReq();
  };

  // -----------------------------------------------------------------------
  // Candidate form (used by both Upload & Manage and Profile & Resume)
  // -----------------------------------------------------------------------
  const [adminCandidateForm, setAdminCandidateForm] = useState<CandidateFormState>(blankCandidateForm);
  const [vendorCandidateForm, setVendorCandidateForm] = useState<CandidateFormState>(blankCandidateForm);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadText, setBulkUploadText] = useState('');

  const addCandidate = (form: CandidateFormState, addedBy: 'admin' | 'vendor', reset: () => void) => {
    if (!form.firstName.trim() || !form.email.trim()) return;
    setCandidates((prev) => [
      {
        id: `c-${Date.now()}`,
        firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone,
        experienceStatus: form.experienceStatus, noticePeriod: form.noticePeriod, expectedSalary: form.expectedSalary || '—',
        aadhar: form.aadhar || '—', pan: form.pan || '—',
        requirement: form.requirement || 'General pool', screeningNotes: form.screeningNotes,
        resumeFileName: form.resumeFileName || 'No file', stage: 'Screening', addedBy, addedOn: '2026-09-07',
      },
      ...prev,
    ]);
    reset();
  };

  // -----------------------------------------------------------------------
  // Panel member form
  // -----------------------------------------------------------------------
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRoles, setNewMemberRoles] = useState<string[]>([]);
  const panelRoleOptions = ['HR Screening', 'Technical (Ops)', 'Final Round'];

  const handleSaveMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    setPanelMembers([...panelMembers, { id: `pm-${Date.now()}`, name: newMemberName, email: newMemberEmail, phone: newMemberPhone, roles: newMemberRoles }]);
    setNewMemberName(''); setNewMemberEmail(''); setNewMemberPhone(''); setNewMemberRoles([]);
  };

  // -----------------------------------------------------------------------
  // Interview scheduling form
  // -----------------------------------------------------------------------
  const [ivCandidate, setIvCandidate] = useState('');
  const [ivPanel, setIvPanel] = useState('');
  const [ivDate, setIvDate] = useState('');
  const [ivTime, setIvTime] = useState('');

  const handleScheduleInterview = () => {
    if (!ivCandidate || !ivPanel || !ivDate || !ivTime) return;
    const cand = candidates.find((c) => c.id === ivCandidate);
    if (!cand) return;
    setInterviews([
      { id: `iv-${Date.now()}`, candidateName: `${cand.firstName} ${cand.lastName}`, requirement: cand.requirement, panelMember: ivPanel, date: ivDate, time: ivTime, status: 'Scheduled' },
      ...interviews,
    ]);
    setCandidates(candidates.map((c) => (c.id === ivCandidate ? { ...c, stage: 'Interview' } : c)));
    setIvCandidate(''); setIvPanel(''); setIvDate(''); setIvTime('');
  };

  // -----------------------------------------------------------------------
  // Credentials Access form
  // -----------------------------------------------------------------------
  const [credAccountId, setCredAccountId] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credTier, setCredTier] = useState<'INTERNAL' | 'EXTERNAL'>('EXTERNAL');

  const handleGenerateCredential = () => {
    if (!credAccountId.trim() || !credPassword.trim()) return;
    setCredentialAccounts([
      { id: `ca-${Date.now()}`, accountId: credAccountId, tier: credTier, generatedOn: '2026-09-07', status: 'Active' },
      ...credentialAccounts,
    ]);
    setCredAccountId(''); setCredPassword('');
  };

  // -----------------------------------------------------------------------
  // Search resumes
  // -----------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [searchExpFilter, setSearchExpFilter] = useState('All');

  // -----------------------------------------------------------------------
  // Auth handlers
  // -----------------------------------------------------------------------
  const handleLogin = () => {
    if (loginEmail === 'admin@rakvih.in' && loginPassword === 'recruit123') {
      setRole('admin'); setCurrentUserName('Priya Sharma'); setLoginError('');
    } else if (loginEmail === 'vendor@rakvih.in' && loginPassword === 'vendor123') {
      setRole('vendor'); setCurrentUserName('NextGen Staffing'); setLoginError('');
    } else {
      setLoginError('Invalid credentials. Use one of the demo logins below.');
    }
  };
  const fillDemo = (which: 'admin' | 'vendor') => {
    if (which === 'admin') { setLoginEmail('admin@rakvih.in'); setLoginPassword('recruit123'); }
    else { setLoginEmail('vendor@rakvih.in'); setLoginPassword('vendor123'); }
    setLoginError('');
  };
  const handleLogout = () => {
    setRole(null); setLoginEmail(''); setLoginPassword('');
    setAdminTab('dashboard'); setVendorTab('dashboard');
  };

  const vendorCandidates = candidates.filter((c) => c.addedBy === 'vendor');

  // =======================================================================
  // LOGIN SCREEN
  // =======================================================================
  if (!role) {
    return (
      <div
        className="min-h-screen bg-[#f2f7f5] flex items-center justify-center p-4 antialiased"
        style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f766e] to-[#0e7490] text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-500/25 mb-4">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2" /><path d="M9 22h9a2 2 0 0 0 2-2V7l-5-5H9a2 2 0 0 0-2 2v3" /><path d="M4 12h6M4 16h6M2 20h8" /><circle cx="5" cy="12" r="1" /></svg>
            </div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-[#101615]">Rakvih HR Portal</h1>
            <p className="text-[13px] text-[#67736f] font-medium mt-1">Recruitment &amp; onboarding workspace</p>
          </div>

          <SectionCard className="p-7">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#67736f] uppercase tracking-wide mb-1.5">Email</label>
                <input
                  type="email" value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="you@rakvih.in"
                  className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[14px] text-[#101615] focus:outline-none focus:bg-white focus:border-[#0f766e] transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#67736f] uppercase tracking-wide mb-1.5">Password</label>
                <input
                  type="password" value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[14px] text-[#101615] focus:outline-none focus:bg-white focus:border-[#0f766e] transition-all font-medium"
                />
              </div>
              {loginError && <p className="text-rose-600 text-[13px] font-semibold bg-rose-50 px-4 py-2.5 rounded-xl">{loginError}</p>}
              <button onClick={handleLogin} className="w-full py-3 bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white font-bold text-[14px] rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg transition-all active:scale-[0.98]">
                Sign in
              </button>
            </div>
          </SectionCard>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => fillDemo('admin')} className="text-left p-4 bg-white hover:border-[#0f766e] border border-[#e0ebe7] rounded-2xl transition-all group">
              <p className="text-[10px] font-extrabold text-[#0f766e] uppercase tracking-wider mb-2">Demo — Recruitment Hub</p>
              <p className="text-[12px] font-semibold text-[#67736f]">admin@rakvih.in</p>
              <p className="text-[12px] font-semibold text-[#67736f]">recruit123</p>
              <span className="text-[11px] font-bold text-[#0f766e] mt-2 inline-block group-hover:underline">Fill this in →</span>
            </button>
            <button onClick={() => fillDemo('vendor')} className="text-left p-4 bg-white hover:border-[#0e7490] border border-[#e0ebe7] rounded-2xl transition-all group">
              <p className="text-[10px] font-extrabold text-[#0e7490] uppercase tracking-wider mb-2">Demo — Application Journey</p>
              <p className="text-[12px] font-semibold text-[#67736f]">vendor@rakvih.in</p>
              <p className="text-[12px] font-semibold text-[#67736f]">vendor123</p>
              <span className="text-[11px] font-bold text-[#0e7490] mt-2 inline-block group-hover:underline">Fill this in →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // SHARED CHROME
  // =======================================================================
  const adminNavItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Recruitment Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
    { id: 'post-job', label: 'Post Job Requirements', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg> },
    { id: 'search-resumes', label: 'Search Resumes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
    { id: 'manage-resumes', label: 'Upload & Manage', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> },
    { id: 'panel-members', label: 'HR Panel Members', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    { id: 'track-stages', label: 'Track Candidate Stages', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18.7 8 14 12.7l-3-3L7 14" /></svg> },
    { id: 'interviews', label: 'Schedule Interviews', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    { id: 'credentials', label: 'Credentials Access', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> },
  ];

  const vendorNavItems: { id: VendorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
    { id: 'profile', label: 'Profile & Resume', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> },
    { id: 'interview-details', label: 'Interview Schedule', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    { id: 'onboarding', label: 'Offer & Onboarding', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg> },
  ];

  const navItems = role === 'admin' ? adminNavItems : vendorNavItems;
  const activeId = role === 'admin' ? adminTab : vendorTab;
  const setActive = (id: string) => {
    if (role === 'admin') setAdminTab(id as AdminTab); else setVendorTab(id as VendorTab);
    setIsMobileSidebarOpen(false);
  };
  const portalLabel = role === 'admin' ? 'Recruitment Hub' : 'Application Journey';
  const activeLabel = navItems.find((n) => n.id === activeId)?.label || '';

  return (
    <div
      className="min-h-screen bg-[#f2f7f5] text-[#101615] flex antialiased selection:bg-teal-100 selection:text-[#0f766e]"
      style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />}

      <aside className={`w-[270px] min-w-[270px] bg-white border-r border-[#e4eae8] flex flex-col justify-between h-screen z-40 transition-transform duration-300 ${isMobileSidebarOpen ? 'fixed top-0 bottom-0 left-0 translate-x-0' : 'fixed top-0 bottom-0 left-0 -translate-x-full md:translate-x-0 md:sticky md:top-0'}`}>
        <div className="overflow-y-auto px-4 pt-7 pb-4">
          <div className="flex items-center gap-3 px-2 pb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0f766e] to-[#0e7490] text-white flex items-center justify-center shadow-md shadow-teal-500/20 flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2" /><path d="M9 22h9a2 2 0 0 0 2-2V7l-5-5H9a2 2 0 0 0-2 2v3" /><path d="M4 12h6M4 16h6M2 20h8" /></svg>
            </div>
            <div>
              <p className="font-extrabold text-[15px] tracking-tight leading-none">Rakvih HR</p>
              <p className="text-[11px] text-[#67736f] font-semibold mt-1">{portalLabel}</p>
            </div>
          </div>

          <nav className="space-y-1 text-[14px]">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActive(item.id)} className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 ${activeId === item.id ? 'bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white font-bold shadow-sm' : 'text-[#4b544f] font-semibold hover:bg-[#f2f7f5]'}`}>
                <span className="opacity-80 flex-shrink-0">{item.icon}</span>
                <span className="leading-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#e4eae8]">
          <div className="flex items-center gap-3 px-2 pb-4">
            <img src={avatarUrl(currentUserName)} alt={currentUserName} className="w-9 h-9 rounded-full" />
            <div className="min-w-0">
              <p className="font-bold text-[13px] truncate">{currentUserName}</p>
              <p className="text-[11px] text-[#67736f] font-medium">{role === 'admin' ? 'Recruitment Lead' : 'External Partner'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2.5 px-4 bg-[#f2f7f5] hover:bg-rose-50 text-[#4b544f] hover:text-rose-600 font-bold rounded-xl text-[13px] transition-all flex items-center justify-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 pt-16 md:pt-6 md:p-9 lg:p-10 overflow-y-auto max-h-screen">
        <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="fixed top-4 left-4 z-20 md:hidden w-10 h-10 bg-white border border-[#e4eae8] rounded-full flex items-center justify-center shadow-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101615" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileSidebarOpen ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)}
          </svg>
        </button>

        <div className="max-w-6xl mx-auto space-y-7">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-[#e4eae8]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-1">
                <span>{portalLabel}</span><span>/</span><span className="text-[#0f766e]">{activeLabel}</span>
              </div>
              <h1 className="text-2xl md:text-[28px] font-extrabold tracking-tight">{activeLabel}</h1>
            </div>
            <span className="px-3.5 py-1.5 bg-white border border-[#e4eae8] text-[#101615] rounded-full text-[12px] font-bold shadow-sm flex items-center gap-2 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sep 7, 2026
            </span>
          </header>

          {role === 'admin' ? (
            <AdminContent
              tab={adminTab}
              requirements={requirements}
              reqOrg={reqOrg} setReqOrg={setReqOrg}
              reqTitle={reqTitle} setReqTitle={setReqTitle}
              reqBand={reqBand} setReqBand={setReqBand}
              reqVacancies={reqVacancies} setReqVacancies={setReqVacancies}
              reqSkillInput={reqSkillInput} setReqSkillInput={setReqSkillInput}
              reqSkills={reqSkills} setReqSkills={setReqSkills}
              reqDescription={reqDescription} setReqDescription={setReqDescription}
              handleAddSkill={handleAddSkill} handleDiscardReq={handleDiscardReq} handleDeployReq={handleDeployReq}
              candidates={candidates}
              adminCandidateForm={adminCandidateForm} setAdminCandidateForm={setAdminCandidateForm}
              addCandidate={addCandidate}
              isBulkUploadOpen={isBulkUploadOpen} setIsBulkUploadOpen={setIsBulkUploadOpen}
              bulkUploadText={bulkUploadText} setBulkUploadText={setBulkUploadText}
              setCandidates={setCandidates}
              panelMembers={panelMembers}
              newMemberName={newMemberName} setNewMemberName={setNewMemberName}
              newMemberEmail={newMemberEmail} setNewMemberEmail={setNewMemberEmail}
              newMemberPhone={newMemberPhone} setNewMemberPhone={setNewMemberPhone}
              newMemberRoles={newMemberRoles} setNewMemberRoles={setNewMemberRoles}
              panelRoleOptions={panelRoleOptions} handleSaveMember={handleSaveMember}
              interviews={interviews}
              ivCandidate={ivCandidate} setIvCandidate={setIvCandidate}
              ivPanel={ivPanel} setIvPanel={setIvPanel}
              ivDate={ivDate} setIvDate={setIvDate}
              ivTime={ivTime} setIvTime={setIvTime}
              handleScheduleInterview={handleScheduleInterview}
              credentialAccounts={credentialAccounts}
              credAccountId={credAccountId} setCredAccountId={setCredAccountId}
              credPassword={credPassword} setCredPassword={setCredPassword}
              credTier={credTier} setCredTier={setCredTier}
              handleGenerateCredential={handleGenerateCredential}
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              searchExpFilter={searchExpFilter} setSearchExpFilter={setSearchExpFilter}
            />
          ) : (
            <VendorContent
              tab={vendorTab}
              vendorCandidates={vendorCandidates}
              requirements={requirements}
              vendorCandidateForm={vendorCandidateForm} setVendorCandidateForm={setVendorCandidateForm}
              addCandidate={addCandidate}
              interviews={interviews.filter((iv) => vendorCandidates.some((c) => `${c.firstName} ${c.lastName}` === iv.candidateName))}
              setCandidates={setCandidates}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// SHARED — Candidate profile form (rendered differently per portal)
// =============================================================================
function CandidateProfileForm({
  form, setForm, requirementOptions, onSubmit, restrictedPipeline, submitLabel,
}: {
  form: CandidateFormState;
  setForm: React.Dispatch<React.SetStateAction<CandidateFormState>>;
  requirementOptions: string[];
  onSubmit: () => void;
  restrictedPipeline?: boolean;
  submitLabel: string;
}) {
  const update = (patch: Partial<CandidateFormState>) => setForm((prev) => ({ ...prev, ...patch }));
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-2">Resume File</label>
        <Dropzone fileName={form.resumeFileName} onPick={(name) => update({ resumeFileName: name })} />
      </div>

      <div>
        <p className="text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-2">Candidate Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.firstName} onChange={(e) => update({ firstName: e.target.value })} placeholder="First Name" className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
          <input value={form.lastName} onChange={(e) => update({ lastName: e.target.value })} placeholder="Last Name" className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
          <input value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="Contact Email" className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
          <input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="Phone Number" className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-2">Experience & Availability</p>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['Fresher', 'Experienced'] as const).map((s) => (
              <button key={s} onClick={() => update({ experienceStatus: s })} className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${form.experienceStatus === s ? 'bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white border-transparent shadow-sm' : 'bg-[#f2f7f5] text-[#4b544f] border-[#e0ebe7]'}`}>
                {s === 'Fresher' ? 'New Joining / Fresher' : 'Experienced'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['Immediate', '1 Month Notice', '3 Months Notice'] as const).map((n) => (
              <button key={n} onClick={() => update({ noticePeriod: n })} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${form.noticePeriod === n ? 'bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white border-transparent shadow-sm' : 'bg-[#f2f7f5] text-[#4b544f] border-[#e0ebe7]'}`}>
                {n}
              </button>
            ))}
          </div>
          <input value={form.expectedSalary} onChange={(e) => update({ expectedSalary: e.target.value })} placeholder="Expected Salary / CTC" className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-1">Identity Documents</p>
        <p className="text-[11px] text-[#8a938f] font-medium mb-2">Stored for verification purposes only. Handle with the same care as any other PII.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.aadhar} onChange={(e) => update({ aadhar: e.target.value })} placeholder="Aadhar Card Number" className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
          <input value={form.pan} onChange={(e) => update({ pan: e.target.value })} placeholder="PAN Card Number" className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-2">Pipeline Mapping</label>
        <select value={form.requirement} onChange={(e) => update({ requirement: e.target.value })} className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-semibold focus:outline-none focus:bg-white focus:border-[#0f766e]">
          {restrictedPipeline ? (
            <>
              <option value="">Select a requirement…</option>
              {requirementOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </>
          ) : (
            <>
              <option value="">Open Pipeline Requirement (Optional)</option>
              <option value="">Keep in general candidate pool queue</option>
              {requirementOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </>
          )}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-2">Screening Notes</label>
        <textarea rows={3} value={form.screeningNotes} onChange={(e) => update({ screeningNotes: e.target.value })} placeholder="Initial Screening Log Remarks" className="w-full p-4 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e] resize-none" />
      </div>

      <button onClick={onSubmit} className="w-full py-3.5 bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white font-bold text-[14px] rounded-xl shadow-md">{submitLabel}</button>
    </div>
  );
}

// =============================================================================
// ADMIN — Recruitment Hub content
// =============================================================================
function AdminContent(props: any) {
  const {
    tab, requirements, reqOrg, setReqOrg, reqTitle, setReqTitle, reqBand, setReqBand, reqVacancies, setReqVacancies,
    reqSkillInput, setReqSkillInput, reqSkills, setReqSkills, reqDescription, setReqDescription, handleAddSkill,
    handleDiscardReq, handleDeployReq, candidates, adminCandidateForm, setAdminCandidateForm, addCandidate,
    isBulkUploadOpen, setIsBulkUploadOpen, bulkUploadText, setBulkUploadText, setCandidates, panelMembers,
    newMemberName, setNewMemberName, newMemberEmail, setNewMemberEmail, newMemberPhone, setNewMemberPhone,
    newMemberRoles, setNewMemberRoles, panelRoleOptions, handleSaveMember, interviews, ivCandidate, setIvCandidate,
    ivPanel, setIvPanel, ivDate, setIvDate, ivTime, setIvTime, handleScheduleInterview, credentialAccounts,
    credAccountId, setCredAccountId, credPassword, setCredPassword, credTier, setCredTier, handleGenerateCredential,
    searchTerm, setSearchTerm, searchExpFilter, setSearchExpFilter,
  } = props;

  const requirementOptions = requirements.map((r: JobRequirement) => `${r.jobTitle} (${r.organization})`);
  const stages: CandidateStage[] = ['Screening', 'Interview', 'Offer', 'Joining', 'Rejected'];

  if (tab === 'dashboard') {
    const stats = [
      { label: 'Open Requirements', value: requirements.filter((r: JobRequirement) => r.status === 'Open').length.toString(), sub: `${requirements.length} total posted`, icon: '📋' },
      { label: 'Candidates in Pool', value: candidates.length.toString(), sub: 'Across all pipelines', icon: '🧑‍💻' },
      { label: 'Interviews This Week', value: interviews.filter((i: InterviewSlot) => i.status === 'Scheduled').length.toString(), sub: 'Scheduled sessions', icon: '🗓️' },
      { label: 'Offers Extended', value: candidates.filter((c: Candidate) => c.stage === 'Offer' || c.stage === 'Joining').length.toString(), sub: 'This quarter', icon: '🤝' },
    ];
    return (
      <div className="space-y-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <SectionCard key={i} className="p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-bold text-[#8a938f] uppercase tracking-wide">{s.label}</p>
                <span className="text-lg p-2 bg-[#f2f7f5] rounded-lg">{s.icon}</span>
              </div>
              <p className="text-[26px] font-extrabold tracking-tight">{s.value}</p>
              <p className="text-[12px] text-[#67736f] font-medium mt-1.5">{s.sub}</p>
            </SectionCard>
          ))}
        </div>

        <SectionCard className="p-7">
          <h3 className="text-lg font-bold tracking-tight mb-1">Candidates by stage</h3>
          <p className="text-[12px] text-[#67736f] font-medium mb-6">Where the current pool stands across the pipeline</p>
          <div className="h-52 flex items-end justify-between gap-4 px-2">
            {stages.map((s) => {
              const count = candidates.filter((c: Candidate) => c.stage === s).length;
              const max = Math.max(...stages.map((st) => candidates.filter((c: Candidate) => c.stage === st).length), 1);
              return (
                <div key={s} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[13px] font-extrabold">{count}</span>
                  <div className="w-full bg-[#f2f7f5] rounded-t-lg relative flex items-end" style={{ height: '80%' }}>
                    <div className="w-full bg-gradient-to-t from-[#0f766e] to-[#0e7490] rounded-t-lg opacity-85" style={{ height: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-[#8a938f] uppercase tracking-wide">{s}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard className="p-7">
            <h3 className="text-lg font-bold tracking-tight mb-4">Open requirements</h3>
            <div className="space-y-3">
              {requirements.slice(0, 3).map((r: JobRequirement) => (
                <div key={r.id} className="p-4 bg-[#f2f7f5] rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[13px]">{r.jobTitle}</span>
                    <p className="text-[12px] text-[#67736f] font-medium">{r.organization} · {r.vacancies} vacancies · {r.applicants} applicants</p>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard className="p-7">
            <h3 className="text-lg font-bold tracking-tight mb-4">Upcoming interviews</h3>
            <div className="space-y-3">
              {interviews.filter((i: InterviewSlot) => i.status === 'Scheduled').slice(0, 3).map((i: InterviewSlot) => (
                <div key={i.id} className="p-4 bg-[#f2f7f5] rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[13px]">{i.candidateName}</span>
                    <StatusPill status={i.status} />
                  </div>
                  <p className="text-[12px] text-[#67736f] font-medium mt-1">{i.date} · {i.time} with {i.panelMember}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  if (tab === 'post-job') {
    return (
      <div className="space-y-6">
        <SectionCard className="p-7 md:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold tracking-tight">Client & Role Details</h3>
            <p className="text-[12px] text-[#67736f] font-medium mt-0.5">Basic information</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
            <div>
              <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-1.5">Organization</label>
              <input value={reqOrg} onChange={(e) => setReqOrg(e.target.value)} placeholder="e.g. Rakvih" className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-1.5">Job Title</label>
              <input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="e.g. Web Full Stack Development" className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
            </div>
          </div>

          <div className="mb-7">
            <h4 className="text-[15px] font-bold mb-1">Scope & Capacity</h4>
            <p className="text-[12px] text-[#67736f] font-medium mb-4">Parameters</p>
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-2">Experience Band</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {experienceBands.map((band) => (
                  <button key={band.label} onClick={() => setReqBand(band)} className={`text-left p-3.5 rounded-xl border transition-all ${reqBand.label === band.label ? 'bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white border-transparent shadow-sm' : 'bg-[#f2f7f5] text-[#4b544f] border-[#e0ebe7]'}`}>
                    <span className="font-bold text-[13px] block">{band.years}</span>
                    <span className={`text-[11px] font-semibold ${reqBand.label === band.label ? 'text-white/85' : 'text-[#8a938f]'}`}>{band.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-1.5">Total Vacancies</label>
              <input type="number" min={1} value={reqVacancies} onChange={(e) => setReqVacancies(e.target.value)} className="w-32 px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-bold focus:outline-none focus:bg-white focus:border-[#0f766e]" />
            </div>
          </div>

          <div className="mb-7">
            <h4 className="text-[15px] font-bold mb-1">Core Competencies</h4>
            <p className="text-[12px] text-[#67736f] font-medium mb-3">Requirements</p>
            <div className="flex gap-2 mb-3">
              <input value={reqSkillInput} onChange={(e) => setReqSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()} placeholder="e.g. React, PostgreSQL, AWS" className="flex-1 px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
              <button onClick={handleAddSkill} className="px-5 py-3 bg-[#101615] hover:bg-black text-white font-bold text-[13px] rounded-xl">Add</button>
            </div>
            {reqSkills.length === 0 ? (
              <p className="text-[12px] text-[#8a938f] font-medium italic">No core skills defined. Please attach required competencies.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {reqSkills.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-[#eaf4f1] text-[#0f766e] rounded-full text-[12px] font-bold flex items-center gap-1.5">
                    {s}
                    <button onClick={() => setReqSkills(reqSkills.filter((_: string, idx: number) => idx !== i))} className="hover:text-rose-600">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-7">
            <h4 className="text-[15px] font-bold mb-1">Brief & Context</h4>
            <p className="text-[12px] text-[#67736f] font-medium mb-3">Job description</p>
            <textarea rows={5} value={reqDescription} onChange={(e) => setReqDescription(e.target.value)} placeholder="Describe the role, responsibilities, and what success looks like…" className="w-full p-4 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e] resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleDeployReq} className="px-8 py-3.5 bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white font-bold text-[13px] rounded-xl shadow-md">Deploy Requirement</button>
            <button onClick={handleDiscardReq} className="px-8 py-3.5 bg-white border border-[#e0ebe7] hover:bg-[#f2f7f5] text-[#4b544f] font-bold text-[13px] rounded-xl">Discard</button>
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <h3 className="text-lg font-bold tracking-tight mb-4 px-1">Posted requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map((r: JobRequirement) => (
              <div key={r.id} className="p-5 bg-[#f2f7f5] rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-[14px]">{r.jobTitle}</p>
                    <p className="text-[12px] text-[#67736f] font-medium">{r.organization} · {r.experienceBand}</p>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <div className="flex flex-wrap gap-1.5 my-2">
                  {r.skills.map((s) => <span key={s} className="px-2.5 py-1 bg-white text-[#4b544f] rounded-full text-[11px] font-bold border border-[#e0ebe7]">{s}</span>)}
                </div>
                <div className="flex justify-between text-[12px] font-semibold text-[#67736f] pt-2 border-t border-[#e0ebe7] mt-2">
                  <span>{r.vacancies} vacancies</span><span>{r.applicants} applicants</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  if (tab === 'search-resumes') {
    const filtered = candidates.filter((c: Candidate) => {
      const q = searchTerm.toLowerCase();
      const matchesQ = !q || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.requirement.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const matchesExp = searchExpFilter === 'All' || c.experienceStatus === searchExpFilter;
      return matchesQ && matchesExp;
    });
    return (
      <div className="space-y-6">
        <SectionCard className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by candidate name, email, or requirement…" className="flex-1 px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#0f766e]" />
            <select value={searchExpFilter} onChange={(e) => setSearchExpFilter(e.target.value)} className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-semibold focus:outline-none focus:bg-white focus:border-[#0f766e]">
              {['All', 'Fresher', 'Experienced'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </SectionCard>

        {filtered.length === 0 ? (
          <SectionCard className="p-6"><EmptyState icon="🔍" title="No resumes match your search" note="Try a different name, email, or requirement." /></SectionCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((c: Candidate) => (
              <SectionCard key={c.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <img src={avatarUrl(`${c.firstName} ${c.lastName}`)} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-bold text-[14px]">{c.firstName} {c.lastName}</p>
                      <p className="text-[11px] text-[#8a938f] font-medium">{c.email}</p>
                    </div>
                  </div>
                  <StatusPill status={c.stage} />
                </div>
                <p className="text-[12px] text-[#4b544f] font-semibold mb-1">{c.requirement}</p>
                <p className="text-[12px] text-[#67736f] font-medium mb-3">{c.experienceStatus} · {c.noticePeriod} · {c.expectedSalary}</p>
                <div className="flex items-center justify-between pt-3 border-t border-[#f0f3f2]">
                  <span className="text-[12px] font-bold text-[#0f766e]">📄 {c.resumeFileName}</span>
                  <button onClick={() => alert(`Opening ${c.resumeFileName}…`)} className="px-3.5 py-1.5 bg-[#f2f7f5] hover:bg-[#eaf4f1] text-[#0f766e] rounded-full text-[12px] font-bold">View Resume</button>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tab === 'manage-resumes') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-[24px] border border-[#e4eae8]">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Upload & Manage</h3>
            <p className="text-[12px] text-[#67736f] font-medium">Parse resumes into the shared candidate pool</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsBulkUploadOpen(true)} className="px-4 py-2.5 bg-[#f2f7f5] hover:bg-[#eaf4f1] text-[#4b544f] border border-[#e0ebe7] rounded-full text-[12px] font-extrabold">Bulk Upload</button>
            <span className="px-4 py-2.5 bg-[#eaf4f1] text-[#0f766e] rounded-full text-[12px] font-extrabold">View All {candidates.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <SectionCard className="lg:col-span-2 p-7">
            <h3 className="text-lg font-bold tracking-tight">New Candidate Profile</h3>
            <p className="text-[12px] text-[#67736f] font-medium mb-5">Parse a single resume into the pool</p>
            <CandidateProfileForm
              form={adminCandidateForm}
              setForm={setAdminCandidateForm}
              requirementOptions={requirementOptions}
              onSubmit={() => addCandidate(adminCandidateForm, 'admin', () => setAdminCandidateForm(blankCandidateForm))}
              submitLabel="Parse & Upload Profile"
            />
          </SectionCard>

          <SectionCard className="lg:col-span-3 p-6">
            <h3 className="text-lg font-bold tracking-tight mb-4 px-1">Candidate pool</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-[#8a938f] border-b border-[#e4eae8]">
                  <tr>
                    <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Candidate</th>
                    <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Requirement</th>
                    <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Source</th>
                    <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f3f2]">
                  {candidates.map((c: Candidate) => (
                    <tr key={c.id}>
                      <td className="py-3 px-3 font-bold whitespace-nowrap">{c.firstName} {c.lastName}</td>
                      <td className="py-3 px-3 text-[#67736f] font-medium max-w-[160px] truncate">{c.requirement}</td>
                      <td className="py-3 px-3 text-[#67736f] font-medium capitalize">{c.addedBy}</td>
                      <td className="py-3 px-3"><StatusPill status={c.stage} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {isBulkUploadOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsBulkUploadOpen(false)}>
            <div className="bg-white rounded-[28px] p-8 max-w-xl w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Bulk upload candidates</h3>
                  <p className="text-[12px] text-[#67736f] font-medium">One per line: First Last, email, phone</p>
                </div>
                <button onClick={() => setIsBulkUploadOpen(false)} className="w-8 h-8 rounded-full bg-[#f2f7f5] hover:bg-[#e4eae8] flex items-center justify-center font-bold">✕</button>
              </div>
              <textarea rows={6} value={bulkUploadText} onChange={(e) => setBulkUploadText(e.target.value)} placeholder={`Example:\nAmit Joshi, amit.joshi@mail.com, 98450 12345\nRhea Sen, rhea.sen@mail.com, 98450 67890`} className="w-full p-4 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl font-mono text-[12px] resize-none" />
              <button
                onClick={() => {
const lines: string[] = bulkUploadText
  .split('\n')
  .filter((line: string) => Boolean(line.trim()));

const newOnes: Candidate[] = lines.map((line: string, idx: number) => {
  const [name, email, phone] = line
    .split(',')
    .map((s: string) => s.trim());
                    const [first, ...rest] = (name || 'New Candidate').split(' ');
                    return { id: `c-bulk-${Date.now()}-${idx}`, firstName: first, lastName: rest.join(' '), email: email || '—', phone: phone || '—', experienceStatus: 'Fresher', noticePeriod: 'Immediate', expectedSalary: '—', aadhar: '—', pan: '—', requirement: 'General pool', screeningNotes: 'Added via bulk upload.', resumeFileName: 'No file', stage: 'Screening', addedBy: 'admin', addedOn: '2026-09-07' };
                  });
                  if (newOnes.length) setCandidates((prev: Candidate[]) => [...newOnes, ...prev]);
                  setBulkUploadText(''); setIsBulkUploadOpen(false);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white font-bold text-[13px] rounded-xl shadow-md"
              >
                Import Candidates
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (tab === 'panel-members') {
    return (
      <div className="space-y-6">
        <SectionCard className="p-7">
          <h3 className="text-lg font-bold tracking-tight mb-1">Add Member</h3>
          <p className="text-[12px] text-[#67736f] font-medium mb-5">Register a new panelist</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Full Name" className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium" />
            <input value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="Email" className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium" />
            <input value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} placeholder="Phone" className="px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium" />
          </div>
          <p className="text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-2">Panel Roles</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {panelRoleOptions.map((role: string) => (
              <button key={role} onClick={() => setNewMemberRoles((prev: string[]) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role])} className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all ${newMemberRoles.includes(role) ? 'bg-[#0f766e] text-white border-transparent' : 'bg-[#f2f7f5] text-[#67736f] border-[#e0ebe7]'}`}>{role}</button>
            ))}
          </div>
          <button onClick={handleSaveMember} className="px-8 py-3 bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white font-bold text-[13px] rounded-xl shadow-md">Save Member</button>
        </SectionCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {panelMembers.map((m: PanelMember) => (
            <SectionCard key={m.id} className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <img src={avatarUrl(m.name)} className="w-11 h-11 rounded-full" />
                <div>
                  <p className="font-bold text-[14px]">{m.name}</p>
                  <p className="text-[11px] text-[#8a938f] font-medium">{m.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.roles.map((r) => <span key={r} className="px-2.5 py-1 bg-[#f2f7f5] text-[#4b544f] rounded-full text-[11px] font-bold">{r}</span>)}
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'track-stages') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageCandidates = candidates.filter((c: Candidate) => c.stage === stage);
          const nextStage = stages[stages.indexOf(stage) + 1];
          return (
            <div key={stage} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="font-extrabold text-[13px] uppercase tracking-wide text-[#4b544f]">{stage}</p>
                <span className="px-2.5 py-0.5 bg-[#eaf4f1] text-[#0f766e] rounded-full text-[11px] font-black">{stageCandidates.length}</span>
              </div>
              <div className="space-y-3 min-h-[80px]">
                {stageCandidates.length === 0 ? (
                  <div className="border-2 border-dashed border-[#e0ebe7] rounded-2xl p-5 text-center text-[11px] font-semibold text-[#8a938f]">Empty</div>
                ) : stageCandidates.map((c: Candidate) => (
                  <SectionCard key={c.id} className="p-4">
                    <p className="font-bold text-[13px] leading-tight">{c.firstName} {c.lastName}</p>
                    <p className="text-[11px] text-[#8a938f] font-medium mt-0.5 truncate">{c.requirement}</p>
                    {nextStage && stage !== 'Rejected' && (
                      <button
                        onClick={() => setCandidates((prev: Candidate[]) => prev.map((x) => x.id === c.id ? { ...x, stage: nextStage } : x))}
                        className="mt-3 w-full py-1.5 bg-[#f2f7f5] hover:bg-[#eaf4f1] text-[#0f766e] rounded-lg text-[11px] font-bold"
                      >
                        Move to {nextStage} →
                      </button>
                    )}
                  </SectionCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (tab === 'interviews') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <SectionCard className="lg:col-span-2 p-7">
          <h3 className="text-lg font-bold tracking-tight mb-5">Book an evaluation slot</h3>
          <div className="space-y-4">
            <select value={ivCandidate} onChange={(e) => setIvCandidate(e.target.value)} className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-semibold">
              <option value="">Select candidate…</option>
              {candidates.filter((c: Candidate) => c.stage !== 'Rejected' && c.stage !== 'Joining').map((c: Candidate) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
            <select value={ivPanel} onChange={(e) => setIvPanel(e.target.value)} className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-semibold">
              <option value="">Route to panel member…</option>
              {panelMembers.map((m: PanelMember) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={ivDate} onChange={(e) => setIvDate(e.target.value)} className="px-3 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-semibold" />
              <input type="time" value={ivTime} onChange={(e) => setIvTime(e.target.value)} className="px-3 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-semibold" />
            </div>
            <button onClick={handleScheduleInterview} className="w-full py-3.5 bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white font-bold text-[14px] rounded-xl shadow-md">Schedule Interview</button>
          </div>
        </SectionCard>

        <SectionCard className="lg:col-span-3 p-6">
          <h3 className="text-lg font-bold tracking-tight mb-4 px-1">Upcoming & past sessions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[#8a938f] border-b border-[#e4eae8]">
                <tr>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Candidate</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Panel</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">When</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3f2]">
                {interviews.map((i: InterviewSlot) => (
                  <tr key={i.id}>
                    <td className="py-3 px-3 font-bold whitespace-nowrap">{i.candidateName}</td>
                    <td className="py-3 px-3 text-[#67736f] font-medium">{i.panelMember}</td>
                    <td className="py-3 px-3 text-[#67736f] font-medium whitespace-nowrap">{i.date} · {i.time}</td>
                    <td className="py-3 px-3"><StatusPill status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (tab === 'credentials') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <SectionCard className="lg:col-span-2 p-7">
          <h3 className="text-lg font-bold tracking-tight mb-1">Provision Registry</h3>
          <p className="text-[12px] text-[#67736f] font-medium mb-5">Generate fresh access credentials</p>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-1.5">Target Account ID (Email or Username)</label>
              <input value={credAccountId} onChange={(e) => setCredAccountId(e.target.value)} placeholder="name@rakvih.in" className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-1.5">Access Token Password</label>
              <input type="password" value={credPassword} onChange={(e) => setCredPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-[#f2f7f5] border border-[#e0ebe7] rounded-xl text-[13px] font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8a938f] uppercase tracking-wide mb-2">Clearance Tier Designation</label>
              <div className="flex gap-2">
                {(['INTERNAL', 'EXTERNAL'] as const).map((t) => (
                  <button key={t} onClick={() => setCredTier(t)} className={`flex-1 py-3 rounded-xl text-[11px] font-bold border transition-all ${credTier === t ? 'bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white border-transparent shadow-sm' : 'bg-[#f2f7f5] text-[#4b544f] border-[#e0ebe7]'}`}>
                    {t === 'INTERNAL' ? 'INTERNAL (Full System Override)' : 'EXTERNAL (Outsourced Partner Agency)'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleGenerateCredential} className="w-full py-3.5 bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white font-bold text-[14px] rounded-xl shadow-md">Generate Access Account</button>
          </div>
        </SectionCard>

        <SectionCard className="lg:col-span-3 p-6">
          <h3 className="text-lg font-bold tracking-tight mb-4 px-1">Provisioned accounts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[#8a938f] border-b border-[#e4eae8]">
                <tr>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Account</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Tier</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Generated</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3f2]">
                {credentialAccounts.map((c: CredentialAccount) => (
                  <tr key={c.id}>
                    <td className="py-3 px-3 font-bold whitespace-nowrap">{c.accountId}</td>
                    <td className="py-3 px-3"><StatusPill status={c.tier} /></td>
                    <td className="py-3 px-3 text-[#67736f] font-medium">{c.generatedOn}</td>
                    <td className="py-3 px-3"><StatusPill status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  return null;
}

// =============================================================================
// VENDOR — Application Journey content
// =============================================================================
function VendorContent(props: any) {
  const { tab, vendorCandidates, requirements, vendorCandidateForm, setVendorCandidateForm, addCandidate, interviews, setCandidates } = props;
  const requirementOptions = requirements.map((r: JobRequirement) => `${r.jobTitle} (${r.organization})`).filter((r: string) => r.includes('Web Full Stack'));
  const poolCap = 20;

  if (tab === 'dashboard') {
    const stats = [
      { label: 'Your Pool', value: `${vendorCandidates.length} / ${poolCap}`, sub: 'Candidates submitted', icon: '🧑‍💼' },
      { label: 'In Interview', value: vendorCandidates.filter((c: Candidate) => c.stage === 'Interview').length.toString(), sub: 'Currently under review', icon: '🗓️' },
      { label: 'Offers Made', value: vendorCandidates.filter((c: Candidate) => c.stage === 'Offer').length.toString(), sub: 'Awaiting acceptance', icon: '🤝' },
      { label: 'Joined', value: vendorCandidates.filter((c: Candidate) => c.stage === 'Joining').length.toString(), sub: 'Successful placements', icon: '✅' },
    ];
    const stages: CandidateStage[] = ['Screening', 'Interview', 'Offer', 'Joining', 'Rejected'];
    return (
      <div className="space-y-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <SectionCard key={i} className="p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-bold text-[#8a938f] uppercase tracking-wide">{s.label}</p>
                <span className="text-lg p-2 bg-[#f2f7f5] rounded-lg">{s.icon}</span>
              </div>
              <p className="text-[26px] font-extrabold tracking-tight">{s.value}</p>
              <p className="text-[12px] text-[#67736f] font-medium mt-1.5">{s.sub}</p>
            </SectionCard>
          ))}
        </div>

        <SectionCard className="p-7">
          <h3 className="text-lg font-bold tracking-tight mb-1">Your candidates by stage</h3>
          <p className="text-[12px] text-[#67736f] font-medium mb-6">Progress of everyone you've submitted</p>
          <div className="h-44 flex items-end justify-between gap-4 px-2">
            {stages.map((s) => {
              const count = vendorCandidates.filter((c: Candidate) => c.stage === s).length;
              const max = Math.max(...stages.map((st) => vendorCandidates.filter((c: Candidate) => c.stage === st).length), 1);
              return (
                <div key={s} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[13px] font-extrabold">{count}</span>
                  <div className="w-full bg-[#f2f7f5] rounded-t-lg relative flex items-end" style={{ height: '75%' }}>
                    <div className="w-full bg-gradient-to-t from-[#0f766e] to-[#0e7490] rounded-t-lg opacity-85" style={{ height: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-[#8a938f] uppercase tracking-wide text-center">{s}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    );
  }

  if (tab === 'profile') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-[24px] border border-[#e4eae8]">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Manage Your Candidates</h3>
            <p className="text-[12px] text-[#67736f] font-medium">Add candidates one at a time, or browse everything you've uploaded so far.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-2.5 bg-[#eaf4f1] text-[#0f766e] rounded-full text-[12px] font-extrabold">{vendorCandidates.length} / {poolCap} Candidates</span>
            <span className="px-4 py-2.5 bg-[#f2f7f5] text-[#4b544f] border border-[#e0ebe7] rounded-full text-[12px] font-extrabold">View All {vendorCandidates.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <SectionCard className="lg:col-span-2 p-7">
            <h3 className="text-lg font-bold tracking-tight">New Candidate Profile</h3>
            <p className="text-[12px] text-[#67736f] font-medium mb-1">Parse a single resume into your pipeline</p>
            <p className="text-[11px] font-bold text-[#0f766e] mb-5">{poolCap - vendorCandidates.length} slots left</p>
            <CandidateProfileForm
              form={vendorCandidateForm}
              setForm={setVendorCandidateForm}
              requirementOptions={requirementOptions}
              restrictedPipeline
              onSubmit={() => {
                if (vendorCandidates.length >= poolCap) { alert('Your candidate pool is full.'); return; }
                addCandidate(vendorCandidateForm, 'vendor', () => setVendorCandidateForm(blankCandidateForm));
              }}
              submitLabel="Parse & Upload Profile"
            />
          </SectionCard>

          <SectionCard className="lg:col-span-3 p-7">
            <h3 className="text-lg font-bold tracking-tight mb-5">Ingestion Preview</h3>
            <div className="space-y-3.5 text-[13px]">
              <div className="flex justify-between border-b border-[#f0f3f2] pb-2.5">
                <span className="text-[#8a938f] font-semibold">Candidate</span>
                <span className="font-bold">{vendorCandidateForm.firstName || vendorCandidateForm.lastName ? `${vendorCandidateForm.firstName} ${vendorCandidateForm.lastName}`.trim() : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#f0f3f2] pb-2.5">
                <span className="text-[#8a938f] font-semibold">Contact</span>
                <span className="font-bold">{vendorCandidateForm.email || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#f0f3f2] pb-2.5">
                <span className="text-[#8a938f] font-semibold">Experience</span>
                <span className="font-bold">{vendorCandidateForm.experienceStatus}</span>
              </div>
              <div className="flex justify-between border-b border-[#f0f3f2] pb-2.5">
                <span className="text-[#8a938f] font-semibold">Notice Period</span>
                <span className="font-bold">{vendorCandidateForm.noticePeriod}</span>
              </div>
              <div className="flex justify-between border-b border-[#f0f3f2] pb-2.5">
                <span className="text-[#8a938f] font-semibold">Expected Salary</span>
                <span className="font-bold">{vendorCandidateForm.expectedSalary || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#f0f3f2] pb-2.5">
                <span className="text-[#8a938f] font-semibold">File</span>
                <span className="font-bold">{vendorCandidateForm.resumeFileName || 'No file'}</span>
              </div>
              <div className="flex justify-between border-b border-[#f0f3f2] pb-2.5">
                <span className="text-[#8a938f] font-semibold">Mapped Requirement</span>
                <span className="font-bold">{vendorCandidateForm.requirement || 'General pool'}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#8a938f] font-semibold">Stage on upload</span>
                <StatusPill status="Screening" />
              </div>
            </div>

            <div className="mt-7 pt-6 border-t border-[#e4eae8]">
              <h4 className="font-bold text-[14px] mb-3">Your submitted candidates</h4>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {vendorCandidates.length === 0 ? <EmptyState icon="🗂️" title="No candidates yet" note="Submit your first profile using the form." /> : vendorCandidates.map((c: Candidate) => (
                  <div key={c.id} className="p-3.5 bg-[#f2f7f5] rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[13px]">{c.firstName} {c.lastName}</p>
                      <p className="text-[11px] text-[#8a938f] font-medium">{c.requirement}</p>
                    </div>
                    <StatusPill status={c.stage} />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  if (tab === 'interview-details') {
    return (
      <SectionCard className="p-6">
        <div className="mb-4 px-1">
          <p className="text-[13px] text-[#67736f] font-medium">Track the evaluation status and review stages of candidates submitted through your account.</p>
        </div>
        {vendorCandidates.length === 0 ? (
          <EmptyState icon="🗓️" title="No candidates in evaluation" note="Interview status will appear here once you submit candidates." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[#8a938f] border-b border-[#e4eae8]">
                <tr>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Candidate</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Requirement</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Interview Slot</th>
                  <th className="pb-3 px-3 font-bold uppercase text-[10px] tracking-wide">Current Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3f2]">
                {vendorCandidates.map((c: Candidate) => {
                  const iv = interviews.find((i: InterviewSlot) => i.candidateName === `${c.firstName} ${c.lastName}`);
                  return (
                    <tr key={c.id}>
                      <td className="py-3 px-3 font-bold whitespace-nowrap">{c.firstName} {c.lastName}</td>
                      <td className="py-3 px-3 text-[#67736f] font-medium max-w-[180px] truncate">{c.requirement}</td>
                      <td className="py-3 px-3 text-[#67736f] font-medium whitespace-nowrap">{iv ? `${iv.date} · ${iv.time}` : 'Not scheduled'}</td>
                      <td className="py-3 px-3"><StatusPill status={c.stage} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    );
  }

  if (tab === 'onboarding') {
    const offerCandidates = vendorCandidates.filter((c: Candidate) => c.stage === 'Offer');
    return (
      <div className="space-y-4">
        <SectionCard className="p-6">
          <p className="text-[13px] text-[#67736f] font-medium">Candidates currently sitting in the Offer stage. Once an offer is accepted, the record moves on to Joining and drops off this list.</p>
        </SectionCard>

        {offerCandidates.length === 0 ? (
          <SectionCard className="p-6"><EmptyState icon="🤝" title="No pending offers" note="Candidates who reach the offer stage will appear here." /></SectionCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {offerCandidates.map((c: Candidate) => (
              <SectionCard key={c.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <img src={avatarUrl(`${c.firstName} ${c.lastName}`)} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-bold text-[14px]">{c.firstName} {c.lastName}</p>
                      <p className="text-[11px] text-[#8a938f] font-medium">{c.requirement}</p>
                    </div>
                  </div>
                  <StatusPill status="Offer" />
                </div>
                <p className="text-[12px] text-[#67736f] font-medium mb-4">Expected CTC: {c.expectedSalary}</p>
                <button
                  onClick={() => setCandidates((prev: Candidate[]) => prev.map((x) => x.id === c.id ? { ...x, stage: 'Joining' } : x))}
                  className="w-full py-2.5 bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-white font-bold text-[12px] rounded-xl shadow-sm"
                >
                  Mark Offer Accepted → Move to Joining
                </button>
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}