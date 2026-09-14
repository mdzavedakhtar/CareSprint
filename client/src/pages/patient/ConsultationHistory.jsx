import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, User, FileText, Star } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { patientAPI } from "../../services/api";

const ConsultationHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [myReviews, setMyReviews] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [bookingsRes, reviewsRes] = await Promise.all([
        patientAPI.bookings(),
        patientAPI.reviews(),
      ]);

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings || []);
      }

      if (reviewsRes.data.success) {
        const reviewMap = {};
        (reviewsRes.data.reviews || []).forEach((rev) => {
          reviewMap[rev.bookingId] = rev;
        });
        setMyReviews(reviewMap);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReviewModal = (booking) => {
    setReviewBooking(booking);
    setRating(5);
    setComment("");
    setError("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await patientAPI.createReview({
        bookingId: reviewBooking._id,
        doctorId: reviewBooking.doctorId?._id,
        rating,
        comment,
      });

      if (res.data.success) {
        setMyReviews((prev) => ({
          ...prev,
          [reviewBooking._id]: res.data.review,
        }));
        setReviewBooking(null);
      } else {
        setError(res.data.message || "Failed to submit review");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error submitting review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Medical History"
        title="Consultation History"
        description="View all your previous at-home doctor visits and share your experience."
      />

      {loading ? (
        <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <div className="h-8 w-8 mx-auto mb-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          Loading your visit history...
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <Calendar size={42} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-800 text-lg">No consultation history yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Your completed at-home visits and consultation details will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {bookings.map((booking) => {
            const existingReview = myReviews[booking._id];
            return (
              <div
                key={booking._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : booking.status === "CANCELLED" || booking.status === "REJECTED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {booking.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900 flex items-center gap-2">
                      <User size={18} className="text-blue-600" />
                      {booking.doctorId?.userId?.name || "Assigned Doctor"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      Symptoms: {booking.symptoms}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {booking.address?.street || "Address provided"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Fee: ₹{booking.consultationFee}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 pt-3 md:pt-0 border-t md:border-t-0">
                    {booking.prescriptionId && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold">
                        <FileText size={14} />
                        Prescription Issued
                      </span>
                    )}

                    {booking.status === "COMPLETED" && (
                      existingReview ? (
                        <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-semibold">
                          <Star size={14} className="fill-amber-400 text-amber-500" />
                          <span>Rated {existingReview.rating}/5</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenReviewModal(booking)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Star size={14} className="fill-white" />
                          Rate Doctor & Review
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-7 max-w-lg w-full shadow-xl border border-slate-100">
            <h3 className="font-bold text-xl text-slate-900">
              Rate Doctor Consultation
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sharing feedback for {reviewBooking.doctorId?.userId?.name || "your doctor"}
            </p>

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Select Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 focus:outline-none transition transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-slate-800 text-sm">
                    {rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Comment / Review (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Share your experience regarding punctuality, diagnosis, and doctor care..."
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationHistory;