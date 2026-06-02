import type { Metadata } from "next";
import { Processing } from "@/components/app/Processing";

export const metadata: Metadata = {
  title: "กำลังวิเคราะห์",
  description: "AI กำลังถอดเสียงและวิเคราะห์ Requirement เพื่อสร้าง Scope of Work และประเมิน Manday",
  robots: { index: false },
};

export default function ProcessingPage() {
  return <Processing />;
}
