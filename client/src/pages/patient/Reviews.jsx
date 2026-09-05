import { Star } from "lucide-react";
import PageHeader from "../../components/PageHeader";

const Reviews = () => (
  <div className="max-w-5xl mx-auto">
    <PageHeader
      eyebrow="Feedback"
      title="Reviews"
      description="Rate and review your CareSprint consultations."
    />

    <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-8 text-center">
      <Star
        size={38}
        className="mx-auto text-slate-300"
      />

      <p className="mt-4 font-semibold">
        No reviews yet
      </p>

      <p className="mt-2 text-sm text-slate-500">
        Reviews will become available after completed visits.
      </p>
    </div>
  </div>
);

export default Reviews;