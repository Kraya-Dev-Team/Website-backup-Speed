import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const nunito = Nunito_Sans({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito" 
});

export const metadata: Metadata = {
  title: "KRAYA Admin — Dashboard",
  description: "KRAYA Admin Panel for managing products, orders, brands, and more.",
};

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { SidebarProvider } from "@/context/SidebarContext";
import { ProjectProvider } from "@/context/ProjectContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={nunito.variable}>
        <AuthProvider>
          <SidebarProvider>
            <ProjectProvider>
              {children}
            </ProjectProvider>
          </SidebarProvider>
          <ToastContainer 
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            style={{ zIndex: 1000001 }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
