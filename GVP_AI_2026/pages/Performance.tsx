import React, { useState, useEffect } from 'react';
import { Student, PerformanceRecord, User, LanguageCode } from '../types';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';
import { COURSES, SEMESTERS, getTranslation } from '../constants';
import Button from '../components/Button';

interface PerformanceProps {
  user: User;
  currentLang: LanguageCode;
}

const Performance: React.FC<PerformanceProps> = ({ user, currentLang }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [filterCourse, setFilterCourse] = useState('BCA');
  const [filterSem, setFilterSem] = useState('1');
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{marks: number, subject: string}>({marks: 0, subject: 'Core Computing'});

  useEffect(() => {
    loadData();
  }, [filterCourse, filterSem]);

  const loadData = () => {
    const allStudents = dataService.getStudents();
    const filtered = allStudents.filter(s => s.course === filterCourse && s.semester.toString() === filterSem);
    setStudents(filtered);
    setPerformance(dataService.getPerformance());
  };

  const handleEdit = (record: PerformanceRecord | undefined, studentId: string) => {
     if (record) {
         setEditValues({ marks: record.marksObtained, subject: record.subject });
     } else {
         setEditValues({ marks: 0, subject: 'Core Computing' });
     }
     setEditingId(studentId);
  };

  const handleSave = async (student: Student) => {
    setLoadingAi(student.id);
    
    // AI Call
    const remark = await aiService.generatePerformanceRemark(student.name, editValues.marks, editValues.subject);

    const record: PerformanceRecord = {
        id: `p-${student.id}`,
        studentId: student.id,
        subject: editValues.subject,
        marksObtained: editValues.marks,
        totalMarks: 100,
        remark: remark,
        isAiGenerated: true
    };

    dataService.updatePerformance(record);
    setPerformance(dataService.getPerformance());
    setLoadingAi(null);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{getTranslation('performance', currentLang)} & {getTranslation('aiInsight', currentLang)}</h2>
      </div>

       {/* Filters */}
       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-end">
           <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{getTranslation('course', currentLang)}</label>
               <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="w-full min-w-[150px] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2">
                   {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
           </div>
           <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{getTranslation('semester', currentLang)}</label>
               <select value={filterSem} onChange={e => setFilterSem(e.target.value)} className="w-full min-w-[150px] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2">
                   {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
           </div>
       </div>

       <div className="grid grid-cols-1 gap-4">
          {students.map(student => {
             const record = performance.find(p => p.studentId === student.id);
             const isEditing = editingId === student.id;
             const isLoading = loadingAi === student.id;

             return (
                 <div key={student.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{student.name}</h3>
                        <p className="text-sm text-gray-500">{student.rollNumber}</p>
                    </div>

                    <div className="flex-1 w-full">
                       {isEditing ? (
                          <div className="flex gap-4 items-end">
                             <div className="flex-1">
                                <label className="text-xs text-gray-500">Marks (out of 100)</label>
                                <input type="number" max="100" className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" value={editValues.marks} onChange={e => setEditValues({...editValues, marks: Number(e.target.value)})} />
                             </div>
                             <Button onClick={() => handleSave(student)} isLoading={isLoading} disabled={isLoading}>
                               {isLoading ? 'Generating AI Remark...' : 'Save & Analyze'}
                             </Button>
                             <Button variant="ghost" onClick={() => setEditingId(null)} disabled={isLoading}>Cancel</Button>
                          </div>
                       ) : (
                          <div className="flex items-center gap-6">
                             <div className="text-center min-w-[80px]">
                                <div className={`text-3xl font-bold ${!record ? 'text-gray-400' : record.marksObtained >= 75 ? 'text-green-600' : record.marksObtained >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                   {record ? record.marksObtained : '-'}
                                </div>
                                <div className="text-xs text-gray-500">Marks</div>
                             </div>
                             <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Insight</span>
                                    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                   "{record ? record.remark : 'No data available. Add marks to generate analysis.'}"
                                </p>
                             </div>
                          </div>
                       )}
                    </div>

                    {user.role !== 'STUDENT' && !isEditing && (
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(record, student.id)}>
                           Edit Marks
                        </Button>
                    )}
                 </div>
             );
          })}
       </div>
    </div>
  );
};

export default Performance;