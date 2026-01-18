import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AttendanceTracking() {
  const students = useQuery(api.students.getAllStudents);
  const markAttendance = useMutation(api.attendance.markAttendance);
  
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleAttendanceChange = async (studentId: string, status: "present" | "absent" | "late") => {
    try {
      await markAttendance({ studentId, status });
      toast.success("Attendance marked successfully!");
    } catch (error) {
      toast.error("Failed to mark attendance: " + (error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "late": return "bg-yellow-100 text-yellow-800";
      case "absent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Attendance Tracking</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Mark Attendance for {new Date(selectedDate).toLocaleDateString()}
          </h3>
        </div>
        
        {students && students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mark Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.currentRiskLevel === "low" ? "bg-green-100 text-green-800" :
                        student.currentRiskLevel === "medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {student.currentRiskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAttendanceChange(student.studentId, "present")}
                          className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.studentId, "late")}
                          className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors"
                        >
                          Late
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.studentId, "absent")}
                          className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No students found. Add students first to track attendance.
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h4 className="text-lg font-semibold text-green-800 mb-2">Present Today</h4>
          <p className="text-3xl font-bold text-green-600">-</p>
          <p className="text-sm text-green-600">Mark attendance to see stats</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <h4 className="text-lg font-semibold text-yellow-800 mb-2">Late Today</h4>
          <p className="text-3xl font-bold text-yellow-600">-</p>
          <p className="text-sm text-yellow-600">Mark attendance to see stats</p>
        </div>
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <h4 className="text-lg font-semibold text-red-800 mb-2">Absent Today</h4>
          <p className="text-3xl font-bold text-red-600">-</p>
          <p className="text-sm text-red-600">Mark attendance to see stats</p>
        </div>
      </div>
    </div>
  );
}
