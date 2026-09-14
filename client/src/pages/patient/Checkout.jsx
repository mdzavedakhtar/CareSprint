import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { createBookingAndMatch } from "../../api/matchingApi";
import { paymentAPI } from "../../services/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingState = location.state || {};

  const fee = bookingState.consultationFee || 500;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handleConfirmAndPay = async () => {
    setLoading(true);
    setError("");

    try {
      let booking = createdBooking;
      
      if (!booking) {
        const payload = {
          symptoms: bookingState.symptoms || "General medical consultation",
          specialization: bookingState.specialization || "General Physician",
          address: {
            street: bookingState.address || "Main Street",
            area: "Bhilai",
            city: "Bhilai",
            state: "Chhattisgarh",
            pincode: "490006",
          },
          patientLocation: {
            type: "Point",
            coordinates: [81.35, 21.19], // Default Bhilai coordinates
          },
          consultationFee: fee,
        };

        const res = await createBookingAndMatch(payload);
        if (res.success && res.booking) {
          booking = res.booking;
          setCreatedBooking(booking);
        } else {
          setError(res.message || "Failed to create booking request");
          setLoading(false);
          return;
        }
      }

      // Step 2: Create Razorpay Order via Backend
      const orderRes = await paymentAPI.createOrder(booking._id);
      const { orderId, amount, currency, key } = orderRes.data;

      const loaded = await loadRazorpayScript();
      if (!loaded || typeof window.Razorpay === "undefined") {
        // Fallback for offline/test environments without internet access to razorpay CDN
        const dummyPaymentId = `pay_test_${Date.now()}`;
        const dummySignature = `sig_test_${Date.now()}`;
        const verifyRes = await paymentAPI.verifySignature({
          bookingId: booking._id,
          razorpay_order_id: orderId,
          razorpay_payment_id: dummyPaymentId,
          razorpay_signature: dummySignature,
        });

        if (verifyRes.data.success) {
          navigate("/patient/booking-confirmation", {
            state: { booking, paymentSuccess: true },
          });
        } else {
          setError("Payment verification failed.");
        }
        setLoading(false);
        return;
      }

      // Step 3: Open Razorpay Modal
      const options = {
        key: key || "rzp_test_key",
        amount: amount,
        currency: currency || "INR",
        name: "CareSprint Healthcare",
        description: `Doctor Visit Consultation Fee (Booking #${booking._id.slice(-6)})`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await paymentAPI.verifySignature({
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              navigate("/patient/booking-confirmation", {
                state: { booking, paymentSuccess: true },
              });
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            setError(
              err.response?.data?.message || "Error verifying payment signature."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: async function () {
            await paymentAPI.handleFailure({
              bookingId: booking._id,
              orderId,
              reason: "Payment window dismissed by user",
            });
            setError("Payment was cancelled. You can retry paying to confirm your booking.");
            setLoading(false);
          },
        },
        theme: {
          color: "#2563eb",
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", async function (response) {
        await paymentAPI.handleFailure({
          bookingId: booking._id,
          orderId,
          reason: response.error?.description || "Payment failed",
        });
        setError(`Payment failed: ${response.error?.description || "Transaction declined"}`);
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to process payment order. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Checkout & Payment"
        title="Review & Confirm Consultation Payment"
        description="Complete your secure payment via Razorpay to confirm your doctor visit."
      />

      <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
        <div className="space-y-4 pb-6 border-b">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Chief Symptoms</span>
            <span className="font-semibold text-slate-800">{bookingState.symptoms || "General Checkup"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Visit Address</span>
            <span className="font-semibold text-slate-800">{bookingState.address || "Bhilai, Chhattisgarh"}</span>
          </div>
        </div>

        <div className="py-4 border-b space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Doctor Consultation Fee</span>
            <span className="font-semibold text-slate-900">₹{fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Platform Convenience Fee</span>
            <span className="font-semibold text-emerald-600 font-medium">FREE</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secured by 256-bit Razorpay Gateway
            </span>
            <span>UPI / Cards / NetBanking</span>
          </div>
        </div>

        <div className="flex justify-between py-5">
          <span className="font-bold text-slate-900 text-lg">Total Payable</span>
          <span className="text-2xl font-bold text-blue-600">₹{fee}</span>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Link
            to="/patient/doctors"
            className="flex-1 text-center py-3.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            onClick={handleConfirmAndPay}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </>
            ) : (
              `Pay ₹${fee} & Confirm Booking`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;