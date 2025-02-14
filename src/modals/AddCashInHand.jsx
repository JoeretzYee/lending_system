import React, { useState, useEffect } from "react";
import { db, doc, getDoc, updateDoc } from "../firebase";
import Swal from "sweetalert2";

const AddCashInHand = ({ isOpen, onClose }) => {
  const [cashIn, setCashIn] = useState("");
  const [cashHand, setCashHand] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const cashInHandRef = doc(db, "cashInHand", "fYpSgX6iR0jl5fcLo4fB"); // Replace 'default' with the actual doc ID
      const cashInHandDoc = await getDoc(cashInHandRef);

      if (cashInHandDoc.exists()) {
        const existingData = cashInHandDoc.data();
        const updatedCashIn = (existingData.cashIn || 0) + Number(cashIn);
        const updatedCashHand = (existingData.cashHand || 0) + Number(cashHand);

        await updateDoc(cashInHandRef, {
          cashIn: updatedCashIn,
          cashHand: updatedCashHand,
        });

        Swal.fire("Success!", "Cash In Hand updated.", "success");
      } else {
        Swal.fire("Error!", "No existing cash data found.", "error");
      }

      setCashHand(""); // Reset fields
      setCashIn(""); // Reset fields
      onClose(); // Close modal
    } catch (error) {
      console.error("Error updating cash:", error);
      Swal.fire("Error!", "Failed to update cash in hand.", "error");
    }
  };

  if (!isOpen) return null; // Hide modal when not open

  return (
    <>
      <div className="modal d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Cash In Bank/On Hand</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="text-start">
                <div className="mb-3">
                  <label className="form-label">Cash In Bank</label>
                  <input
                    type="number"
                    className="form-control"
                    value={cashIn}
                    onChange={(e) => setCashIn(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Cash On Hand</label>
                  <input
                    type="number"
                    className="form-control"
                    value={cashHand}
                    onChange={(e) => setCashHand(e.target.value)}
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop to darken the background */}
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
    </>
  );
};

export default AddCashInHand;
