import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AssignmentManagement() {
  const assignments = useQuery(api.assignments.getActiveAssignments);
  const students = useQuery(api.students.getAllStudents);
  const createAssignment = useMutation(api.assignments.createAssignment);
  const submitAssignment = useMutation(api.assignments.submitAssignment);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: "",
    dueDate: "",
    totalPoints: 100,
  });
  const [submitFormData, setSubmitFormData] = useState({
    studentId: "",
    assignmentId: "",
    score: 0,
  });

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAssignment({
        ...createFormData,
        dueDate: new Date(createFormData.dueDate).getTime(),
      });
      toast.success("Assignment created successfully!");
      setCreateFormData({ title: "", dueDate: "", totalPoints: 100 });
      setShowCreateForm(false);
    } catch (error) {
      toast.error("Failed to create assignment: " + (error as Error).message);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const student = students?.find(s => s._id === submitFormData.studentId);
      if (!student) {
        toast.error("Student not found");
        return;
      }

      const result = await submitAssignment({
        studentId: student.studentId,
        assignmentId: submitFormData.assignmentId as any,
        score: submitFormData.score,
      });
      
      toast.success(`Assignment submitted! ${result.isLate ? "(Late submission)" : ""}`);
      setSubmitFormData({ studentId: "", assignmentId: "", score: 0 });
      setShowSubmitForm(false);
    } catch (error) {
      toast.error("Failed to submit assignment: " + (error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Assignment Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {showCreateForm ? "Cancel" : "Create Assignment"}
          </button>
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showSubmitForm ? "Cancel" : "Submit Score"}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Assignment</h3>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter assignment title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  required
                  value={createFormData.dueDate}
                  onChange={(e) => setCreateFormData({ ...createFormData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Points
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={createFormData.totalPoints}
                  onChange={(e) => setCreateFormData({ ...createFormData, totalPoints: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create Assignment
            </button>
          </form>
        </div>
      )}

      {showSubmitForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Submit Assignment Score</h3>
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  required
                  value={submitFormData.studentId}
                  onChange={(e) => setSubmitFormData({ ...submitFormData, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select a student</option>
                  {students?.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.studentId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment
                </label>
                <select
                  required
                  value={submitFormData.assignmentId}
                  onChange={(e) => setSubmitFormData({ ...submitFormData, assignmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select an assignment</option>
                  {assignments?.map((assignment) => (
                    <option key={assignment._id} value={assignment._id}>
                      {assignment.title} ({assignment.totalPoints} points)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score (Points Earned)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={assignments?.find(a => a._id === submitFormData.assignmentId)?.totalPoints || 1000}
                  value={submitFormData.score}
                  onChange={(e) => setSubmitFormData({ ...submitFormData, score: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Score
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Active Assignments</h3>
        </div>
        
        {assignments && assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {assignment.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.totalPoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.dueDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        assignment.dueDate > Date.now() 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {assignment.dueDate > Date.now() ? "Active" : "Overdue"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No assignments found. Create your first assignment to get started.
          </div>
        )}
      </div>
    </div>
  );
}
