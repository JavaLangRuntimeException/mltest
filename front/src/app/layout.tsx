import React from "react";
import { Provider } from "jotai";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
        <head />
        <body>
        <Provider>{children}</Provider>
        </body>
        </html>
    );
}