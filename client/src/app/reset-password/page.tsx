import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
