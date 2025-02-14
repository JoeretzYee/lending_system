import React, { useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";

function RemoveCashInHand({ isOpen, onClose }) {
  const [cashIn, setCashIn] = useState("");
  const [cashHand, setCashHand] = useState("");

  const handleRemoveCash = async (e) => {
    e.preventDefault();
    try {
      const cashInHandRef = doc(db, "cashInHand", "fYpSgX6iR0jl5fcLo4fB");
      const cashInHandDoc = await getDoc(cashInHandRef);

      if (!cashInHandDoc.exists()) {
        Swal.fire("Error", "No cash data found", "error");
        return;
      }

      const existingData = cashInHandDoc.data();
      let updates = {};

      if (cashIn !== "") {
        const updatedCashIn = (existingData.cashIn || 0) - Number(cashIn);
        if (updatedCashIn < 0) {
          Swal.fire(
            "Error",
            "Cannot remove more cashIn than available",
            "error"
          );
          return;
        }
        updates.cashIn = updatedCashIn;
      }

      if (cashHand !== "") {
        const updatedCashHand = (existingData.cashHand || 0) - Number(cashHand);
        if (updatedCashHand < 0) {
          Swal.fire(
            "Error",
            "Cannot remove more cashHand than available",
            "error"
          );
          return;
        }
        updates.cashHand = updatedCashHand;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(cashInHandRef, updates);
        Swal.fire("Success", "Cash has been removed successfully", "success");
        setCashHand("");
        setCashIn("");
      } else {
        Swal.fire("Info", "No changes were made", "info");
      }

      onClose();
    } catch (error) {
      console.error("Error removing cash: ", error);
      Swal.fire("Error", "Failed to remove cash", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Remove Cash In Hand</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Cash In</label>
              <input
                type="number"
                className="form-control"
                value={cashIn}
                onChange={(e) => setCashIn(e.target.value)}
                placeholder="Enter amount to remove"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Cash Hand</label>
              <input
                type="number"
                className="form-control"
                value={cashHand}
                onChange={(e) => setCashHand(e.target.value)}
                placeholder="Enter amount to remove"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleRemoveCash}>
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RemoveCashInHand;
