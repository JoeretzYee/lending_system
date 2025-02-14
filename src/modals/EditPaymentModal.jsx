// EditPaymentModal.js
import React, { useState, useEffect } from "react";
import {
  db,
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "../firebase";
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
      const newAmount = Number(paymentAmount); // Convert to number
      if (isNaN(newAmount) || newAmount <= 0) {
        throw new Error("Invalid payment amount");
      }

      const paymentRef = doc(db, "paymentsHistory", payment.id);

      // Update the payment record
      await updateDoc(paymentRef, {
        paymentDate: new Date(paymentDate),
        amount: newAmount,
      });

      // Fetch all payments for the borrower
      const paymentsRef = collection(db, "paymentsHistory");
      const paymentsQuery = query(
        paymentsRef,
        where("borrowerId", "==", payment.borrowerId)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);

      let totalPaid = 0;
      const updatedPayments = [];

      paymentsSnapshot.forEach((doc) => {
        const paymentData = doc.data();
        const paymentAmount = Number(paymentData.amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
          console.error(
            "Invalid payment amount in snapshot",
            paymentData.amount
          );
        }
        totalPaid += paymentAmount;
        updatedPayments.push({
          id: doc.id,
          amount: paymentAmount,
        });
      });

      // Get borrower details
      const borrowerRef = doc(db, "borrowers", payment.borrowerId);
      const borrowerSnap = await getDoc(borrowerRef);

      if (borrowerSnap.exists()) {
        const borrowerData = borrowerSnap.data();
        const principalAmount = Number(borrowerData.principalAmount); // Get principal amount
        const borrowerTotal = Number(borrowerData.total); // Get borrower total

        // Ensure that the borrower amounts are valid
        if (
          isNaN(principalAmount) ||
          principalAmount <= 0 ||
          isNaN(borrowerTotal) ||
          borrowerTotal <= 0
        ) {
          throw new Error("Invalid borrower data");
        }

        const remainingBalance = borrowerTotal - totalPaid;

        // Log for debugging
        console.log("principalAmount:", principalAmount);
        console.log("totalPaid:", totalPaid);
        console.log("remainingBalance:", remainingBalance);

        // Check if remainingBalance is valid
        if (isNaN(remainingBalance) || remainingBalance < 0) {
          throw new Error("Invalid remaining balance");
        }

        // Update borrower's remaining balance
        await updateDoc(borrowerRef, { remainingBalance });

        // Update remaining balance in each payment record
        const updatePromises = updatedPayments.map(({ id }) =>
          updateDoc(doc(db, "paymentsHistory", id), { remainingBalance })
        );
        await Promise.all(updatePromises);
      }

      Swal.fire("Success", "Payment updated successfully!", "success").then(
        () => {
          // After the user clicks the confirm (OK) button
          onClose();
          window.location.reload();
        }
      );
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
