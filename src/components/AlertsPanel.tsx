import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AlertsPanel() {
  const alerts = useQuery(api.alerts.getAllAlerts, { limit: 50 });
  const unreadAlerts = useQuery(api.alerts.getUnreadAlerts);
  const markAsRead = useMutation(api.alerts.markAlertAsRead);
  const markAllAsRead = useMutation(api.alerts.markAllAlertsAsRead);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead({ alertId: alertId as any });
      toast.success("Alert marked as read");
    } catch (error) {
      toast.error("Failed to mark alert as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All alerts marked as read");
    } catch (error) {
      toast.error("Failed to mark all alerts as read");
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "high_risk": return "🚨";
      case "performance_drop": return "📉";
      case "attendance_low": return "⚠️";
      default: return "🔔";
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "high_risk": return "bg-red-50 border-red-200 text-red-800";
      case "performance_drop": return "bg-orange-50 border-orange-200 text-orange-800";
      case "attendance_low": return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default: return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Alert Management</h2>
        {unreadAlerts && unreadAlerts.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Mark All as Read ({unreadAlerts.length})
          </button>
        )}
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <h4 className="text-lg font-semibold text-red-800 mb-2">High Risk Alerts</h4>
          <p className="text-3xl font-bold text-red-600">
            {alerts?.filter(a => a.type === "high_risk").length || 0}
          </p>
          <p className="text-sm text-red-600">Students requiring immediate attention</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <h4 className="text-lg font-semibold text-orange-800 mb-2">Performance Drops</h4>
          <p className="text-3xl font-bold text-orange-600">
            {alerts?.filter(a => a.type === "performance_drop").length || 0}
          </p>
          <p className="text-sm text-orange-600">Students with declining performance</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <h4 className="text-lg font-semibold text-yellow-800 mb-2">Attendance Issues</h4>
          <p className="text-3xl font-bold text-yellow-600">
            {alerts?.filter(a => a.type === "attendance_low").length || 0}
          </p>
          <p className="text-sm text-yellow-600">Students with poor attendance</p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">All Alerts</h3>
        </div>
        
        {alerts && alerts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={`p-6 ${alert.isRead ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getAlertColor(alert.type)}`}>
                    <span className="text-xl">{getAlertIcon(alert.type)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {alert.type.replace("_", " ").toUpperCase()} Alert
                          {!alert.isRead && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              New
                            </span>
                          )}
                        </h4>
                        <p className="text-gray-700 mb-2">{alert.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!alert.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(alert._id)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <span className="text-4xl mb-4 block">🎉</span>
            <p className="text-lg font-medium">No alerts found!</p>
            <p className="text-sm">All students are performing well.</p>
          </div>
        )}
      </div>
    </div>
  );
}
