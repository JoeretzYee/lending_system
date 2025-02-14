import React, { useState, useEffect } from "react";
import { db, addDoc, collection, Timestamp, getDocs } from "../firebase";
import Select from "react-select";
import Swal from "sweetalert2";
import { formatNumberWithCommas } from "../utils/formatNumberWithCommas";

function AddBorrower({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [term, setTerm] = useState("");
  const [total, setTotal] = useState("");
  const [remainingBalance, setRemainingBalance] = useState("");
  const [dateBorrowed, setDateBorrowed] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [borrowers, setBorrowers] = useState([]); // State to store borrower names
  const interestRate = 0.07;

  // Fetch borrower names from Firebase
  useEffect(() => {
    const fetchBorrowers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "borrowers"));
        const borrowerOptions = querySnapshot.docs.map((doc) => ({
          label: doc.data().name, // Display borrower name
          value: doc.id, // Use document ID as value
        }));
        setBorrowers(borrowerOptions); // Set the borrower names to state
      } catch (error) {
        console.error("Error fetching borrower names: ", error);
      }
    };
    fetchBorrowers();
  }, []);

  // Function to calculate the total amount
  const calculateTotal = () => {
    const principal = parseFloat(principalAmount.replace(/,/g, ""));
    const months = parseInt(term, 10);
    if (isNaN(principal) || isNaN(months)) {
      return ""; // Return an empty string if input is invalid
    }
    return (principal * (1 + interestRate * months)).toFixed(2);
  };

  // Handle changes in the principal amount field
  const handlePrincipalAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, ""); // Remove existing commas
    setPrincipalAmount(value);
    setTotal(calculateTotal()); // Update the total field
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "borrowers"), {
        name,

        principalAmount: parseFloat(principalAmount.replace(/,/g, "")),
        term: parseInt(term, 10),
        dateBorrowed: Timestamp.fromDate(new Date(dateBorrowed)),
        total: Number(calculateTotal()),
        remainingBalance: calculateTotal(),
        fullyPaid: false,
      });
      onClose(); // Close the modal after submission
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Borrower added successfully!",
      });
    } catch (error) {
      console.error("Error adding borrower: ", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add borrower. Please try again.",
      });
    }
  };

  return (
    isOpen && (
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Borrower</h5>
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
                  {/* <Select
                    options={borrowers} // Pass the borrower names as options
                    onChange={(selectedOption) => setName(selectedOption.label)} // Set name when a user selects an option
                    placeholder="Select Borrower"
                    isClearable
                  /> */}
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
                    onChange={handlePrincipalAmountChange}
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
                    Save
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

export default AddBorrower;
