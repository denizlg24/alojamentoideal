"use client";
import { UnauthorizedError } from "@/lib/utils";

export default function Error({ error }: { error: Error }) {
  if (error instanceof UnauthorizedError) {
    return (
      <div>
        <h1>Access Denied</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Something went wrong</h1>
      <p>Please try again later.</p>
    </div>
  );
}