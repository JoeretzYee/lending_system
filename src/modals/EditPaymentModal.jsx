// EditPaymentModal.js
import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "../firebase";
import Swal from "sweetalert2";

const EditPaymentModal = ({ payment, onClose }) => {
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    if (payment) {
      setPaymentDate(
        new Date(payment.paymentDate.seconds * 1000).toISOString().split("T")[0]
      );
      setPaymentAmount(payment.amount);
    }
  }, [payment]);

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "paymentsHistory", payment.id), {
        paymentDate: new Date(paymentDate),
        amount: parseFloat(paymentAmount),
      });
      Swal.fire("Success", "Payment updated successfully!", "success");
      onClose();
    } catch (error) {
      console.error("Error updating payment:", error);
      Swal.fire("Error", "Failed to update payment.", "error");
    }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Payment</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleUpdatePayment}>
              <div className="mb-3">
                <label className="form-label">Payment Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Amount:</label>
                <input
                  type="number"
                  className="form-control"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPaymentModal;
