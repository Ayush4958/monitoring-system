import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Dashboard() {
  const stats = useQuery(api.performance.getDashboardStats);
  const alerts = useQuery(api.alerts.getUnreadAlerts);

  if (!stats) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Students"
          value={stats.totalStudents}
          icon="👥"
          color="bg-blue-50 text-blue-700"
        />
        <MetricCard
          title="Average Score"
          value={`${stats.averageScore.toFixed(1)}%`}
          icon="📊"
          color="bg-green-50 text-green-700"
        />
        <MetricCard
          title="High Risk Students"
          value={stats.riskCounts.high}
          icon="🚨"
          color="bg-red-50 text-red-700"
        />
        <MetricCard
          title="Unread Alerts"
          value={stats.unreadAlertsCount}
          icon="🔔"
          color="bg-orange-50 text-orange-700"
        />
      </div>

      {/* Risk Level Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Level Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          <RiskCard
            level="Low Risk"
            count={stats.riskCounts.low}
            percentage={stats.totalStudents > 0 ? (stats.riskCounts.low / stats.totalStudents) * 100 : 0}
            color="bg-green-100 text-green-800"
          />
          <RiskCard
            level="Medium Risk"
            count={stats.riskCounts.medium}
            percentage={stats.totalStudents > 0 ? (stats.riskCounts.medium / stats.totalStudents) * 100 : 0}
            color="bg-yellow-100 text-yellow-800"
          />
          <RiskCard
            level="High Risk"
            count={stats.riskCounts.high}
            percentage={stats.totalStudents > 0 ? (stats.riskCounts.high / stats.totalStudents) * 100 : 0}
            color="bg-red-100 text-red-800"
          />
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Alerts</h3>
        {alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert._id}
                className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <span className="text-red-600 text-lg">🚨</span>
                <div className="flex-1">
                  <p className="text-sm text-red-800">{alert.message}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent alerts</p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div className={`rounded-lg p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function RiskCard({ level, count, percentage, color }: {
  level: string;
  count: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <h4 className="font-semibold">{level}</h4>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm opacity-80">{percentage.toFixed(1)}%</p>
    </div>
  );
}
