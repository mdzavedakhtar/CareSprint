import { useEffect, useState } from "react";
import { Bell, CheckCheck, Check, Clock } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { notificationAPI } from "../../services/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.notifications();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationAPI.markAsRead(id);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationAPI.markAllAsRead();
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Alerts & Real-Time Events"
        title="Notifications"
        description="Stay updated with your doctor visit requests, active consultations, and payments."
      />

      <div className="mt-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filter === "unread"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 transition"
          >
            <CheckCheck size={16} />
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <div className="h-8 w-8 mx-auto mb-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <Bell size={42} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-800 text-lg">No notifications found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {filter === "unread"
              ? "You have caught up with all your unread notifications."
              : "Notifications for booking events, payments, and prescriptions will appear here."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n._id}
              className={`border rounded-2xl p-5 transition shadow-sm flex items-start justify-between gap-4 ${
                !n.isRead
                  ? "bg-blue-50/40 border-blue-200"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 p-2.5 rounded-xl flex-shrink-0 ${
                    n.type === "PAYMENT_SUCCESS" || n.type === "BOOKING_ACCEPTED"
                      ? "bg-emerald-100 text-emerald-700"
                      : n.type === "PRESCRIPTION_READY"
                      ? "bg-blue-100 text-blue-700"
                      : n.type === "BOOKING_CANCELLED" || n.type === "BOOKING_REJECTED"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <Bell size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  title="Mark as read"
                  className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition flex-shrink-0"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
