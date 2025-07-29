import React, { useState } from "react";
import PositionsTable from "./PositionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Wallet, BarChart3 } from "lucide-react";

interface HomeProps {
  onNavigateToWallets?: () => void;
}

const Home = ({ onNavigateToWallets = () => {} }: HomeProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="container mx-auto py-8 px-4 bg-background min-h-screen">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Financial Positions Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              View and analyze your financial positions data
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onNavigateToWallets}
              className="flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              View Wallets
            </Button>
          </div>
        </div>
      </header>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Positions Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <PositionsTable />
          </CardContent>
        </Card>
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Financial Positions Dashboard. All
          rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
