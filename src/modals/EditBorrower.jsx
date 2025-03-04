import React, { useState, useEffect } from "react";
import {
  db,
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "../firebase";
import Swal from "sweetalert2";
import { formatNumberWithCommas } from "../utils/formatNumberWithCommas";

function EditBorrower({ borrower, isOpen, onClose }) {
  const [name, setName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [term, setTerm] = useState("");
  const [total, setTotal] = useState("");
  const [remainingBalance, setRemainingBalance] = useState("");
  const [dateBorrowed, setDateBorrowed] = useState("");
  const [amountPaid, setAmountPaid] = useState(0); // Track total amount paid

  const interestRate = 0.07; // 7% interest rate

  // Fetch payment history and calculate total amount paid
  useEffect(() => {
    const fetchPayments = async () => {
      if (isOpen && borrower) {
        const paymentsQuery = query(
          collection(db, "paymentsHistory"),
          where("borrowerId", "==", borrower.id)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        let totalPaid = 0;
        paymentsSnapshot.forEach((doc) => {
          totalPaid += doc.data().amount;
        });
        setAmountPaid(totalPaid); // Set total amount paid
      }
    };

    fetchPayments();
  }, [isOpen, borrower]);

  // Set the form fields with the borrower data when the modal opens
  useEffect(() => {
    if (isOpen && borrower) {
      setName(borrower.name);
      setPrincipalAmount(borrower.principalAmount.toString()); // Ensure string for input
      setTerm(borrower.term.toString()); // Ensure string for input
      setDateBorrowed(
        borrower.dateBorrowed.toDate().toISOString().split("T")[0]
      ); // Format date for input
      setTotal(borrower.total);
      setRemainingBalance(borrower.remainingBalance);
    }
  }, [isOpen, borrower]);

  // Function to calculate the total amount based on the principal, term, and interest rate
  const calculateTotal = (principal, term) => {
    const principalNum = parseFloat(principal);
    const termNum = parseInt(term, 10);
    if (isNaN(principalNum) || isNaN(termNum)) {
      return ""; // Return an empty string if input is invalid
    }
    return (principalNum * (1 + interestRate * termNum)).toFixed(2);
  };

  // Function to handle term input changes
  const handleTermChange = (e) => {
    const newTerm = e.target.value;
    setTerm(newTerm); // Update term state

    // Recalculate total and remaining balance
    const newTotal = calculateTotal(principalAmount, newTerm);
    const newRemainingBalance = (parseFloat(newTotal) - amountPaid).toFixed(2);

    // Update state
    setTotal(newTotal);
    setRemainingBalance(newRemainingBalance);
  };

  // Handle form submission to update borrower data
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const borrowerRef = doc(db, "borrowers", borrower.id);
      await updateDoc(borrowerRef, {
        name,
        principalAmount: parseFloat(principalAmount),
        term: parseInt(term, 10),
        dateBorrowed: new Date(dateBorrowed),
        total: parseFloat(total),
        remainingBalance: parseFloat(remainingBalance),
      });
      onClose(); // Close the modal after update
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Borrower updated successfully!",
      });
    } catch (error) {
      console.error("Error updating borrower: ", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update borrower. Please try again.",
      });
    }
  };

  return (
    isOpen && (
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Borrower</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="text-start">
                <div className="mb-3">
                  <label className="form-label">Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Principal Amount:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formatNumberWithCommas(principalAmount)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, "");
                      setPrincipalAmount(value);
                      setTotal(calculateTotal(value, term)); // Update the total field
                    }}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Term (Months):</label>
                  <input
                    type="number"
                    className="form-control"
                    value={term}
                    onChange={handleTermChange} // Use handleTermChange directly
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Total:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formatNumberWithCommas(total)}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Remaining Balance:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formatNumberWithCommas(remainingBalance)}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date Borrowed:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateBorrowed}
                    onChange={(e) => setDateBorrowed(e.target.value)}
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
    )
  );
}

export default EditBorrower;
