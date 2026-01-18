import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function QuizManagement() {
  const quizzes = useQuery(api.quizzes.getActiveQuizzes);
  const students = useQuery(api.students.getAllStudents);
  const createQuiz = useMutation(api.quizzes.createQuiz);
  const submitQuiz = useMutation(api.quizzes.submitQuiz);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: "",
    totalQuestions: 10,
  });
  const [submitFormData, setSubmitFormData] = useState({
    studentId: "",
    quizId: "",
    score: 0,
  });

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createQuiz(createFormData);
      toast.success("Quiz created successfully!");
      setCreateFormData({ title: "", totalQuestions: 10 });
      setShowCreateForm(false);
    } catch (error) {
      toast.error("Failed to create quiz: " + (error as Error).message);
    }
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const student = students?.find(s => s._id === submitFormData.studentId);
      if (!student) {
        toast.error("Student not found");
        return;
      }

      const result = await submitQuiz({
        studentId: student.studentId,
        quizId: submitFormData.quizId as any,
        score: submitFormData.score,
      });
      
      toast.success(`Quiz submitted! Accuracy: ${result.accuracy.toFixed(1)}%`);
      setSubmitFormData({ studentId: "", quizId: "", score: 0 });
      setShowSubmitForm(false);
    } catch (error) {
      toast.error("Failed to submit quiz: " + (error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quiz Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {showCreateForm ? "Cancel" : "Create Quiz"}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Quiz</h3>
          <form onSubmit={handleCreateQuiz} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  required
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter quiz title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Questions
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={createFormData.totalQuestions}
                  onChange={(e) => setCreateFormData({ ...createFormData, totalQuestions: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create Quiz
            </button>
          </form>
        </div>
      )}

      {showSubmitForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Submit Quiz Score</h3>
          <form onSubmit={handleSubmitQuiz} className="space-y-4">
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
                  Quiz
                </label>
                <select
                  required
                  value={submitFormData.quizId}
                  onChange={(e) => setSubmitFormData({ ...submitFormData, quizId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select a quiz</option>
                  {quizzes?.map((quiz) => (
                    <option key={quiz._id} value={quiz._id}>
                      {quiz.title} ({quiz.totalQuestions} questions)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score (Correct Answers)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={quizzes?.find(q => q._id === submitFormData.quizId)?.totalQuestions || 100}
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
          <h3 className="text-lg font-semibold text-gray-800">Active Quizzes</h3>
        </div>
        
        {quizzes && quizzes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quizzes.map((quiz) => (
                  <tr key={quiz._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quiz.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quiz.totalQuestions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No quizzes found. Create your first quiz to get started.
          </div>
        )}
      </div>
    </div>
  );
}
