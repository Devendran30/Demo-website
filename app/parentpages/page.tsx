'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Student Profile & Data State
  const [studentProfile] = useState({
    name: 'Aarav Sharma',
    admissionNo: 'PRAS-2026-1042',
    grade: '10th Grade',
    section: 'Section A',
    rollNo: '101',
    parentName: 'Mr. Rajesh Sharma',
    email: 'aarav.sharma@school.com',
    phone: '+91 98765 12345',
    address: '#12, Green Valley Layout, Bengaluru - 560100',
  });

  const [homeworkList] = useState([
    { id: '1', subject: 'Mathematics', title: 'Quadratic Equations Exercise 4.2', dueDate: '2026-08-18', status: 'Pending' },
    { id: '2', subject: 'Physics', title: 'Light Reflection Numericals Q1-Q10', dueDate: '2026-08-19', status: 'Submitted' },
    { id: '3', subject: 'English', title: 'Letter to Editor Practice Assignment', dueDate: '2026-08-21', status: 'Pending' },
  ]);

  const [attendanceRecords] = useState([
    { date: '2026-08-12', status: 'Present', remarks: 'On Time' },
    { date: '2026-08-11', status: 'Present', remarks: 'On Time' },
    { date: '2026-08-10', status: 'Present', remarks: 'On Time' },
    { date: '2026-08-07', status: 'Present', remarks: 'On Time' },
  ]);

  const [timetable] = useState([
    { day: 'Monday', p1: 'Mathematics', p2: 'Physics', p3: 'English', p4: 'Chemistry', p5: 'Computer Science' },
    { day: 'Tuesday', p1: 'Biology', p2: 'Mathematics', p3: 'Social Science', p4: 'Hindi', p5: 'Physical Education' },
    { day: 'Wednesday', p1: 'English', p2: 'Chemistry', p3: 'Physics', p4: 'Mathematics', p5: 'Library' },
    { day: 'Thursday', p1: 'Mathematics', p2: 'Social Science', p3: 'Biology', p4: 'English', p5: 'Art & Craft' },
    { day: 'Friday', p1: 'Physics', p2: 'Mathematics', p3: 'Hindi', p4: 'Computer Science', p5: 'Sports' },
  ]);

  const [examTimetable] = useState([
    { date: '01 Sept 2026', subject: 'Mathematics', time: '09:00 AM - 12:00 PM' },
    { date: '03 Sept 2026', subject: 'Science (Physics, Chem, Bio)', time: '09:00 AM - 12:00 PM' },
    { date: '05 Sept 2026', subject: 'Social Science', time: '09:00 AM - 12:00 PM' },
    { date: '07 Sept 2026', subject: 'English Language & Lit', time: '09:00 AM - 12:00 PM' },
    { date: '08 Sept 2026', subject: 'Second Language (Hindi/Kannada)', time: '09:00 AM - 12:00 PM' },
  ]);

  const [feeDetails] = useState({
    totalFee: 35000,
    paidAmount: 25000,
    dueAmount: 10000,
    dueDate: '30 Sept 2026',
    status: 'Partially Paid',
  });

  const [notices] = useState([
    { id: '1', title: 'Mid-Term Examination Schedule Released', date: 'August 10, 2026', desc: 'Examinations commence from September 1st, 2026. Hall tickets will be issued by class teachers.' },
    { id: '2', title: 'Independence Day Celebrations', date: 'August 13, 2026', desc: 'All students must report to school by 08:00 AM in formal white uniform on August 15.' },
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Student Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1">Rakvih School Demo</p>
          </div>

          <nav className="space-y-1.5 text-xs font-medium">
            {[
              'Dashboard',
              'Student Profile',
              'Homework',
              'Attendance',
              'School Gallery',
              'Class Time Table',
              'Exam Time Table',
              'Exam Syllabus',
              'Report Card',
              'Annual Calendar',
              'Fee Details',
              'Transport',
              'Notice',
              'Contact School',
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 font-semibold rounded-xl text-xs transition-all text-center"
          >
            Logout Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-100">{activeTab}</h1>
            <p className="text-xs text-slate-400">Welcome, {studentProfile.name} ({studentProfile.grade} - {studentProfile.section})</p>
          </div>
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold">
            Roll No: {studentProfile.rollNo}
          </span>
        </header>

        {/* 1. DASHBOARD */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                <p className="text-xs font-medium text-slate-400 uppercase">Attendance Rate</p>
                <p className="text-3xl font-bold mt-2 text-emerald-400">96.5%</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                <p className="text-xs font-medium text-slate-400 uppercase">Pending Homework</p>
                <p className="text-3xl font-bold mt-2 text-amber-400">
                  {homeworkList.filter(h => h.status === 'Pending').length} Tasks
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                <p className="text-xs font-medium text-slate-400 uppercase">Fee Due</p>
                <p className="text-3xl font-bold mt-2 text-blue-400">₹{feeDetails.dueAmount}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                <p className="text-xs font-medium text-slate-400 uppercase">Active Notices</p>
                <p className="text-3xl font-bold mt-2 text-indigo-400">{notices.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Quick Homework Overview</h3>
                <div className="space-y-2 text-xs">
                  {homeworkList.map((hw) => (
                    <div key={hw.id} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-blue-400 font-semibold">{hw.subject}</span>
                        <p className="text-slate-200 mt-0.5">{hw.title}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${hw.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {hw.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Upcoming Exam Schedule</h3>
                <div className="space-y-2 text-xs">
                  {examTimetable.slice(0, 3).map((exam, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-slate-300 font-semibold">{exam.subject}</span>
                        <p className="text-slate-400 text-[11px]">{exam.time}</p>
                      </div>
                      <span className="text-indigo-400 font-mono text-[11px]">{exam.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. STUDENT PROFILE */}
        {activeTab === 'Student Profile' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Student Personal Record</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Full Name</span>
                <span className="font-semibold text-slate-100 mt-1 block">{studentProfile.name}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Admission Number</span>
                <span className="font-semibold text-slate-100 mt-1 block font-mono text-xs">{studentProfile.admissionNo}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Grade & Section</span>
                <span className="font-semibold text-slate-100 mt-1 block">{studentProfile.grade} — {studentProfile.section}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Roll Number</span>
                <span className="font-semibold text-slate-100 mt-1 block">{studentProfile.rollNo}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Parent / Guardian Name</span>
                <span className="font-semibold text-slate-100 mt-1 block">{studentProfile.parentName}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Contact Phone</span>
                <span className="font-semibold text-slate-100 mt-1 block">{studentProfile.phone}</span>
              </div>
              <div className="col-span-2 p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Residential Address</span>
                <span className="font-semibold text-slate-100 mt-1 block">{studentProfile.address}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. HOMEWORK */}
        {activeTab === 'Homework' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Assigned Homework Tasks</h3>
            <div className="space-y-3">
              {homeworkList.map((hw) => (
                <div key={hw.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-semibold">{hw.subject}</span>
                    <h4 className="font-bold text-slate-100 text-sm mt-1">{hw.title}</h4>
                    <p className="text-slate-400">Due Date: {hw.dueDate}</p>
                  </div>
                  <button onClick={() => alert(`Marking ${hw.title} as submitted!`)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all">
                    {hw.status === 'Submitted' ? 'Completed' : 'Mark as Submitted'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ATTENDANCE */}
        {activeTab === 'Attendance' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Student Attendance Log</h3>
            <div className="space-y-2 text-xs">
              {attendanceRecords.map((att, i) => (
                <div key={i} className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="font-semibold text-slate-200">{att.date}</span>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-semibold">
                    {att.status} ({att.remarks})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SCHOOL GALLERY */}
        {activeTab === 'School Gallery' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">School Campus & Event Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['Annual Sports Meet 2026', 'Science Exhibition', 'Independence Day Practice', 'Cultural Fest', 'Library & Computer Lab', 'School Playground'].map((title, i) => (
                <div key={i} className="h-36 bg-slate-800/60 rounded-xl border border-slate-700 flex flex-col justify-end p-4 text-xs font-semibold text-slate-200">
                  <span className="text-[10px] text-blue-400 uppercase font-mono">Photo Gallery</span>
                  <span>{title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. CLASS TIME TABLE */}
        {activeTab === 'Class Time Table' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Weekly Class Timetable (10th A)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Day</th>
                    <th className="p-3">Period 1</th>
                    <th className="p-3">Period 2</th>
                    <th className="p-3">Period 3</th>
                    <th className="p-3">Period 4</th>
                    <th className="p-3">Period 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {timetable.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-slate-100">{t.day}</td>
                      <td className="p-3 text-blue-300">{t.p1}</td>
                      <td className="p-3 text-blue-300">{t.p2}</td>
                      <td className="p-3 text-slate-400">{t.p3}</td>
                      <td className="p-3 text-blue-300">{t.p4}</td>
                      <td className="p-3 text-slate-400">{t.p5}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. EXAM TIME TABLE */}
        {activeTab === 'Exam Time Table' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Mid-Term Examination Timetable</h3>
            <div className="space-y-2 text-xs">
              {examTimetable.map((e, idx) => (
                <div key={idx} className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-200 text-sm">{e.subject}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{e.time}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg font-mono font-semibold">{e.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. EXAM SYLLABUS */}
        {activeTab === 'Exam Syllabus' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Mid-Term Exam Syllabus</h3>
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="text-blue-400 font-semibold text-sm">Mathematics</span>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Real Numbers (Chapters 1)</li>
                <li>Polynomials & Linear Equations (Chapters 2 & 3)</li>
                <li>Quadratic Equations (Chapter 4)</li>
                <li>Arithmetic Progressions (Chapter 5)</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="text-blue-400 font-semibold text-sm">Science</span>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Light: Reflection and Refraction</li>
                <li>Chemical Reactions and Equations</li>
                <li>Life Processes (Biology)</li>
              </ul>
            </div>
          </div>
        )}

        {/* 9. REPORT CARD */}
        {activeTab === 'Report Card' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Term Examination Report Card</h3>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-300 pb-2 border-b border-slate-700">
                <span>Subject</span>
                <span>Max Marks</span>
                <span>Marks Obtained</span>
                <span>Grade</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Mathematics</span>
                <span>50</span>
                <span className="font-mono font-bold text-blue-400">45</span>
                <span className="text-emerald-400 font-semibold">A+</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Science</span>
                <span>50</span>
                <span className="font-mono font-bold text-blue-400">42</span>
                <span className="text-emerald-400 font-semibold">A</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Social Science</span>
                <span>50</span>
                <span className="font-mono font-bold text-blue-400">40</span>
                <span className="text-emerald-400 font-semibold">A</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>English</span>
                <span>50</span>
                <span className="font-mono font-bold text-blue-400">46</span>
                <span className="text-emerald-400 font-semibold">A+</span>
              </div>
            </div>
          </div>
        )}

        {/* 10. ANNUAL CALENDAR */}
        {activeTab === 'Annual Calendar' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Academic Year Calendar (2026-2027)</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                <span>Mid-Term Examinations</span>
                <span className="text-amber-400 font-semibold">Sept 01 - Sept 08, 2026</span>
              </div>
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                <span>Dussehra Vacation</span>
                <span className="text-emerald-400 font-semibold">Oct 12 - Oct 20, 2026</span>
              </div>
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                <span>Annual Sports Meet</span>
                <span className="text-blue-400 font-semibold">Nov 14, 2026</span>
              </div>
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                <span>Final Examinations</span>
                <span className="text-purple-400 font-semibold">March 10 - March 25, 2027</span>
              </div>
            </div>
          </div>
        )}

        {/* 11. FEE DETAILS */}
        {activeTab === 'Fee Details' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-slate-100">Tuition & Fee Ledger</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Total Annual Fee</span>
                <span className="text-lg font-bold text-slate-100 mt-1 block">₹{feeDetails.totalFee}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Amount Paid</span>
                <span className="text-lg font-bold text-emerald-400 mt-1 block">₹{feeDetails.paidAmount}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Balance Due</span>
                <span className="text-lg font-bold text-amber-400 mt-1 block">₹{feeDetails.dueAmount}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Due Date</span>
                <span className="text-sm font-bold text-slate-100 mt-1 block">{feeDetails.dueDate}</span>
              </div>
            </div>
            <button onClick={() => alert('Redirecting to secure online fee payment gateway...')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all">
              Pay Balance Fee Online
            </button>
          </div>
        )}

        {/* 12. TRANSPORT */}
        {activeTab === 'Transport' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-slate-100">School Bus Transport Details</h3>
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Bus Route Number:</span>
                <span className="font-bold text-blue-400">Route #102 (North Zone)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bus Number Plate:</span>
                <span className="font-mono font-semibold text-slate-200">KA 01 F 4589</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Driver:</span>
                <span className="font-semibold text-slate-200">Mr. Munirathnam (+91 94480 12345)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pickup Stop:</span>
                <span className="font-semibold text-slate-200">Green Valley Circle (07:45 AM)</span>
              </div>
            </div>
          </div>
        )}

        {/* 13. NOTICE */}
        {activeTab === 'Notice' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">School Notices & Circulars</h3>
            <div className="space-y-3 text-xs">
              {notices.map((n) => (
                <div key={n.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-blue-400 font-semibold uppercase">{n.date}</span>
                  <h4 className="font-bold text-slate-200 text-sm">{n.title}</h4>
                  <p className="text-slate-400">{n.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 14. CONTACT SCHOOL */}
        {activeTab === 'Contact School' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-slate-100">Contact School Administration</h3>
            <p className="text-xs text-slate-400">Send an inquiry or leave application directly to the school office.</p>
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <input type="text" placeholder="e.g. Leave application for Aarav Sharma" className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Message</label>
                <textarea rows={4} placeholder="Type your message..." className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 resize-none"></textarea>
              </div>
              <button onClick={() => alert('Message sent to school administration successfully!')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all">
                Send Message
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}