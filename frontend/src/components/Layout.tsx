import { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
  username?: string;
}

const Layout = ({ children, username }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar username={username} />
      <main className="pt-16">{children}</main>
    </div>
  );
};

export default Layout;
