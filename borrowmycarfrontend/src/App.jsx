import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet";
import CarFilterBar from "./CarFilterBar";
import ListCar from "./ListCar";
import CarDetails from "./CarDetails";
import CarListingSection from "./CarListingSection";

const App = () => {
  return (
    <>
      <Helmet>
        <title>BorrowMyCar | Home </title>
      </Helmet>
      <div className="min-h-screen">
        <div className="min-h-fit">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to <span className="text-green-600">BorrowMyCar</span>
            </h1>
            <p className="mt-2 text-gray-600">
              Your one-stop solution for car rentals. Explore our services and
              find the perfect car for your needs.
            </p>
          </div>
          <CarListingSection />
        </div>
      </div>
      <Outlet />
    </>
  );
};

export default App;
