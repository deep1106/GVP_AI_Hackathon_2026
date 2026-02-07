import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, User, LanguageCode } from '../types';
import { dataService } from '../services/dataService';
import { COURSES, SEMESTERS, getTranslation } from '../constants';
import Button from '../components/Button';
import { aiService } from '../services/aiService';

interface AttendanceProps {
  user: User;
  currentLang: LanguageCode;
}

const Attendance: React.FC<AttendanceProps> = ({ user, currentLang }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filterCourse, setFilterCourse] = useState('BCA');
  const [filterSem, setFilterSem] = useState('1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{total: number, attended: number}>({total:0, attended:0});

  useEffect(() => {
    loadData();
  }, [filterCourse, filterSem]);

  const loadData = () => {
    const allStudents = dataService.getStudents();
    const filtered = allStudents.filter(s => s.course === filterCourse && s.semester.toString() === filterSem);
    setStudents(filtered);
    setAttendance(dataService.getAttendance());
  };

  const handleEdit = (record: AttendanceRecord | undefined, studentId: string) => {
    if (record) {
      setEditValues({ total: record.totalLectures, attended: record.lecturesAttended });
    } else {
      setEditValues({ total: 50, attended: 0 }); // Default values
    }
    setEditingId(studentId);
  };

  const handleSave = (studentId: string) => {
    const record: AttendanceRecord = {
      id: `a-${studentId}`,
      studentId: studentId,
      totalLectures: editValues.total,
      lecturesAttended: editValues.attended,
      lastUpdated: new Date().toISOString()
    };
    dataService.updateAttendance(record);
    setAttendance(dataService.getAttendance());
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{getTranslation('attendance', currentLang)}</h2>
      </div>

       {/* Filters - Mandatory as per prompt */}
       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-end">
           <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{getTranslation('course', currentLang)}</label>
               <select 
                value={filterCourse} 
                onChange={e => setFilterCourse(e.target.value)}
                className="w-full min-w-[150px] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2"
               >
                   {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
           </div>
           <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{getTranslation('semester', currentLang)}</label>
               <select 
                value={filterSem} 
                onChange={e => setFilterSem(e.target.value)}
                className="w-full min-w-[150px] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2"
               >
                   {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(student => {
            const record = attendance.find(a => a.studentId === student.id);
            const attended = record ? record.lecturesAttended : 0;
            const total = record ? record.totalLectures : 0;
            const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);
            const risk = aiService.analyzeAttendanceRisk(attended, total);
            const isEditing = editingId === student.id;

            return (
              <div key={student.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col relative overflow-hidden">
                 {/* Risk Indicator Strip */}
                 <div className={`absolute top-0 left-0 w-1 h-full ${percentage < 75 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                 
                 <div className="pl-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{student.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Roll: {student.rollNumber}</p>
                 </div>

                 <div className="pl-3 flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500">Attended</label>
                          <input type="number" className="w-full border p-1 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" value={editValues.attended} onChange={e => setEditValues({...editValues, attended: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Total</label>
                          <input type="number" className="w-full border p-1 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" value={editValues.total} onChange={e => setEditValues({...editValues, total: Number(e.target.value)})} />
                        </div>
                        <div className="flex gap-2 mt-2">
                           <Button size="sm" onClick={() => handleSave(student.id)}>Save</Button>
                           <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-end justify-between mb-2">
                            <div>
                              <span className="text-3xl font-bold text-gray-800 dark:text-white">{percentage}%</span>
                              <span className="text-xs text-gray-500 ml-1">Attendance</span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                {attended} / {total} Lectures
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                            <div className={`h-2.5 rounded-full ${percentage < 75 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                        </div>

                        {risk.isRisk && (
                            <p className="text-xs text-red-600 font-medium mt-1">{risk.message}</p>
                        )}
                        
                        {user.role !== 'STUDENT' && (
                             <button 
                               onClick={() => handleEdit(record, student.id)}
                               className="mt-4 w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                             >
                               Update Attendance
                             </button>
                        )}
                      </>
                    )}
                 </div>
              </div>
            );
          })}
          
          {students.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-500">
               No students found for {filterCourse} - Semester {filterSem}
             </div>
          )}
       </div>
    </div>
  );
};

export default Attendance;