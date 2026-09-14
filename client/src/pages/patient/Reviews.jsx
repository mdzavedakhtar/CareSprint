import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { patientAPI } from "../../services/api";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    patientAPI
      .reviews()
      .then((res) => {
        if (!ignore && res.data.success) {
          setReviews(res.data.reviews || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Feedback"
        title="Consultation Reviews"
        description="View ratings and reviews submitted for your completed doctor visits."
      />

      {loading ? (
        <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <div className="h-8 w-8 mx-auto mb-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <Star size={38} className="mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-800 text-lg">No reviews submitted yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Reviews will become available for rating after completed doctor visits.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev._id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  <h3 className="font-semibold text-slate-900">
                    {rev.doctorId?.userId?.name || "Doctor"}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-1 font-bold text-amber-500 text-sm">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < rev.rating ? "fill-current text-amber-500" : "text-slate-200"}
                  />
                ))}
                <span className="ml-2 text-slate-700">{rev.rating}.0 / 5.0</span>
              </div>

              {rev.comment && (
                <p className="mt-3 text-sm text-slate-600 italic bg-slate-50 border border-slate-100 rounded-xl p-3">
                  "{rev.comment}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;