import React from "react";

function Borrowers() {
  return (
    <div className="container mt-4">
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search...."
          />
        </div>
        <div className="col-md-6 text-md-end text-start mt-2 mt-md-0">
          <button className="btn btn-primary">Add Borrower</button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Treatment</th>
              <th>Discount</th>
              <th>Total Cost</th>
              <th>Amount Paid</th>
              <th>Remaining Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>fgh</td>
              <td>7%</td>
              <td>345</td>
              <td>345</td>
              <td>345</td>
              <td>
                <button className="btn btn-sm btn-success">Fully Paid</button>
                <button className="btn btn-sm btn-warning">Pending</button>{" "}
                &nbsp;
                <button className="btn btn-sm btn-primary">Pay</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Borrowers;
