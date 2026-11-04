'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Teacher Profile & Workspace State
  const [teacherProfile] = useState({
    name: 'Mr. Ramesh Kumar',
    email: 'teacher@school.com',
    subject: 'Mathematics',
    gradeAssigned: '10th Grade (Section A & B)',
    phone: '+91 98765 43210',
    experience: '8 Years',
  });

  const [timetables] = useState([
    { day: 'Monday', period1: '10th A - Math', period2: '10th B - Math', period3: 'Free Period', period4: '9th A - Math' },
    { day: 'Tuesday', period1: '9th A - Math', period2: '10th A - Math', period3: '10th B - Math', period4: 'Staff Meeting' },
    { day: 'Wednesday', period1: '10th B - Math', period2: 'Free Period', period3: '10th A - Math', period4: '9th A - Math' },
    { day: 'Thursday', period1: '10th A - Math', period2: '9th A - Math', period3: '10th B - Math', period4: 'Remedial Class' },
    { day: 'Friday', period1: '9th A - Math', period2: '10th B - Math', period3: 'Free Period', period4: '10th A - Math' },
  ]);

  const [homeworkList, setHomeworkList] = useState([
    { id: '1', class: '10th A', subject: 'Mathematics', title: 'Quadratic Equations Exercise 4.2', dueDate: '2026-08-18', status: 'Active' },
    { id: '2', class: '10th B', subject: 'Mathematics', title: 'Polynomials Worksheet Q1-Q15', dueDate: '2026-08-20', status: 'Active' },
  ]);

  const [marksList, setMarksList] = useState([
    { id: '1', studentName: 'Aarav Sharma', class: '10th A', subject: 'Mathematics', midTermMarks: '45/50', grade: 'A+' },
    { id: '2', studentName: 'Ananya Patel', class: '10th A', subject: 'Mathematics', midTermMarks: '48/50', grade: 'A+' },
    { id: '3', studentName: 'Rohan Verma', class: '10th B', subject: 'Mathematics', midTermMarks: '38/50', grade: 'B+' },
  ]);

  const [newHwTitle, setNewHwTitle] = useState('');
  const [newHwClass, setNewHwClass] = useState('10th A');
  const [newHwDate, setNewHwDate] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 to-blue-300 bg-clip-text text-transparent">
              Teacher Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1">Rakvih School Demo</p>
          </div>

          <nav className="space-y-4 text-xs font-medium">
            {/* Overview Group */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Overview</p>
              <div className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                      activeTab === item.id ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Group */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Personal</p>
              <div className="space-y-1">
                {[
                  { id: 'my-profile', label: 'My Profile' },
                  { id: 'contact-school', label: 'Contact School' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                      activeTab === item.id ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Workspace Group */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Workspace</p>
              <div className="space-y-1">
                {[
                  { id: 'timetable', label: 'Timetable' },
                  { id: 'academic-calendar', label: 'Academic Calendar' },
                  { id: 'attendance', label: 'Attendance' },
                  { id: 'notices', label: 'Notices' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                      activeTab === item.id ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Classroom Group */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Classroom</p>
              <div className="space-y-1">
                {[
                  { id: 'homework', label: 'Homework' },
                  { id: 'student-profiles', label: 'Student Profiles' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                      activeTab === item.id ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Evaluation Group */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Evaluation</p>
              <div className="space-y-1">
                {[
                  { id: 'exam-syllabus', label: 'Exam Syllabus' },
                  { id: 'exam-timetable', label: 'Exam Timetable' },
                  { id: 'marks-entry', label: 'Marks Entry' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                      activeTab === item.id ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
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
            <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-100">{activeTab.replace('-', ' ')}</h1>
            <p className="text-xs text-slate-400">Faculty Workspace — {teacherProfile.name} ({teacherProfile.subject})</p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold">
            Teacher ID: TR-2026-042
          </span>
        </header>

        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                <p className="text-xs font-medium text-slate-400 uppercase">Classes Assigned</p>
                <p className="text-3xl font-bold mt-2 text-indigo-400">4 Sections</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                <p className="text-xs font-medium text-slate-400 uppercase">Active Homework</p>
                <p className="text-3xl font-bold mt-2 text-blue-400">{homeworkList.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                <p className="text-xs font-medium text-slate-400 uppercase">Pending Grades</p>
                <p className="text-3xl font-bold mt-2 text-amber-400">12 Students</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                <p className="text-xs font-medium text-slate-400 uppercase">Attendance Marked</p>
                <p className="text-3xl font-bold mt-2 text-emerald-400">100%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Today's Teaching Schedule</h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-3 bg-slate-800/50 rounded-xl flex justify-between items-center border border-slate-700/40">
                    <span>Period 1 (09:00 AM - 09:45 AM)</span>
                    <span className="text-indigo-400 font-semibold">10th A - Mathematics</span>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-xl flex justify-between items-center border border-slate-700/40">
                    <span>Period 2 (09:45 AM - 10:30 AM)</span>
                    <span className="text-indigo-400 font-semibold">10th B - Mathematics</span>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-xl flex justify-between items-center border border-slate-700/40">
                    <span>Period 4 (11:30 AM - 12:15 PM)</span>
                    <span className="text-indigo-400 font-semibold">9th A - Mathematics</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Quick Faculty Actions</h3>
                <div className="space-y-2">
                  <button onClick={() => setActiveTab('attendance')} className="w-full text-left px-4 py-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-all flex justify-between items-center">
                    <span>Mark Class Attendance</span>
                    <span>→</span>
                  </button>
                  <button onClick={() => setActiveTab('homework')} className="w-full text-left px-4 py-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-all flex justify-between items-center">
                    <span>Assign New Homework</span>
                    <span>→</span>
                  </button>
                  <button onClick={() => setActiveTab('marks-entry')} className="w-full text-left px-4 py-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-all flex justify-between items-center">
                    <span>Enter Exam Marks</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MY PROFILE */}
        {activeTab === 'my-profile' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Teacher Professional Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Full Name</span>
                <span className="font-semibold text-slate-100 mt-1 block">{teacherProfile.name}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Email Address</span>
                <span className="font-semibold text-slate-100 mt-1 block font-mono text-xs">{teacherProfile.email}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Department / Subject</span>
                <span className="font-semibold text-slate-100 mt-1 block">{teacherProfile.subject}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Assigned Grade</span>
                <span className="font-semibold text-slate-100 mt-1 block">{teacherProfile.gradeAssigned}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Phone Number</span>
                <span className="font-semibold text-slate-100 mt-1 block">{teacherProfile.phone}</span>
              </div>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Teaching Experience</span>
                <span className="font-semibold text-slate-100 mt-1 block">{teacherProfile.experience}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. CONTACT SCHOOL */}
        {activeTab === 'contact-school' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-slate-100">Contact School Administration</h3>
            <p className="text-xs text-slate-400">Reach out to the Principal or HR department regarding leave requests or timetable adjustments.</p>
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Subject / Inquiry Type</label>
                <input type="text" placeholder="e.g. Leave Application for Sep 1st" className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Message Details</label>
                <textarea rows={4} placeholder="Type your message to the administration..." className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"></textarea>
              </div>
              <button onClick={() => alert('Message sent to administration successfully!')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all">
                Send to Administration
              </button>
            </div>
          </div>
        )}

        {/* 4. TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Weekly Teaching Timetable</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Day</th>
                    <th className="p-3">Period 1 (09:00 AM)</th>
                    <th className="p-3">Period 2 (09:45 AM)</th>
                    <th className="p-3">Period 3 (10:45 AM)</th>
                    <th className="p-3">Period 4 (11:30 AM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {timetables.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-slate-100">{t.day}</td>
                      <td className="p-3 text-indigo-300 font-medium">{t.period1}</td>
                      <td className="p-3 text-indigo-300 font-medium">{t.period2}</td>
                      <td className="p-3 text-slate-400">{t.period3}</td>
                      <td className="p-3 text-indigo-300 font-medium">{t.period4}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. ACADEMIC CALENDAR */}
        {activeTab === 'academic-calendar' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Academic Year Calendar (2026-2027)</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                <span>Mid-Term Examination Week</span>
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

        {/* 6. ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Mark Section Attendance (10th Grade - Section A)</h3>
            <div className="space-y-3">
              {[
                { roll: '101', name: 'Aarav Sharma' },
                { roll: '102', name: 'Ananya Patel' },
                { roll: '103', name: 'Rohan Verma' },
                { roll: '104', name: 'Diya Reddy' },
              ].map((student, idx) => (
                <div key={idx} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">Roll #{student.roll} - {student.name}</span>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => alert(`${student.name} marked Present`)} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-semibold hover:bg-emerald-500 hover:text-white transition-all">Present</button>
                    <button onClick={() => alert(`${student.name} marked Absent`)} className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-semibold hover:bg-rose-500 hover:text-white transition-all">Absent</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. NOTICES */}
        {activeTab === 'notices' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Faculty Notices & Circulars</h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-indigo-400 font-semibold uppercase">Circular #402 • August 10, 2026</span>
                <h4 className="font-bold text-slate-200 text-sm">Submission of Mid-Term Question Papers</h4>
                <p className="text-slate-400">All subject teachers are requested to submit hard copies of their mid-term exam question papers to the examination cell by August 20.</p>
              </div>
              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-indigo-400 font-semibold uppercase">Circular #398 • August 02, 2026</span>
                <h4 className="font-bold text-slate-200 text-sm">Parent-Teacher Meeting (PTM) Schedule</h4>
                <p className="text-slate-400">PTM for 10th Grade will be held on Saturday following the conclusion of evaluation tests.</p>
              </div>
            </div>
          </div>
        )}

        {/* 8. HOMEWORK */}
        {activeTab === 'homework' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-100">Homework Management</h3>
            </div>

            <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-3">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase">Assign New Homework Task</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Task Title / Description" value={newHwTitle} onChange={(e) => setNewHwTitle(e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500" />
                <select value={newHwClass} onChange={(e) => setNewHwClass(e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
                  <option value="10th A">10th A</option>
                  <option value="10th B">10th B</option>
                  <option value="9th A">9th A</option>
                </select>
                <input type="date" value={newHwDate} onChange={(e) => setNewHwDate(e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500" />
              </div>
              <button onClick={() => {
                if (!newHwTitle) return;
                setHomeworkList([...homeworkList, { id: Date.now().toString(), class: newHwClass, subject: 'Mathematics', title: newHwTitle, dueDate: newHwDate || '2026-08-30', status: 'Active' }]);
                setNewHwTitle('');
              }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all">
                Publish Homework
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase">Active Homework Tasks</h4>
              {homeworkList.map((hw) => (
                <div key={hw.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-semibold">{hw.class}</span>
                    <h5 className="font-semibold text-slate-100 mt-1">{hw.title}</h5>
                    <span className="text-slate-400 text-[11px]">Due Date: {hw.dueDate}</span>
                  </div>
                  <button onClick={() => setHomeworkList(homeworkList.filter(h => h.id !== hw.id))} className="text-rose-400 hover:underline font-semibold">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. STUDENT PROFILES */}
        {activeTab === 'student-profiles' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Student Directory (Assigned Sections)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {[
                { name: 'Aarav Sharma', grade: '10th A', attendance: '96%', parent: 'Mr. Rajesh Sharma' },
                { name: 'Ananya Patel', grade: '10th A', attendance: '98%', parent: 'Mrs. Sunita Patel' },
                { name: 'Rohan Verma', grade: '10th B', attendance: '91%', parent: 'Mr. Anil Verma' },
              ].map((s, idx) => (
                <div key={idx} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-100 text-sm">{s.name}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-semibold">{s.grade}</span>
                  </div>
                  <p className="text-slate-400">Parent: {s.parent}</p>
                  <p className="text-emerald-400 font-semibold">Attendance: {s.attendance}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. EXAM SYLLABUS */}
        {activeTab === 'exam-syllabus' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Mid-Term Examination Syllabus</h3>
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="text-indigo-400 font-semibold">Mathematics — 10th Grade</span>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Chapter 1: Real Numbers</li>
                <li>Chapter 2: Polynomials</li>
                <li>Chapter 3: Pair of Linear Equations in Two Variables</li>
                <li>Chapter 4: Quadratic Equations</li>
                <li>Chapter 5: Arithmetic Progressions</li>
              </ul>
            </div>
          </div>
        )}

        {/* 11. EXAM TIMETABLE */}
        {activeTab === 'exam-timetable' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Exam Timetable (September 2026)</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between">
                <span className="font-semibold text-slate-200">Sept 01, 2026 (09:00 AM)</span>
                <span className="text-indigo-400">Mathematics</span>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between">
                <span className="font-semibold text-slate-200">Sept 03, 2026 (09:00 AM)</span>
                <span className="text-indigo-400">Science (Physics, Chemistry, Biology)</span>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between">
                <span className="font-semibold text-slate-200">Sept 05, 2026 (09:00 AM)</span>
                <span className="text-indigo-400">Social Science</span>
              </div>
            </div>
          </div>
        )}

        {/* 12. MARKS ENTRY */}
        {activeTab === 'marks-entry' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Student Marks Entry Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Mid-Term Marks</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {marksList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/20">
                      <td className="p-3 font-medium text-slate-100">{m.studentName}</td>
                      <td className="p-3 text-slate-300">{m.class}</td>
                      <td className="p-3 text-indigo-300">{m.subject}</td>
                      <td className="p-3 font-mono font-semibold text-slate-200">{m.midTermMarks}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold">{m.grade}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => alert(`Editing marks for ${m.studentName}`)} className="text-indigo-400 hover:underline font-medium">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}