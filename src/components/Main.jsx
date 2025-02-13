import React from "react";
import { Route, Routes } from "react-router-dom";
import Borrowers from "./Borrowers";
import BorrowerDetails from "./BorrowerDetails";

function Main() {
  return (
    <div className="main p-3">
      <div className="text-center">
        <h1>Lending System</h1>
        <hr />
        <Routes>
          <Route path="/" element={<Borrowers />} />
          <Route path="/borrowers" element={<Borrowers />} />
          <Route path="/details/:id" element={<BorrowerDetails />} />
        </Routes>
      </div>
    </div>
  );
}

export default Main;
