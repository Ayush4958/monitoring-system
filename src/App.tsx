import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { StudentManagement } from "./components/StudentManagement";
import { QuizManagement } from "./components/QuizManagement";
import { AssignmentManagement } from "./components/AssignmentManagement";
import { AttendanceTracking } from "./components/AttendanceTracking";
import { AlertsPanel } from "./components/AlertsPanel";
import { useState } from "react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-emerald-600">Student Monitoring System</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Authenticated>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-emerald-600 mb-2">Academic Performance Monitor</h1>
          <p className="text-lg text-gray-600">
            Welcome back, {loggedInUser?.email ?? "Administrator"}!
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {[
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "students", label: "Students", icon: "👥" },
            { id: "attendance", label: "Attendance", icon: "✅" },
            { id: "quizzes", label: "Quizzes", icon: "📝" },
            { id: "assignments", label: "Assignments", icon: "📋" },
            { id: "alerts", label: "Alerts", icon: "🚨" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-emerald-100 text-emerald-700 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-emerald-600 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "students" && <StudentManagement />}
          {activeTab === "attendance" && <AttendanceTracking />}
          {activeTab === "quizzes" && <QuizManagement />}
          {activeTab === "assignments" && <AssignmentManagement />}
          {activeTab === "alerts" && <AlertsPanel />}
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-emerald-600 mb-4">Student Monitoring System</h1>
            <p className="text-xl text-gray-600">Sign in to access the admin dashboard</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
