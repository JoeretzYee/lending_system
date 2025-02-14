import React, { useState, useEffect } from "react";
import { db, doc, updateDoc } from "../firebase";
import Swal from "sweetalert2";
import { formatNumberWithCommas } from "../utils/formatNumberWithCommas";

function EditBorrower({ borrower, isOpen, onClose }) {
  const [name, setName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [term, setTerm] = useState("");
  const [total, setTotal] = useState("");
  const [remainingBalance, setRemainingBalance] = useState("");
  const [dateBorrowed, setDateBorrowed] = useState("");

  const interestRate = 0.07;

  // Set the form fields with the borrower data when the modal opens
  useEffect(() => {
    if (isOpen && borrower) {
      const detail = borrower; // Assuming you are editing the first detail
      setName(borrower.name);
      setPrincipalAmount(detail.principalAmount);
      setTerm(detail.term);
      setDateBorrowed(detail.dateBorrowed.toDate().toISOString().split("T")[0]); // Format date for input
      setTotal(detail.total);
      setRemainingBalance(detail.remainingBalance);
    }
  }, [isOpen, borrower]);

  // Function to calculate the total amount
  const calculateTotal = () => {
    const principal = parseFloat(principalAmount);
    const months = parseInt(term, 10);
    if (isNaN(principal) || isNaN(months)) {
      return ""; // Return an empty string if input is invalid
    }
    return (principal * (1 + interestRate * months)).toFixed(2);
  };

  // Handle form submission to update borrower data
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const borrowerRef = doc(db, "borrowers", borrower.id);
      await updateDoc(borrowerRef, {
        name,
        details: [
          {
            principalAmount: parseFloat(principalAmount),
            term: parseInt(term, 10),
            dateBorrowed: new Date(dateBorrowed),
            total: calculateTotal(),
            remainingBalance: calculateTotal(),
          },
        ],
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
                      setTotal(calculateTotal()); // Update the total field
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
                    onChange={(e) => setTerm(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Total:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formatNumberWithCommas(calculateTotal())}
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
