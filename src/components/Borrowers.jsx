import React, { useState, useEffect } from "react";
import AddBorrower from "../modals/AddBorrower";
import EditBorrower from "../modals/EditBorrower";
import {
  db,
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  where,
  writeBatch,
  query,
  getDocs,
} from "../firebase";
import Swal from "sweetalert2";
import AddCashInHand from "../modals/AddCashInHand";
import { formatNumberWithCommas } from "../utils/formatNumberWithCommas";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import RemoveCashInHand from "../modals/RemoveCashInHand";

function Borrowers() {
  const [isEditBorrowerModalOpen, setIsEditBorrowerModalOpen] = useState(false);
  const [isCashInHandModalOpen, setIsCashInHandModalOpen] = useState(false);
  const [isRemoveCashInHandModalOpen, setIsRemoveCashInHandModalOpen] =
    useState(false);

  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [isAddBorrowerModalOpen, setIsAddBorrowerModalOpen] = useState(false);
  const [borrowers, setBorrowers] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [cashInHand, setCashInHand] = useState("");

  // Fetch borrowers in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "borrowers"), (snapshot) => {
      const borrowersList = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setBorrowers(borrowersList);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);
  // Fetch cash in hand in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "cashInHand"), (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data(); // Get the first document
        setCashInHand(docData);
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculate total remaining balance
  const totalRemainingBalance = borrowers.reduce(
    (sum, borrower) => sum + (Number(borrower.remainingBalance) || 0),
    0
  );

  const totalBalanceWithCash =
    totalRemainingBalance +
    (Number(cashInHand?.cashHand || 0) + (Number(cashInHand?.cashIn) || 0));

  // Filter borrowers by name based on search query
  const filteredBorrowers = borrowers.filter((borrower) =>
    borrower.name.toLowerCase().includes(searchName.toLowerCase())
  );

  const handleEditClick = (borrower) => {
    setSelectedBorrower(borrower);
    setIsEditBorrowerModalOpen(true);
  };

  // Delete borrower function
  const deleteBorrower = async (borrowerId) => {
    // Show SweetAlert confirmation dialog
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
    });

    if (result.isConfirmed) {
      try {
        const borrowerDoc = doc(db, "borrowers", borrowerId);
        const paymentsRef = collection(db, "paymentsHistory");

        // Query and delete related payment history
        const paymentSnapshot = await getDocs(
          query(paymentsRef, where("borrowerId", "==", borrowerId))
        );

        const batch = writeBatch(db);
        paymentSnapshot.forEach((paymentDoc) => {
          batch.delete(paymentDoc.ref);
        });

        await batch.commit(); // Delete all payment records in one go
        await deleteDoc(borrowerDoc); // Delete borrower

        Swal.fire(
          "Deleted!",
          "The borrower and their payment history have been deleted.",
          "success"
        ); // Success alert
      } catch (error) {
        console.error("Error deleting borrower: ", error);
        Swal.fire(
          "Error!",
          "There was an issue deleting the borrower.",
          "error"
        ); // Error alert
      }
    }
  };

  // Generate Excel Report
  const generateReport = () => {
    const wsData = [
      ["Name", "Status", "Remaining Balance"], // Headers
    ];

    borrowers.forEach((borrower) => {
      wsData.push([
        borrower.name,
        borrower.fullyPaid ? "Fully Paid" : "Partially Paid",
        borrower.remainingBalance === 0
          ? "0"
          : formatNumberWithCommas(borrower.remainingBalance),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-fit column widths
    const wscols = wsData[0].map((_, colIdx) => ({
      wch: Math.max(
        ...wsData.map((row) =>
          row[colIdx] ? row[colIdx].toString().length : 10
        )
      ),
    }));
    ws["!cols"] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Borrowers Report");

    XLSX.writeFile(wb, "Borrowers_Report.xlsx");
  };

  return (
    <div className="container mt-4">
      <div className="row mb-3 d-flex align-items-center">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search...."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>
        <div className="col-md-6  mt-2 mt-md-0 d-flex justify-content-end">
          <button
            onClick={() => setIsAddBorrowerModalOpen(true)}
            className="btn btn-primary"
          >
            Add Borrower
          </button>{" "}
          &nbsp;
          <button onClick={generateReport} className="btn btn-success">
            Generate Report
          </button>
          <AddBorrower
            isOpen={isAddBorrowerModalOpen}
            onClose={() => setIsAddBorrowerModalOpen(false)}
          />
        </div>
      </div>
      <div className="table-responsive">
        <div className="d-flex justify-content-between">
          <caption>
            <strong> Grand Total:</strong>{" "}
            {formatNumberWithCommas(totalBalanceWithCash)}
          </caption>
          <div>
            <div>
              <div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setIsCashInHandModalOpen(true)}
                >
                  <i className="bi bi-plus"></i>{" "}
                </button>
                <AddCashInHand
                  isOpen={isCashInHandModalOpen}
                  onClose={() => setIsCashInHandModalOpen(false)}
                />
                &nbsp;
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() => setIsRemoveCashInHandModalOpen(true)}
                >
                  <i className="bi bi-dash"></i>
                </button>
                <RemoveCashInHand
                  isOpen={isRemoveCashInHandModalOpen}
                  onClose={() => setIsRemoveCashInHandModalOpen(false)}
                />
              </div>
              <small>Cash In Bank:</small> &nbsp;
              <span>{formatNumberWithCommas(cashInHand?.cashIn || 0)}</span>
            </div>
            <div>
              <small>Cash On Hand:</small> &nbsp;
              <span>{formatNumberWithCommas(cashInHand?.cashHand || 0)}</span>
            </div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Remaining Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBorrowers.length > 0 ? (
              filteredBorrowers.map((borrower) => (
                <tr key={borrower.id}>
                  <td>{borrower?.name}</td>
                  <td
                    className={
                      borrower?.fullyPaid ? "bg-success" : "bg-warning"
                    }
                  >
                    {borrower?.fullyPaid ? "Fully Paid" : "Partially Paid"}
                  </td>
                  <td>{formatNumberWithCommas(borrower?.remainingBalance)}</td>
                  <td>
                    <Link to={`/details/${borrower?.id}`}>
                      <button className="btn btn-sm btn-primary">
                        <i className="bi bi-eye"></i>
                      </button>{" "}
                    </Link>
                    &nbsp;
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleEditClick(borrower)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <EditBorrower
                      borrower={selectedBorrower}
                      isOpen={isEditBorrowerModalOpen}
                      onClose={() => setIsEditBorrowerModalOpen(false)}
                    />
                    &nbsp;
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteBorrower(borrower.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No borrowers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Borrowers;
