"use client"
import { ReduxProvider } from "@/redux/provider"
import { ThirdwebProvider } from "thirdweb/react";
import Wrapper from "@/app/components/Wrapper"
import Footer from "@/app/components/Footer"
import Header from "@/app/components/Header"
import { env } from "@/environment"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className="bg-black">
                {env === "dev" && (
                    <div className="fixed top-5 left-5 bg-white border border-black text-black px-2">Staging</div>
                )}
                <ReduxProvider>
                    <ThirdwebProvider>
                        <Wrapper>
                            <Header title="Welcome" />
                            {children}
                            <Footer />
                        </Wrapper>
                    </ThirdwebProvider>
                </ReduxProvider>
            </body>
        </html>
    )
}
