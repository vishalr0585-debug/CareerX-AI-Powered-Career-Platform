"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MockInterviewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/interview-lab");
  }, [router]);
  return null;
}
