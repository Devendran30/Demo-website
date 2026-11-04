'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { initialStudents, initialTeachers, initialAnnouncements, Student, Teacher, Announcement } from '@/data/mockData';

interface SubjectItem {
    id: string;
    name: string;
    code: string;
    grade: string;
}

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'Super Admin' | 'Sub-Admin' | 'Accounts Admin' | 'Transport Admin';
    status: 'Active' | 'Inactive';
    lastLogin: string;
}

interface PhotoAlbum {
    id: string;
    title: string;
    category: string;
    photoCount: number;
    coverImage: string;
    dateAdded: string;
}

interface MarksRecord {
    id: string;
    studentName: string;
    grade: string;
    examName: string;
    subject: string;
    marksObtained: number;
    maxMarks: number;
}
interface ExamTimeTableSlot {
    id: string;
    examName: string;
    grade: string;
    subject: string;
    date: string;
    timeSlot: string;
}
interface StudentFeeRecord {
    id: string;
    studentName: string;
    grade: string;
    totalFee: number;
    paidAmount: number;
    dueDate: string;
}
interface FeeStructureItem {
    id: string;
    grade: string;
    tuitionFee: number;
    libraryFee: number;
    busFee: number;
    otherFee: number;
    total: number;
}

interface TimeTableSlot {
    id: string;
    grade: string;
    day: string;
    period: string;
    subject: string;
    teacher: string;
}
interface ExamItem {
    id: string;
    name: string;
    maxMarks: string;
    passingMarks: string;
    date: string;
}

interface TransportAllocation {
    id: string;
    studentName: string;
    grade: string;
    routeNumber: string;
    busNumber: string;
    pickupPoint: string;
}


interface CalendarEvent {
    id: string;
    title: string;
    category: 'Holiday' | 'Exam' | 'Sports' | 'Cultural';
    date: string;
    description: string;
}


function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const role = searchParams.get('role') || 'admin';

    // Active Tab State for Admin Dashboard
    const [activeTab, setActiveTab] = useState('dashboard');
    const [exams, setExams] = useState<ExamItem[]>([
        { id: '1', name: 'Mid-Term Examination 2026', maxMarks: '100', passingMarks: '35', date: '2026-09-15' },
        { id: '2', name: 'Unit Test 1', maxMarks: '50', passingMarks: '18', date: '2026-07-10' },
    ]);
    const [newExamName, setNewExamName] = useState('');
    const [newExamMax, setNewExamMax] = useState('100');
    const [newExamPass, setNewExamPass] = useState('35');
    const [newExamDate, setNewExamDate] = useState('');
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);

    const [examTimetables, setExamTimetables] = useState<ExamTimeTableSlot[]>([
        { id: '1', examName: 'Mid-Term Examination 2026', grade: '10th A', subject: 'Mathematics', date: '2026-09-15', timeSlot: '09:00 AM - 12:00 PM' },
        { id: '2', examName: 'Mid-Term Examination 2026', grade: '10th A', subject: 'Advanced Physics', date: '2026-09-17', timeSlot: '09:00 AM - 12:00 PM' },
    ]);
    const [ettExamName, setEttExamName] = useState('Mid-Term Examination 2026');
    const [ettGrade, setEttGrade] = useState('10th A');
    const [ettSubject, setEttSubject] = useState('Mathematics');
    const [ettDate, setEttDate] = useState('');
    const [ettTimeSlot, setEttTimeSlot] = useState('09:00 AM - 12:00 PM');
    const [isExamTtModalOpen, setIsExamTtModalOpen] = useState(false);


    const [photoAlbums, setPhotoAlbums] = useState<PhotoAlbum[]>([
        { id: '1', title: 'Annual Day Celebration', category: 'Cultural', photoCount: 42, coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400', dateAdded: '2026-04-12' },
        { id: '2', title: 'Science Expo & Exhibits', category: 'Academics', photoCount: 28, coverImage: 'https://images.unsplash.com/photo-1567168544813-cc03465b4fa8?auto=format&fit=crop&q=80&w=400', dateAdded: '2026-03-20' },
        { id: '3', title: 'Annual Sports Meet', category: 'Sports', photoCount: 56, coverImage: 'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?auto=format&fit=crop&q=80&w=400', dateAdded: '2026-01-15' },
    ]);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [albumTitle, setAlbumTitle] = useState('');
    const [albumCategory, setAlbumCategory] = useState('Cultural');
    const [albumCount, setAlbumCount] = useState('15');
    const [albumImage, setAlbumImage] = useState('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400');

    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
        { id: '1', title: 'Independence Day Celebration', category: 'Cultural', date: '2026-08-15', description: 'Flag hoisting ceremony and cultural programs in the auditorium.' },
        { id: '2', title: 'Mid-Term Examinations Begin', category: 'Exam', date: '2026-09-15', description: 'Start of term 1 centralized exams for classes 9th to 12th.' },
        { id: '3', title: 'Diwali Holiday Break', category: 'Holiday', date: '2026-11-08', description: 'School closed for Deepavali festival holidays.' },
    ]);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [evtTitle, setEvtTitle] = useState('');
    const [evtCategory, setEvtCategory] = useState<'Holiday' | 'Exam' | 'Sports' | 'Cultural'>('Cultural');
    const [evtDate, setEvtDate] = useState('');
    const [evtDesc, setEvtDesc] = useState('');

    const [transportAllocations, setTransportAllocations] = useState<TransportAllocation[]>([
        { id: '1', studentName: 'Aarav Sharma', grade: '10th A', routeNumber: 'Route 101', busNumber: 'KA-01-F-9821', pickupPoint: 'MG Road Metro Station' },
        { id: '2', studentName: 'Ananya Patel', grade: '10th A', routeNumber: 'Route 102', busNumber: 'KA-01-F-4432', pickupPoint: 'Indiranagar 12th Main' },
        { id: '3', studentName: 'Rohan Verma', grade: '9th B', routeNumber: 'Route 101', busNumber: 'KA-01-F-9821', pickupPoint: 'Brigade Road Signal' },
    ]);
    const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
    const [tStudentName, setTStudentName] = useState('');
    const [tGrade, setTGrade] = useState('10th A');
    const [tRouteNumber, setTRouteNumber] = useState('Route 101 (North Zone)');
    const [tBusNumber, setTBusNumber] = useState('KA-01-F-9821');
    const [tPickupPoint, setTPickupPoint] = useState('');


    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
        { id: '1', name: 'Vyshnavi V Gowda', email: 'vyshnavi@rakvih.com', role: 'Super Admin', status: 'Active', lastLogin: '2026-08-13 10:30 AM' },
        { id: '2', name: 'Rajesh Kumar', email: 'rajesh.admin@school.edu', role: 'Accounts Admin', status: 'Active', lastLogin: '2026-08-12 04:15 PM' },
        { id: '3', name: 'Priya Sharma', email: 'priya.transport@school.edu', role: 'Transport Admin', status: 'Inactive', lastLogin: '2026-07-28 09:00 AM' },
    ]);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [admName, setAdmName] = useState('');
    const [admEmail, setAdmEmail] = useState('');
    const [admRole, setAdmRole] = useState<'Super Admin' | 'Sub-Admin' | 'Accounts Admin' | 'Transport Admin'>('Sub-Admin');
    const [admStatus, setAdmStatus] = useState<'Active' | 'Inactive'>('Active');

    const [schoolName, setSchoolName] = useState('Rakvih School Demo & High School');
    const [academicYear, setAcademicYear] = useState('2026-2027');
    const [schoolAddress, setSchoolAddress] = useState('#45, Knowledge Park, Outer Ring Road, Bengaluru - 560103');
    const [contactEmail, setContactEmail] = useState('info@prashanthischool.edu');
    const [contactPhone, setContactPhone] = useState('+91 80 2345 6789');
    const [socialFacebook, setSocialFacebook] = useState('https://facebook.com/prashanthischool');
    const [socialInstagram, setSocialInstagram] = useState('https://instagram.com/prashanthi_edu');
    const [socialTwitter, setSocialTwitter] = useState('https://twitter.com/prashanthi_sch');
    const [socialYoutube, setSocialYoutube] = useState('https://youtube.com/@prashanthischool');
    const [isSettingsSaved, setIsSettingsSaved] = useState(false);

    const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([
        { id: '1', grade: '10th A', tuitionFee: 25000, libraryFee: 2000, busFee: 5000, otherFee: 1500, total: 33500 },
        { id: '2', grade: '9th B', tuitionFee: 22000, libraryFee: 2000, busFee: 5000, otherFee: 1500, total: 30500 },
    ]);
    const [feeGrade, setFeeGrade] = useState('11th Science');
    const [tuitionAmount, setTuitionAmount] = useState('30000');
    const [libraryAmount, setLibraryAmount] = useState('2500');
    const [busAmount, setBusAmount] = useState('5000');
    const [otherAmount, setOtherAmount] = useState('2000');
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);

    const [marksLedger, setMarksLedger] = useState<MarksRecord[]>([
        { id: '1', studentName: 'Aarav Sharma', grade: '10th A', examName: 'Mid-Term Examination 2026', subject: 'Mathematics', marksObtained: 88, maxMarks: 100 },
        { id: '2', studentName: 'Ananya Patel', grade: '10th A', examName: 'Mid-Term Examination 2026', subject: 'Advanced Physics', marksObtained: 92, maxMarks: 100 },
        { id: '3', studentName: 'Rohan Verma', grade: '9th B', examName: 'Unit Test 1', subject: 'Science', marksObtained: 42, maxMarks: 50 },
    ]);
    const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
    const [mStudentName, setMStudentName] = useState('');
    const [mGrade, setMGrade] = useState('10th A');
    const [mExamName, setMExamName] = useState('Mid-Term Examination 2026');
    const [mSubject, setMSubject] = useState('Mathematics');
    const [mObtained, setMObtained] = useState('');
    const [mMax, setMMax] = useState('100');


    const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([
        { id: '1', studentName: 'Aarav Sharma', grade: '10th A', totalFee: 33500, paidAmount: 25000, dueDate: '2026-06-30' },
        { id: '2', studentName: 'Ananya Patel', grade: '10th A', totalFee: 33500, paidAmount: 33500, dueDate: '2026-06-30' },
        { id: '3', studentName: 'Rohan Verma', grade: '9th B', totalFee: 30500, paidAmount: 10000, dueDate: '2026-07-15' },
    ]);
    const [isFeePaymentModalOpen, setIsFeePaymentModalOpen] = useState(false);
    const [recordStudentName, setRecordStudentName] = useState('');
    const [recordGrade, setRecordGrade] = useState('10th A');
    const [recordTotalFee, setRecordTotalFee] = useState('33500');
    const [recordPaidAmount, setRecordPaidAmount] = useState('');
    const [recordDueDate, setRecordDueDate] = useState('');

    // Shared Demo State
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [teachers] = useState<Teacher[]>(initialTeachers);
    const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

    // 1. Subjects State & Form
    const [subjects, setSubjects] = useState<SubjectItem[]>([
        { id: '1', name: 'Mathematics', code: 'MATH101', grade: '10th A' },
        { id: '2', name: 'Advanced Physics', code: 'PHY202', grade: '10th A' },
        { id: '3', name: 'Organic Chemistry', code: 'CHEM301', grade: '9th B' },
    ]);
    const [newSubName, setNewSubName] = useState('');
    const [newSubCode, setNewSubCode] = useState('');
    const [newSubGrade, setNewSubGrade] = useState('10th A');

    // 2. Time Table State & Form (Class-wise)
    const [timetables, setTimetables] = useState<TimeTableSlot[]>([
        { id: '1', grade: '10th A', day: 'Monday', period: 'Period 1 (09:00 AM)', subject: 'Mathematics', teacher: 'Mr. Rajesh Kumar' },
        { id: '2', grade: '10th A', day: 'Monday', period: 'Period 2 (10:00 AM)', subject: 'Advanced Physics', teacher: 'Ms. Priya Singh' },
        { id: '3', grade: '9th B', day: 'Monday', period: 'Period 1 (09:00 AM)', subject: 'Organic Chemistry', teacher: 'Ms. Priya Singh' },
    ]);
    const [ttGrade, setTtGrade] = useState('10th A');
    const [ttDay, setTtDay] = useState('Monday');
    const [ttPeriod, setTtPeriod] = useState('Period 1 (09:00 AM)');
    const [ttSubject, setTtSubject] = useState('Mathematics');
    const [ttTeacher, setTtTeacher] = useState('Mr. Rajesh Kumar');
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    // 3. Attendance Demo State (Class-wise interactive toggle)
    const [attendanceClass, setAttendanceClass] = useState('10th A');
    const [studentAttendanceStatus, setStudentAttendanceStatus] = useState<Record<string, string>>({
        '1': 'Present',
        '2': 'Present',
        '3': 'Absent',
    });

    // Sidebar Group Structure
    const sidebarGroups = [
        { title: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard' }] },
        {
            title: 'Academics',
            items: [
                { id: 'teachers', label: 'Teachers' },
                { id: 'students', label: 'Students' },
                { id: 'classes', label: 'Classes & Sections' },
                { id: 'subjects', label: 'Subjects' },
                { id: 'timetable', label: 'Time Table' },
            ],
        },
        {
            title: 'Operations',
            items: [
                { id: 'attendance', label: 'Attendance' },
                { id: 'exam-setup', label: 'Exam Setup' },
                { id: 'exam-timetable', label: 'Exam Time Table' },
                { id: 'fee-setup', label: 'Fee Setup' },
            ],
        },
        {
            title: 'Data Center',
            items: [
                { id: 'marks-ledger', label: 'Marks Ledger' },
                { id: 'fee-management', label: 'Fee Management' },

            ],
        },
        { title: 'Logistics', items: [{ id: 'transport', label: 'Transport' }] },
        {
            title: 'Communication',
            items: [
                { id: 'notices', label: 'Notices' },
                { id: 'calendar', label: 'Calendar' },
                { id: 'photo-gallery', label: 'Photo Gallery' },
            ],
        },
        {
            title: 'System',
            items: [
                { id: 'admin-management', label: 'Admin Management' },
                { id: 'settings', label: 'Settings' },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                        Rakvih School Demo
                    </h2>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role: {role}</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {role === 'admin' ? (
                        sidebarGroups.map((group, idx) => (
                            <div key={idx} className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-2">{group.title}</p>
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeTab === item.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-slate-400 p-2">Standard view active for {role}.</div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                    >
                        Logout / Switch Role
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto max-h-screen">
                <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold capitalize tracking-tight">
                            {role === 'admin' ? activeTab.replace('-', ' ') : `${role} Dashboard`}
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage school operations and view analytics seamlessly.</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-400">
                        Academic Year: 2026-27
                    </span>
                </header>

                {role === 'admin' && (
                    <div className="space-y-6">
                        {/* 1. DASHBOARD */}
                        {/* 1. DASHBOARD OVERVIEW */}
                        {activeTab === 'dashboard' && (
                            <div className="space-y-6">
                                {/* Top Metric Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Students</p>
                                            <p className="text-3xl font-bold mt-2 text-blue-400">{students?.length || 1420}</p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                                            <span>Active Enrollments</span>
                                            <span className="text-emerald-400 font-semibold">+12% this term</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Teachers</p>
                                            <p className="text-3xl font-bold mt-2 text-indigo-400">{teachers?.length || 68}</p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                                            <span>Faculty Staff</span>
                                            <span className="text-indigo-400 font-semibold">100% Verified</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fee Collection</p>
                                            <p className="text-3xl font-bold mt-2 text-emerald-400">
                                                {typeof feeRecords !== 'undefined' && feeRecords.length > 0
                                                    ? `${Math.round((feeRecords.reduce((acc, r) => acc + r.paidAmount, 0) / feeRecords.reduce((acc, r) => acc + r.totalFee, 0)) * 100)}%`
                                                    : '86.4%'}
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                                            <span>Real-time Ledger</span>
                                            <span className="text-emerald-400 font-semibold">On Track</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Notices</p>
                                            <p className="text-3xl font-bold mt-2 text-amber-400">{announcements?.length || 5}</p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                                            <span>Broadcasted</span>
                                            <span className="text-amber-400 font-semibold">Live</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity & Quick Shortcuts Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-100">School Performance Summary</h3>
                                        <p className="text-xs text-slate-400">Overview of student attendance, average examination scores, and transport utilization for academic year 2026-2027.</p>

                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                                    <span>Overall Attendance Rate</span>
                                                    <span className="text-emerald-400">94.2%</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94.2%' }}></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                                    <span>Fee Collection Progress</span>
                                                    <span className="text-blue-400">86.4%</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '86.4%' }}></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                                    <span>Transport Route Capacity</span>
                                                    <span className="text-purple-400">78.0%</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '78.0%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-semibold text-slate-100">Quick Actions</h3>
                                            <p className="text-xs text-slate-400">Frequently used administrative shortcuts.</p>

                                            <div className="space-y-2 pt-2">
                                                <button
                                                    onClick={() => setActiveTab('fee-management')}
                                                    className="w-full text-left px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-200 transition-all flex justify-between items-center"
                                                >
                                                    <span>Record Fee Payment</span>
                                                    <span>→</span>
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('marks-ledger')}
                                                    className="w-full text-left px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-200 transition-all flex justify-between items-center"
                                                >
                                                    <span>Add Grade Transcript</span>
                                                    <span>→</span>
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('transport')}
                                                    className="w-full text-left px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-200 transition-all flex justify-between items-center"
                                                >
                                                    <span>Allocate Student Bus</span>
                                                    <span>→</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                                            Rakvih School Demo Portal v2.5
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. TEACHERS */}
                        {activeTab === 'teachers' && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold">Teacher Directory</h3>
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                                        <tr>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Subject</th>
                                            <th className="p-3">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {teachers.map((t) => (
                                            <tr key={t.id}>
                                                <td className="p-3 font-medium text-slate-100">{t.name}</td>
                                                <td className="p-3">{t.subject}</td>
                                                <td className="p-3 text-slate-400">{t.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 3. STUDENTS */}
                        {activeTab === 'students' && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold">Student Directory</h3>
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                                        <tr>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Grade</th>
                                            <th className="p-3">Attendance</th>
                                            <th className="p-3">Fees</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {students.map((s) => (
                                            <tr key={s.id}>
                                                <td className="p-3 font-medium">{s.name}</td>
                                                <td className="p-3">{s.grade}</td>
                                                <td className="p-3">{s.attendance}</td>
                                                <td className="p-3 text-emerald-400">{s.feesStatus}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 4. CLASSES & SECTIONS */}
                        {activeTab === 'classes' && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold">Classes & Sections Setup</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {['Grade 9 (A & B)', 'Grade 10 (A & B)', 'Grade 11 (Science & Commerce)'].map((cls, i) => (
                                        <div key={i} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl">
                                            <p className="font-semibold text-slate-200">{cls}</p>
                                            <p className="text-xs text-slate-400 mt-1">Status: Active</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. SUBJECTS (Interactive Add with Modal & Remove Demo) */}
                        {activeTab === 'subjects' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Subject Management</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Add, organize, and assign curriculum subjects across grades.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsSubjectModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Add Subject</span>
                                    </button>
                                </div>

                                {/* Configured Subjects Grid */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-100">Configured Curriculum Subjects</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {subjects.map((sub) => (
                                            <div key={sub.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-slate-100">{sub.name}</p>
                                                    <p className="text-xs text-slate-400">Code: {sub.code} | Class: {sub.grade}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSubjects(subjects.filter((s) => s.id !== sub.id))}
                                                    className="text-xs text-rose-400 hover:underline font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Subject Popup Modal */}
                                {isSubjectModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Add New Subject</h3>
                                                <button
                                                    onClick={() => setIsSubjectModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!newSubName || !newSubCode) return;
                                                    setSubjects([
                                                        ...subjects,
                                                        { id: Date.now().toString(), name: newSubName, code: newSubCode, grade: newSubGrade },
                                                    ]);
                                                    setNewSubName('');
                                                    setNewSubCode('');
                                                    setIsSubjectModalOpen(false); // Close modal on save
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Subject Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Biology"
                                                        value={newSubName}
                                                        onChange={(e) => setNewSubName(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Subject Code</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. BIO101"
                                                        value={newSubCode}
                                                        onChange={(e) => setNewSubCode(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Assign Class / Grade</label>
                                                    <select
                                                        value={newSubGrade}
                                                        onChange={(e) => setNewSubGrade(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="9th B">9th B</option>
                                                        <option value="10th A">10th A</option>
                                                        <option value="11th Science">11th Science</option>
                                                    </select>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsSubjectModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Save Subject
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 6. TIME TABLE (Interactive Schedule Generator for All Classes) */}
                        {activeTab === 'timetable' && (
                            <div className="space-y-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold mb-4">Add Time Table Schedule for any Class</h3>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            setTimetables([
                                                ...timetables,
                                                { id: Date.now().toString(), grade: ttGrade, day: ttDay, period: ttPeriod, subject: ttSubject, teacher: ttTeacher },
                                            ]);
                                        }}
                                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                    >
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Select Class / Grade</label>
                                            <select value={ttGrade} onChange={(e) => setTtGrade(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm">
                                                <option value="9th B">9th B</option>
                                                <option value="10th A">10th A</option>
                                                <option value="11th Science">11th Science</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Day of Week</label>
                                            <select value={ttDay} onChange={(e) => setTtDay(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm">
                                                <option value="Monday">Monday</option>
                                                <option value="Tuesday">Tuesday</option>
                                                <option value="Wednesday">Wednesday</option>
                                                <option value="Thursday">Thursday</option>
                                                <option value="Friday">Friday</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Time Slot / Period</label>
                                            <input type="text" value={ttPeriod} onChange={(e) => setTtPeriod(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm" placeholder="Period 3 (11:00 AM)" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Subject Name</label>
                                            <input type="text" value={ttSubject} onChange={(e) => setTtSubject(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Assigned Teacher</label>
                                            <input type="text" value={ttTeacher} onChange={(e) => setTtTeacher(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm" required />
                                        </div>
                                        <div className="flex items-end">
                                            <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all">
                                                + Add Time Table Slot
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold mb-4">Master Time Table Grid</h3>
                                    <div className="space-y-3">
                                        {timetables.map((slot) => (
                                            <div key={slot.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center text-sm">
                                                <div>
                                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded font-semibold mr-3">{slot.grade}</span>
                                                    <span className="font-medium text-slate-100">{slot.day} - {slot.period}: <strong>{slot.subject}</strong></span>
                                                </div>
                                                <span className="text-xs text-slate-400">Teacher: {slot.teacher}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 7. ATTENDANCE (Interactive Demo Check-in & Filter by Class) */}
                        {activeTab === 'attendance' && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Daily Class Attendance Management</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Filter students by class and mark attendance interactively.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">Select Class:</span>
                                        <select
                                            value={attendanceClass}
                                            onChange={(e) => setAttendanceClass(e.target.value)}
                                            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="10th A">10th A</option>
                                            <option value="9th B">9th B</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                                            <tr>
                                                <th className="p-3">Student Name</th>
                                                <th className="p-3">Grade</th>
                                                <th className="p-3">Mark Status (Click to Toggle)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {students.filter((s) => s.grade === attendanceClass).length > 0 ? (
                                                students
                                                    .filter((s) => s.grade === attendanceClass)
                                                    .map((s) => (
                                                        <tr key={s.id}>
                                                            <td className="p-3 font-medium text-slate-100">{s.name}</td>
                                                            <td className="p-3 text-slate-300">{s.grade}</td>
                                                            <td className="p-3">
                                                                <button
                                                                    onClick={() =>
                                                                        setStudentAttendanceStatus({
                                                                            ...studentAttendanceStatus,
                                                                            [s.id]: studentAttendanceStatus[s.id] === 'Absent' ? 'Present' : 'Absent',
                                                                        })
                                                                    }
                                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${(studentAttendanceStatus[s.id] || 'Present') === 'Present'
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                        }`}
                                                                >
                                                                    {studentAttendanceStatus[s.id] || 'Present'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="p-6 text-center text-xs text-slate-500">
                                                        No students found registered for class {attendanceClass}.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* EXAM SETUP (Interactive Add/Remove & Configuration) */}
                        {activeTab === 'exam-setup' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Exam Configuration Panel</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Create examinations, set maximum marks, passing thresholds, and dates.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsExamModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Add Exam</span>
                                    </button>
                                </div>

                                {/* Configured Exams Grid */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-100">Configured Examinations</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {exams.map((exam) => (
                                            <div key={exam.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-slate-100">{exam.name}</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Max Marks: {exam.maxMarks} | Passing: {exam.passingMarks} | Date: {exam.date}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setExams(exams.filter((e) => e.id !== exam.id))}
                                                    className="text-xs text-rose-400 hover:underline font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Exam Modal Popup */}
                                {isExamModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Add New Examination</h3>
                                                <button
                                                    onClick={() => setIsExamModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!newExamName) return;
                                                    setExams([
                                                        ...exams,
                                                        {
                                                            id: Date.now().toString(),
                                                            name: newExamName,
                                                            maxMarks: newExamMax,
                                                            passingMarks: newExamPass,
                                                            date: newExamDate || '2026-10-01',
                                                        },
                                                    ]);
                                                    setNewExamName('');
                                                    setIsExamModalOpen(false);
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Exam Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Final Term Examination"
                                                        value={newExamName}
                                                        onChange={(e) => setNewExamName(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Max Marks</label>
                                                        <input
                                                            type="text"
                                                            value={newExamMax}
                                                            onChange={(e) => setNewExamMax(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Passing Marks</label>
                                                        <input
                                                            type="text"
                                                            value={newExamPass}
                                                            onChange={(e) => setNewExamPass(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Exam Date</label>
                                                    <input
                                                        type="date"
                                                        value={newExamDate}
                                                        onChange={(e) => setNewExamDate(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsExamModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Save Exam
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* EXAM TIME TABLE (Interactive Add/Remove Schedule & Filter) */}
                        {activeTab === 'exam-timetable' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Exam Time Table Schedule</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Manage examination datesheets, time slots, and hall allocations.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsExamTtModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Add Exam Schedule</span>
                                    </button>
                                </div>

                                {/* Configured Exam Time Table List */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-100">Master Examination Datesheet</h3>
                                    <div className="space-y-3">
                                        {examTimetables.map((slot) => (
                                            <div key={slot.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center text-sm">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded font-semibold">{slot.grade}</span>
                                                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs rounded font-semibold">{slot.examName}</span>
                                                    </div>
                                                    <p className="font-semibold text-slate-100">{slot.subject} <span className="text-xs text-slate-400 font-normal">({slot.date} | {slot.timeSlot})</span></p>
                                                </div>
                                                <button
                                                    onClick={() => setExamTimetables(examTimetables.filter((s) => s.id !== slot.id))}
                                                    className="text-xs text-rose-400 hover:underline font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Exam Time Table Modal Popup */}
                                {isExamTtModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Add Exam Schedule Slot</h3>
                                                <button
                                                    onClick={() => setIsExamTtModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!ettSubject) return;
                                                    setExamTimetables([
                                                        ...examTimetables,
                                                        {
                                                            id: Date.now().toString(),
                                                            examName: ettExamName,
                                                            grade: ettGrade,
                                                            subject: ettSubject,
                                                            date: ettDate || '2026-09-20',
                                                            timeSlot: ettTimeSlot,
                                                        },
                                                    ]);
                                                    setIsExamTtModalOpen(false);
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Select Examination</label>
                                                    <select
                                                        value={ettExamName}
                                                        onChange={(e) => setEttExamName(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    >
                                                        {exams.map((ex) => (
                                                            <option key={ex.id} value={ex.name}>{ex.name}</option>
                                                        ))}
                                                        <option value="Mid-Term Examination 2026">Mid-Term Examination 2026</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Assign Class / Grade</label>
                                                    <select
                                                        value={ettGrade}
                                                        onChange={(e) => setEttGrade(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="9th B">9th B</option>
                                                        <option value="10th A">10th A</option>
                                                        <option value="11th Science">11th Science</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Subject Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Mathematics"
                                                        value={ettSubject}
                                                        onChange={(e) => setEttSubject(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Exam Date</label>
                                                        <input
                                                            type="date"
                                                            value={ettDate}
                                                            onChange={(e) => setEttDate(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Time Slot</label>
                                                        <input
                                                            type="text"
                                                            value={ettTimeSlot}
                                                            onChange={(e) => setEttTimeSlot(e.target.value)}
                                                            placeholder="09:00 AM - 12:00 PM"
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsExamTtModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Save Schedule Slot
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* FEE SETUP & INSTALLMENTS (Interactive Class-wise Fee Breakdown & Total) */}
                        {activeTab === 'fee-setup' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Fee Setup & Installments</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Configure class tuition heads, library charges, transport, and total fee distributions.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsFeeModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Add Fee Structure</span>
                                    </button>
                                </div>

                                {/* Configured Fee Structures Grid */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-100">Class-wise Fee Distribution</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {feeStructures.map((item) => (
                                            <div key={item.id} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-4">
                                                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20">
                                                        {item.grade}
                                                    </span>
                                                    <button
                                                        onClick={() => setFeeStructures(feeStructures.filter((f) => f.id !== item.id))}
                                                        className="text-xs text-rose-400 hover:underline font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                                                    <div className="bg-slate-800/60 p-2.5 rounded-lg">
                                                        <span className="text-slate-400 block mb-0.5">Tuition Fee</span>
                                                        <span className="font-semibold text-slate-100">₹{item.tuitionFee.toLocaleString()}</span>
                                                    </div>
                                                    <div className="bg-slate-800/60 p-2.5 rounded-lg">
                                                        <span className="text-slate-400 block mb-0.5">Library Fee</span>
                                                        <span className="font-semibold text-slate-100">₹{item.libraryFee.toLocaleString()}</span>
                                                    </div>
                                                    <div className="bg-slate-800/60 p-2.5 rounded-lg">
                                                        <span className="text-slate-400 block mb-0.5">Bus / Transport</span>
                                                        <span className="font-semibold text-slate-100">₹{item.busFee.toLocaleString()}</span>
                                                    </div>
                                                    <div className="bg-slate-800/60 p-2.5 rounded-lg">
                                                        <span className="text-slate-400 block mb-0.5">Other / Lab</span>
                                                        <span className="font-semibold text-slate-100">₹{item.otherFee.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-2 flex justify-between items-center">
                                                    <span className="text-xs font-semibold text-slate-400">Total Annual Fee</span>
                                                    <span className="text-base font-bold text-emerald-400">₹{item.total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Fee Structure Modal Popup */}
                                {isFeeModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Configure Class Fee</h3>
                                                <button
                                                    onClick={() => setIsFeeModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const t = Number(tuitionAmount) || 0;
                                                    const l = Number(libraryAmount) || 0;
                                                    const b = Number(busAmount) || 0;
                                                    const o = Number(otherAmount) || 0;
                                                    const calculatedTotal = t + l + b + o;

                                                    setFeeStructures([
                                                        ...feeStructures,
                                                        {
                                                            id: Date.now().toString(),
                                                            grade: feeGrade,
                                                            tuitionFee: t,
                                                            libraryFee: l,
                                                            busFee: b,
                                                            otherFee: o,
                                                            total: calculatedTotal,
                                                        },
                                                    ]);
                                                    setIsFeeModalOpen(false);
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Select Class / Grade</label>
                                                    <select
                                                        value={feeGrade}
                                                        onChange={(e) => setFeeGrade(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="9th B">9th B</option>
                                                        <option value="10th A">10th A</option>
                                                        <option value="11th Science">11th Science</option>
                                                        <option value="12th Commerce">12th Commerce</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Tuition Fee (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={tuitionAmount}
                                                            onChange={(e) => setTuitionAmount(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Library Fee (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={libraryAmount}
                                                            onChange={(e) => setLibraryAmount(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Bus / Transport (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={busAmount}
                                                            onChange={(e) => setBusAmount(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Other / Lab Fee (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={otherAmount}
                                                            onChange={(e) => setOtherAmount(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-slate-800/80 rounded-xl flex justify-between items-center border border-slate-700">
                                                    <span className="text-xs text-slate-300 font-medium">Calculated Total:</span>
                                                    <span className="text-sm font-bold text-emerald-400">
                                                        ₹{((Number(tuitionAmount) || 0) + (Number(libraryAmount) || 0) + (Number(busAmount) || 0) + (Number(otherAmount) || 0)).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsFeeModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Save Fee Structure
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* MARKS LEDGER (Interactive Consolidated Grade Transcripts) */}
                        {activeTab === 'marks-ledger' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Marks Ledger & Transcripts</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Consolidated grade transcripts, exam scores, and performance evaluation for all sections.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsMarksModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Add Marks Entry</span>
                                    </button>
                                </div>

                                {/* Marks Ledger Table */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-100">Student Grade Transcripts</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-300">
                                            <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                                                <tr>
                                                    <th className="p-3">Student Name</th>
                                                    <th className="p-3">Grade</th>
                                                    <th className="p-3">Examination</th>
                                                    <th className="p-3">Subject</th>
                                                    <th className="p-3">Score</th>
                                                    <th className="p-3">Percentage</th>
                                                    <th className="p-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {marksLedger.map((record) => {
                                                    const percentage = Math.round((record.marksObtained / record.maxMarks) * 100);
                                                    const gradeLetter = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 50 ? 'C' : 'F';

                                                    return (
                                                        <tr key={record.id} className="hover:bg-slate-800/20 transition-all">
                                                            <td className="p-3 font-medium text-slate-100">{record.studentName}</td>
                                                            <td className="p-3">
                                                                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded font-medium">
                                                                    {record.grade}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-slate-300 text-xs">{record.examName}</td>
                                                            <td className="p-3 font-medium text-slate-200">{record.subject}</td>
                                                            <td className="p-3 font-semibold text-emerald-400">
                                                                {record.marksObtained} <span className="text-xs text-slate-500 font-normal">/ {record.maxMarks}</span>
                                                            </td>
                                                            <td className="p-3">
                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${percentage >= 75
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                    : percentage >= 50
                                                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                    }`}>
                                                                    {percentage}% ({gradeLetter})
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <button
                                                                    onClick={() => setMarksLedger(marksLedger.filter(m => m.id !== record.id))}
                                                                    className="text-xs text-rose-400 hover:underline font-medium"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Add Marks Modal Popup */}
                                {isMarksModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Add Student Marks Entry</h3>
                                                <button
                                                    onClick={() => setIsMarksModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!mStudentName || !mObtained) return;

                                                    setMarksLedger([
                                                        ...marksLedger,
                                                        {
                                                            id: Date.now().toString(),
                                                            studentName: mStudentName,
                                                            grade: mGrade,
                                                            examName: mExamName,
                                                            subject: mSubject,
                                                            marksObtained: Number(mObtained) || 0,
                                                            maxMarks: Number(mMax) || 100,
                                                        },
                                                    ]);
                                                    setMStudentName('');
                                                    setMObtained('');
                                                    setIsMarksModalOpen(false);
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Student Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Rahul Kumar"
                                                        value={mStudentName}
                                                        onChange={(e) => setMStudentName(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Class / Grade</label>
                                                        <select
                                                            value={mGrade}
                                                            onChange={(e) => setMGrade(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                        >
                                                            <option value="9th B">9th B</option>
                                                            <option value="10th A">10th A</option>
                                                            <option value="11th Science">11th Science</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Examination</label>
                                                        <select
                                                            value={mExamName}
                                                            onChange={(e) => setMExamName(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                        >
                                                            <option value="Mid-Term Examination 2026">Mid-Term Examination 2026</option>
                                                            <option value="Unit Test 1">Unit Test 1</option>
                                                            <option value="Final Term Examination">Final Term Examination</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Subject Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Mathematics"
                                                        value={mSubject}
                                                        onChange={(e) => setMSubject(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Marks Obtained</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 85"
                                                            value={mObtained}
                                                            onChange={(e) => setMObtained(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Max Marks</label>
                                                        <input
                                                            type="number"
                                                            value={mMax}
                                                            onChange={(e) => setMMax(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsMarksModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Save Transcript Entry
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* FEE MANAGEMENT CONSOLE (Student-wise Paid vs Balance Tracker) */}
                        {activeTab === 'fee-management' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Fee Management Console</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Track student-wise payments, collected amounts, remaining balances, and send reminders.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsFeePaymentModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Record Payment</span>
                                    </button>
                                </div>

                                {/* Fee Ledger Table */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-100">Student Fee Payment Ledger</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-300">
                                            <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                                                <tr>
                                                    <th className="p-3">Student Name</th>
                                                    <th className="p-3">Grade</th>
                                                    <th className="p-3">Total Fee</th>
                                                    <th className="p-3">Paid Amount</th>
                                                    <th className="p-3">Balance Due</th>
                                                    <th className="p-3">Status</th>
                                                    <th className="p-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {feeRecords.map((record) => {
                                                    const balance = record.totalFee - record.paidAmount;
                                                    const status = balance <= 0 ? 'Paid' : record.paidAmount > 0 ? 'Partial' : 'Pending';

                                                    return (
                                                        <tr key={record.id} className="hover:bg-slate-800/20 transition-all">
                                                            <td className="p-3 font-medium text-slate-100">{record.studentName}</td>
                                                            <td className="p-3">
                                                                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded font-medium">
                                                                    {record.grade}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 font-semibold text-slate-200">₹{record.totalFee.toLocaleString()}</td>
                                                            <td className="p-3 font-semibold text-emerald-400">₹{record.paidAmount.toLocaleString()}</td>
                                                            <td className="p-3 font-semibold text-rose-400">₹{balance > 0 ? balance.toLocaleString() : '0'}</td>
                                                            <td className="p-3">
                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${status === 'Paid'
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                    : status === 'Partial'
                                                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                    }`}>
                                                                    {status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right space-x-2">
                                                                <button
                                                                    onClick={() => {
                                                                        // Quick update: mark full payment
                                                                        setFeeRecords(feeRecords.map(r => r.id === record.id ? { ...r, paidAmount: r.totalFee } : r));
                                                                    }}
                                                                    className="text-xs text-blue-400 hover:underline font-medium"
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                                <button
                                                                    onClick={() => setFeeRecords(feeRecords.filter(r => r.id !== record.id))}
                                                                    className="text-xs text-rose-400 hover:underline font-medium"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Record Payment Modal Popup */}
                                {isFeePaymentModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Record Fee Payment</h3>
                                                <button
                                                    onClick={() => setIsFeePaymentModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!recordStudentName || !recordPaidAmount) return;

                                                    setFeeRecords([
                                                        ...feeRecords,
                                                        {
                                                            id: Date.now().toString(),
                                                            studentName: recordStudentName,
                                                            grade: recordGrade,
                                                            totalFee: Number(recordTotalFee) || 33500,
                                                            paidAmount: Number(recordPaidAmount) || 0,
                                                            dueDate: recordDueDate || '2026-08-30',
                                                        },
                                                    ]);
                                                    setRecordStudentName('');
                                                    setRecordPaidAmount('');
                                                    setIsFeePaymentModalOpen(false);
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Student Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Rahul Kumar"
                                                        value={recordStudentName}
                                                        onChange={(e) => setRecordStudentName(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Class / Grade</label>
                                                    <select
                                                        value={recordGrade}
                                                        onChange={(e) => setRecordGrade(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="9th B">9th B</option>
                                                        <option value="10th A">10th A</option>
                                                        <option value="11th Science">11th Science</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Total Fee (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={recordTotalFee}
                                                            onChange={(e) => setRecordTotalFee(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Amount Paid (₹)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 15000"
                                                            value={recordPaidAmount}
                                                            onChange={(e) => setRecordPaidAmount(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                                                    <input
                                                        type="date"
                                                        value={recordDueDate}
                                                        onChange={(e) => setRecordDueDate(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsFeePaymentModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Save Payment Record
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* TRANSPORT FLEET LOGISTICS (Route & Student Allocation Tracker) */}
                        {activeTab === 'transport' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Transport Fleet Logistics & Routing</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Manage school bus routes, vehicle assignments, and student pickup point allocations.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsTransportModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Allocate Student Route</span>
                                    </button>
                                </div>

                                {/* Transport Allocation Table */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-100">Active Student Route Allocations</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-300">
                                            <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                                                <tr>
                                                    <th className="p-3">Student Name</th>
                                                    <th className="p-3">Grade</th>
                                                    <th className="p-3">Route Assigned</th>
                                                    <th className="p-3">Bus Vehicle</th>
                                                    <th className="p-3">Pickup Point</th>
                                                    <th className="p-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {transportAllocations.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-800/20 transition-all">
                                                        <td className="p-3 font-medium text-slate-100">{item.studentName}</td>
                                                        <td className="p-3">
                                                            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded font-medium">
                                                                {item.grade}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg">
                                                                {item.routeNumber}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-slate-300 text-xs font-mono">{item.busNumber}</td>
                                                        <td className="p-3 text-slate-300 text-xs">{item.pickupPoint}</td>
                                                        <td className="p-3 text-right">
                                                            <button
                                                                onClick={() => setTransportAllocations(transportAllocations.filter(t => t.id !== item.id))}
                                                                className="text-xs text-rose-400 hover:underline font-medium"
                                                            >
                                                                Unassign
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Allocate Student Route Modal Popup */}
                                {isTransportModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Allocate Student to Transport Route</h3>
                                                <button
                                                    onClick={() => setIsTransportModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!tStudentName || !tPickupPoint) return;

                                                    setTransportAllocations([
                                                        ...transportAllocations,
                                                        {
                                                            id: Date.now().toString(),
                                                            studentName: tStudentName,
                                                            grade: tGrade,
                                                            routeNumber: tRouteNumber,
                                                            busNumber: tBusNumber,
                                                            pickupPoint: tPickupPoint,
                                                        },
                                                    ]);
                                                    setTStudentName('');
                                                    setTPickupPoint('');
                                                    setIsTransportModalOpen(false);
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Student Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Rahul Kumar"
                                                        value={tStudentName}
                                                        onChange={(e) => setTStudentName(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Class / Grade</label>
                                                    <select
                                                        value={tGrade}
                                                        onChange={(e) => setTGrade(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="9th B">9th B</option>
                                                        <option value="10th A">10th A</option>
                                                        <option value="11th Science">11th Science</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Select Bus Route</label>
                                                    <select
                                                        value={tRouteNumber}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setTRouteNumber(val);
                                                            if (val.includes('101')) setTBusNumber('KA-01-F-9821');
                                                            else if (val.includes('102')) setTBusNumber('KA-01-F-4432');
                                                            else setTBusNumber('KA-01-F-1109');
                                                        }}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="Route 101">Route 101 (North Zone)</option>
                                                        <option value="Route 102">Route 102 (East Zone)</option>
                                                        <option value="Route 103">Route 103 (South Zone)</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Vehicle No.</label>
                                                        <input
                                                            type="text"
                                                            value={tBusNumber}
                                                            onChange={(e) => setTBusNumber(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-mono text-xs"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Pickup Stop</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Central Avenue"
                                                            value={tPickupPoint}
                                                            onChange={(e) => setTPickupPoint(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsTransportModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Confirm Route Allocation
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'notices' && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold">Notices & Broadcasts</h3>
                                <div className="space-y-3">
                                    {announcements.map((ann) => (
                                        <div key={ann.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                                            <h4 className="font-semibold text-slate-100">{ann.title}</h4>
                                            <p className="text-sm text-slate-300 mt-1">{ann.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* ACADEMIC EVENT CALENDAR (Interactive Event Scheduling & Filtering) */}
                        {activeTab === 'calendar' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Academic Event Calendar</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Manage school holidays, examination timetables, sports fixtures, and cultural events.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCalendarModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Add Calendar Event</span>
                                    </button>
                                </div>

                                {/* Event Cards Grid */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-100">Scheduled Academic Events</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {calendarEvents.map((evt) => (
                                            <div key={evt.id} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${evt.category === 'Holiday'
                                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                            : evt.category === 'Exam'
                                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                : evt.category === 'Sports'
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                            }`}>
                                                            {evt.category}
                                                        </span>
                                                        <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                                                            {evt.date}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-semibold text-slate-100 text-base">{evt.title}</h4>
                                                    <p className="text-xs text-slate-400 leading-relaxed">{evt.description}</p>
                                                </div>

                                                <div className="pt-3 border-t border-slate-800 flex justify-end">
                                                    <button
                                                        onClick={() => setCalendarEvents(calendarEvents.filter(e => e.id !== evt.id))}
                                                        className="text-xs text-rose-400 hover:underline font-medium"
                                                    >
                                                        Delete Event
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Event Modal Popup */}
                                {isCalendarModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Add Academic Event</h3>
                                                <button
                                                    onClick={() => setIsCalendarModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!evtTitle || !evtDate) return;

                                                    setCalendarEvents([
                                                        ...calendarEvents,
                                                        {
                                                            id: Date.now().toString(),
                                                            title: evtTitle,
                                                            category: evtCategory,
                                                            date: evtDate,
                                                            description: evtDesc || 'Scheduled school event.',
                                                        },
                                                    ]);
                                                    setEvtTitle('');
                                                    setEvtDesc('');
                                                    setIsCalendarModalOpen(false);
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Event Title</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Annual Sports Day"
                                                        value={evtTitle}
                                                        onChange={(e) => setEvtTitle(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                                                        <select
                                                            value={evtCategory}
                                                            onChange={(e) => setEvtCategory(e.target.value as any)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                        >
                                                            <option value="Holiday">Holiday</option>
                                                            <option value="Exam">Exam</option>
                                                            <option value="Sports">Sports</option>
                                                            <option value="Cultural">Cultural</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Event Date</label>
                                                        <input
                                                            type="date"
                                                            value={evtDate}
                                                            onChange={(e) => setEvtDate(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                                                    <textarea
                                                        placeholder="Enter event details or instructions..."
                                                        value={evtDesc}
                                                        onChange={(e) => setEvtDesc(e.target.value)}
                                                        rows={3}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                                                    />
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCalendarModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Save Event
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* PHOTO GALLERY MANAGER (Interactive Album Grids & Uploads) */}
                        {activeTab === 'photo-gallery' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Photo Gallery Manager</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Manage school event albums, media memories, and photo collections.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsPhotoModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Create Album</span>
                                    </button>
                                </div>

                                {/* Albums Grid */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-100">Event Albums & Galleries</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {photoAlbums.map((album) => (
                                            <div key={album.id} className="group bg-slate-800/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all">
                                                <div className="relative h-40 bg-slate-800 overflow-hidden">
                                                    <img
                                                        src={album.coverImage}
                                                        alt={album.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-3 left-3">
                                                        <span className="px-2.5 py-1 bg-slate-950/70 backdrop-blur-md border border-slate-700/50 text-slate-200 text-xs font-semibold rounded-lg">
                                                            {album.category}
                                                        </span>
                                                    </div>
                                                    <div className="absolute bottom-3 right-3">
                                                        <span className="px-2.5 py-1 bg-blue-600/90 text-white text-[10px] font-bold rounded-md">
                                                            {album.photoCount} Photos
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-3">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-100 text-sm group-hover:text-blue-400 transition-colors">{album.title}</h4>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">Added on {album.dateAdded}</p>
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
                                                        <span className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer">View Album →</span>
                                                        <button
                                                            onClick={() => setPhotoAlbums(photoAlbums.filter(a => a.id !== album.id))}
                                                            className="text-xs text-rose-400 hover:underline font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Create Album Modal Popup */}
                                {isPhotoModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Create Photo Album</h3>
                                                <button
                                                    onClick={() => setIsPhotoModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!albumTitle) return;

                                                    setPhotoAlbums([
                                                        ...photoAlbums,
                                                        {
                                                            id: Date.now().toString(),
                                                            title: albumTitle,
                                                            category: albumCategory,
                                                            photoCount: Number(albumCount) || 10,
                                                            coverImage: albumImage || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400',
                                                            dateAdded: new Date().toISOString().split('T')[0],
                                                        },
                                                    ]);
                                                    setAlbumTitle('');
                                                    setIsPhotoModalOpen(false);
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Album Title</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Annual Day 2026"
                                                        value={albumTitle}
                                                        onChange={(e) => setAlbumTitle(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                                                        <select
                                                            value={albumCategory}
                                                            onChange={(e) => setAlbumCategory(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                        >
                                                            <option value="Cultural">Cultural</option>
                                                            <option value="Academics">Academics</option>
                                                            <option value="Sports">Sports</option>
                                                            <option value="Infrastructure">Infrastructure</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Initial Photo Count</label>
                                                        <input
                                                            type="number"
                                                            value={albumCount}
                                                            onChange={(e) => setAlbumCount(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Cover Image URL</label>
                                                    <input
                                                        type="url"
                                                        value={albumImage}
                                                        onChange={(e) => setAlbumImage(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 text-xs font-mono"
                                                        required
                                                    />
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsPhotoModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Create Album
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ADMIN MANAGEMENT CONSOLE (Super & Sub-Admin Credentials & Access Control) */}
                        {activeTab === 'admin-management' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">Admin Management & Credentials</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Configure Super Admin and Sub-Admin permissions, security roles, and system access.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAdminModalOpen(true)}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                                    >
                                        <span>+ Add Admin User</span>
                                    </button>
                                </div>

                                {/* Admin Users Table */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-100">Authorized Administrators</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-300">
                                            <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                                                <tr>
                                                    <th className="p-3">Administrator Name</th>
                                                    <th className="p-3">Email Address</th>
                                                    <th className="p-3">Access Role</th>
                                                    <th className="p-3">Status</th>
                                                    <th className="p-3">Last Login</th>
                                                    <th className="p-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {adminUsers.map((admin) => (
                                                    <tr key={admin.id} className="hover:bg-slate-800/20 transition-all">
                                                        <td className="p-3 font-medium text-slate-100">{admin.name}</td>
                                                        <td className="p-3 text-slate-300 text-xs font-mono">{admin.email}</td>
                                                        <td className="p-3">
                                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${admin.role === 'Super Admin'
                                                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                                    : admin.role === 'Accounts Admin'
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                        : admin.role === 'Transport Admin'
                                                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                                }`}>
                                                                {admin.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${admin.status === 'Active'
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                }`}>
                                                                {admin.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-xs text-slate-400 font-mono">{admin.lastLogin}</td>
                                                        <td className="p-3 text-right space-x-3">
                                                            <button
                                                                onClick={() => {
                                                                    setAdminUsers(adminUsers.map(a => a.id === admin.id ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' } : a));
                                                                }}
                                                                className="text-xs text-blue-400 hover:underline font-medium"
                                                            >
                                                                Toggle Status
                                                            </button>
                                                            {admin.role !== 'Super Admin' && (
                                                                <button
                                                                    onClick={() => setAdminUsers(adminUsers.filter(a => a.id !== admin.id))}
                                                                    className="text-xs text-rose-400 hover:underline font-medium"
                                                                >
                                                                    Revoke
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Add Admin User Modal Popup */}
                                {isAdminModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                                <h3 className="text-lg font-bold text-slate-100">Add Administrator Account</h3>
                                                <button
                                                    onClick={() => setIsAdminModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!admName || !admEmail) return;

                                                    setAdminUsers([
                                                        ...adminUsers,
                                                        {
                                                            id: Date.now().toString(),
                                                            name: admName,
                                                            email: admEmail,
                                                            role: admRole,
                                                            status: admStatus,
                                                            lastLogin: 'Never',
                                                        },
                                                    ]);
                                                    setAdmName('');
                                                    setAdmEmail('');
                                                    setIsAdminModalOpen(false);
                                                }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Administrator Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Suresh Kumar"
                                                        value={admName}
                                                        onChange={(e) => setAdmName(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Email Address (Username)</label>
                                                    <input
                                                        type="email"
                                                        placeholder="e.g. suresh@school.edu"
                                                        value={admEmail}
                                                        onChange={(e) => setAdmEmail(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Access Role</label>
                                                        <select
                                                            value={admRole}
                                                            onChange={(e) => setAdmRole(e.target.value as any)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                        >
                                                            <option value="Super Admin">Super Admin</option>
                                                            <option value="Sub-Admin">Sub-Admin</option>
                                                            <option value="Accounts Admin">Accounts Admin</option>
                                                            <option value="Transport Admin">Transport Admin</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-400 mb-1">Account Status</label>
                                                        <select
                                                            value={admStatus}
                                                            onChange={(e) => setAdmStatus(e.target.value as any)}
                                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                        >
                                                            <option value="Active">Active</option>
                                                            <option value="Inactive">Inactive</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAdminModalOpen(false)}
                                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                                    >
                                                        Create Admin Account
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PORTAL SETTINGS (School Branding, Academic Year, Address & Social Media) */}
                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-slate-100">Portal Settings & Configuration</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Configure school branding, current academic year, physical address, and official social media handles.</p>
                                </div>

                                {isSettingsSaved && (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
                                        <span>✓ Portal settings successfully updated and saved!</span>
                                        <button onClick={() => setIsSettingsSaved(false)} className="text-emerald-300 hover:text-white font-bold">✕</button>
                                    </div>
                                )}

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        setIsSettingsSaved(true);
                                        setTimeout(() => setIsSettingsSaved(false), 4000);
                                    }}
                                    className="space-y-6"
                                >
                                    {/* General & Academic Year */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                        <h4 className="text-md font-semibold text-slate-200 border-b border-slate-800 pb-3">General & Academic Year</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">School Name</label>
                                                <input
                                                    type="text"
                                                    value={schoolName}
                                                    onChange={(e) => setSchoolName(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Current Academic Year</label>
                                                <select
                                                    value={academicYear}
                                                    onChange={(e) => setAcademicYear(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="2025-2026">2025-2026</option>
                                                    <option value="2026-2027">2026-2027</option>
                                                    <option value="2027-2028">2027-2028</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact & Address Details */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                        <h4 className="text-md font-semibold text-slate-200 border-b border-slate-800 pb-3">School Address & Contact Info</h4>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">School Full Address</label>
                                            <textarea
                                                value={schoolAddress}
                                                onChange={(e) => setSchoolAddress(e.target.value)}
                                                rows={2}
                                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Official Email Address</label>
                                                <input
                                                    type="email"
                                                    value={contactEmail}
                                                    onChange={(e) => setContactEmail(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={contactPhone}
                                                    onChange={(e) => setContactPhone(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Social Media Links */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                        <h4 className="text-md font-semibold text-slate-200 border-b border-slate-800 pb-3">Social Media Profiles</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Facebook Page URL</label>
                                                <input
                                                    type="url"
                                                    value={socialFacebook}
                                                    onChange={(e) => setSocialFacebook(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Instagram Handle URL</label>
                                                <input
                                                    type="url"
                                                    value={socialInstagram}
                                                    onChange={(e) => setSocialInstagram(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Twitter / X Profile URL</label>
                                                <input
                                                    type="url"
                                                    value={socialTwitter}
                                                    onChange={(e) => setSocialTwitter(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">YouTube Channel URL</label>
                                                <input
                                                    type="url"
                                                    value={socialYoutube}
                                                    onChange={(e) => setSocialYoutube(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                        >
                                            Save Portal Settings
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                    </div>
                )}
            </main>
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <DashboardContent />
        </Suspense>
    );
}