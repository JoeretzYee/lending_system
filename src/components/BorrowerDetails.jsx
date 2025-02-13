import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  db,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  Timestamp,
  query,
  where,
  onSnapshot,
} from "../firebase";
import { formatNumberWithCommas } from "../utils/formatNumberWithCommas";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { writeFile, utils } from "xlsx";

function BorrowerDetails() {
  const { id } = useParams(); // Get the borrower ID from the URL
  const [borrower, setBorrower] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [remainingBalance, setRemainingBalance] = useState("");
  const [paymentsHistory, setPaymentsHistory] = useState([]);

  // Fetch borrower details from Firebase
  useEffect(() => {
    const fetchBorrowerDetails = async () => {
      try {
        const docRef = doc(db, "borrowers", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBorrower(docSnap.data());
        } else {
          console.log("No such borrower!");
        }
      } catch (error) {
        console.error("Error fetching borrower details:", error);
      }
    };

    fetchBorrowerDetails();
  }, [id]);

  // Fetch payment history in real-time
  useEffect(() => {
    const unsubscribePaymentsHistory = onSnapshot(
      query(collection(db, "paymentsHistory"), where("borrowerId", "==", id)),
      (querySnapshot) => {
        const payments = [];
        querySnapshot.forEach((doc) => {
          payments.push(doc.data());
        });
        // Sort payments by paymentDate in ascending order
        payments.sort((a, b) => a.paymentDate.seconds - b.paymentDate.seconds);
        setPaymentsHistory(payments);
      }
    );

    return () => unsubscribePaymentsHistory(); // Cleanup listener on unmount
  }, [id]);

  // Handle the Add Payment button click
  const handleAddPaymentClick = () => {
    setIsModalOpen(true);
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle the payment amount change
  const handlePaymentAmountChange = (e) => {
    setPaymentAmount(e.target.value);
  };

  // Handle the form submission (saving payment)
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const newRemainingBalance =
      borrower.remainingBalance - parseFloat(paymentAmount);

    try {
      // Add payment to paymentsHistory collection
      await addDoc(collection(db, "paymentsHistory"), {
        borrowerId: id,
        paymentDate: Timestamp.fromDate(new Date(paymentDate)),
        amount: parseFloat(paymentAmount),
        remainingBalance: newRemainingBalance,
      });
      // Check if fully paid, and update borrower document
      const fullyPaid = newRemainingBalance === 0;

      // Update borrower document (remainingBalance and total)
      await updateDoc(doc(db, "borrowers", id), {
        remainingBalance: newRemainingBalance,
        fullyPaid: fullyPaid,
      });

      Swal.fire({
        icon: "success",
        title: "Payment Added",
        text: "The payment has been successfully added!",
      });

      // Close modal and reset payment amount
      setIsModalOpen(false);
      setPaymentAmount("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      console.error("Error adding payment:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add payment. Please try again.",
      });
    }
  };

  // Function to generate Excel report
  const generateReport = () => {
    const wsData = [
      ["Name", borrower.name],
      ["Principal", formatNumberWithCommas(borrower.principalAmount)],
      ["Term", borrower.term],
      ["Total", formatNumberWithCommas(borrower.total)],
      [
        "Remaining Balance",
        borrower.remainingBalance === 0
          ? "0"
          : formatNumberWithCommas(borrower.remainingBalance),
      ],
      ["", ""], // Empty row between borrower and payment history
      ["Payment Date", "Amount", "Remaining Balance"],
    ];

    paymentsHistory.forEach((payment) => {
      wsData.push([
        new Date(payment.paymentDate.seconds * 1000).toLocaleDateString(),
        formatNumberWithCommas(payment.amount),
        payment.remainingBalance === 0
          ? "0"
          : formatNumberWithCommas(payment.remainingBalance),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-adjust column width
    const colWidths = wsData[0].map((_, colIndex) => {
      const maxLength = Math.max(
        ...wsData.map((row) =>
          row[colIndex] ? row[colIndex].toString().length : 0
        )
      );
      return { wch: maxLength + 2 }; // Adding some padding
    });

    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    XLSX.writeFile(wb, `${borrower.name}_report.xlsx`);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <Link to="/">
          <button className="btn btn-md btn-secondary">Back</button>
        </Link>
        <button
          className="btn btn-md btn-success"
          //   onClick={() => generateReport(borrower, paymentsHistory)}
          onClick={generateReport}
        >
          Generate Report
        </button>
      </div>
      {borrower ? (
        <div className="container">
          <ul className="list-group">
            <li className="list-group-item active" aria-current="true">
              <h1> {borrower?.name}</h1>
            </li>
            <li className="list-group-item d-flex align-items-center justify-content-center">
              <h5>Principal:</h5>&nbsp;{" "}
              <h6>{formatNumberWithCommas(borrower?.principalAmount)}</h6>
            </li>
            <li className="list-group-item d-flex align-items-center justify-content-center">
              <h5>Term:</h5>&nbsp; <h6>{borrower?.term}</h6>
            </li>
            <li className="list-group-item d-flex align-items-center justify-content-center">
              <h5>Total:</h5>&nbsp;{" "}
              <h6>{formatNumberWithCommas(borrower?.total)}</h6>
            </li>
            <li className="list-group-item d-flex align-items-center justify-content-center">
              <h5>Remaining Balance:</h5>&nbsp;{" "}
              <h6>
                {borrower?.remainingBalance === 0
                  ? "0"
                  : formatNumberWithCommas(borrower.remainingBalance)}
              </h6>
            </li>
          </ul>
          <div className="container-fluid d-flex justify-content-between align-items-center">
            <h2 className="text-center mt-4 w-80">Payment History</h2>
            <button
              className="btn btn-md btn-primary ms-auto"
              onClick={handleAddPaymentClick}
            >
              Add Payment
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Date Pay</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {paymentsHistory.map((payment, index) => (
                  <tr key={index}>
                    <td>
                      {new Date(
                        payment?.paymentDate.seconds * 1000
                      ).toLocaleDateString()}
                    </td>
                    <td>{formatNumberWithCommas(payment?.amount)}</td>
                    <td>
                      {payment?.remainingBalance === 0
                        ? "0"
                        : formatNumberWithCommas(payment?.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Modal */}
          {isModalOpen && (
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              role="dialog"
            >
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Add Payment</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseModal}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handlePaymentSubmit}>
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
                          onChange={handlePaymentAmountChange}
                          required
                        />
                      </div>

                      <div className="modal-footer">
                        <button type="submit" className="btn btn-primary">
                          Save Payment
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleCloseModal}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>Loading borrower details...</p>
      )}
    </div>
  );
}

export default BorrowerDetails;
