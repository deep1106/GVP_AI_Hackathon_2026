import React from 'react';
import { User, Student, AttendanceRecord, PerformanceRecord, LanguageCode } from '../types';
import { getTranslation } from '../constants';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';

interface DashboardProps {
  user: User;
  currentLang: LanguageCode;
}

const StatCard: React.FC<{ title: string; value: string | number; color: string; icon: React.ReactNode }> = ({ title, value, color, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user, currentLang }) => {
  const students = dataService.getStudents();
  const attendance = dataService.getAttendance();
  const performance = dataService.getPerformance();

  // Calculate stats
  const totalStudents = students.length;
  
  // Avg Attendance
  const totalLecs = attendance.reduce((sum, r) => sum + r.totalLectures, 0);
  const attendedLecs = attendance.reduce((sum, r) => sum + r.lecturesAttended, 0);
  const avgAttendance = totalLecs > 0 ? Math.round((attendedLecs / totalLecs) * 100) : 0;

  // Low Attendance Count (<75%)
  const lowAttendanceCount = attendance.filter(r => {
    const p = r.totalLectures > 0 ? (r.lecturesAttended / r.totalLectures) * 100 : 0;
    return p < 75;
  }).length;

  // Avg Performance
  const totalMarks = performance.reduce((sum, r) => sum + r.marksObtained, 0);
  const avgPerformance = performance.length > 0 ? Math.round(totalMarks / performance.length) : 0;

  // Student Specific View
  const myData = user.role === 'STUDENT' ? {
      student: students.find(s => s.id === user.studentId),
      att: attendance.find(a => a.studentId === user.studentId),
      perf: performance.find(p => p.studentId === user.studentId)
  } : null;

  if (user.role === 'STUDENT' && myData.student) {
     const myAttPct = myData.att ? Math.round((myData.att.lecturesAttended / myData.att.totalLectures) * 100) : 0;
     const myMarks = myData.perf ? myData.perf.marksObtained : 0;
     const attRisk = aiService.analyzeAttendanceRisk(myData.att?.lecturesAttended || 0, myData.att?.totalLectures || 0);

     return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
                <h2 className="text-3xl font-bold mb-2">{getTranslation('welcome', currentLang)}, {user.name}</h2>
                <p className="opacity-90">{myData.student.course} - Sem {myData.student.semester} | Roll: {myData.student.rollNumber}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard 
                    title={getTranslation('attendance', currentLang)}
                    value={`${myAttPct}%`}
                    color={myAttPct < 75 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard 
                    title={getTranslation('performance', currentLang)}
                    value={`${myMarks}/100`}
                    color="bg-blue-100 text-blue-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
            </div>

            {attRisk.isRisk && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <h4 className="font-bold text-red-700">Attendance Warning</h4>
                        <p className="text-red-600 text-sm">{attRisk.message}</p>
                    </div>
                </div>
            )}
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{getTranslation('dashboard', currentLang)}</h2>
         <span className="text-sm text-gray-500 dark:text-gray-400">Overview for {user.role}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={getTranslation('totalStudents', currentLang)} 
          value={totalStudents} 
          color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <StatCard 
          title="Avg. Attendance" 
          value={`${avgAttendance}%`} 
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard 
          title={getTranslation('lowAttendance', currentLang)} 
          value={lowAttendanceCount} 
          color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard 
          title={getTranslation('averageScore', currentLang)}
          value={avgPerformance} 
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
        />
      </div>

      {/* Quick Actions for Admin/Teacher */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">System Health</h3>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: '85%' }}></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
           <span>Server Status: Operational</span>
           <span>Database: Connected</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;