import { Suspense, useState } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import WalletList from "./components/WalletList";
import WalletDetails from "./components/WalletDetails";
import Analytics from "./components/Analytics";
import routes from "tempo-routes";

function App() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<
    "home" | "wallets" | "wallet-details" | "analytics"
  >("home");

  const handleWalletSelect = (address: string) => {
    setSelectedWallet(address);
    setCurrentView("wallet-details");
  };

  const handleBackToWallets = () => {
    setSelectedWallet(null);
    setCurrentView("wallets");
  };

  const handleBackToHome = () => {
    setSelectedWallet(null);
    setCurrentView("home");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "wallets":
        return (
          <WalletList
            onWalletSelect={handleWalletSelect}
            onBack={handleBackToHome}
          />
        );
      case "wallet-details":
        return selectedWallet ? (
          <WalletDetails
            walletAddress={selectedWallet}
            onBack={handleBackToWallets}
          />
        ) : (
          <WalletList
            onWalletSelect={handleWalletSelect}
            onBack={handleBackToHome}
          />
        );
      case "analytics":
        return <Analytics onBack={handleBackToHome} />;
      default:
        return (
          <Home
            onNavigateToWallets={() => setCurrentView("wallets")}
            onNavigateToAnalytics={() => setCurrentView("analytics")}
          />
        );
    }
  };

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={renderCurrentView()} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
