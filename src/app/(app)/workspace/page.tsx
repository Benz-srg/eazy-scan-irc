import type { Metadata } from "next";
import { Workspace } from "@/components/app/Workspace";

export const metadata: Metadata = {
  title: "พื้นที่ทำงาน",
  description: "อัปโหลดหรืออัดเสียง Requirement ของลูกค้า เลือกบริการถอดเสียง แล้วเริ่มวิเคราะห์ด้วย AI",
};

export default function WorkspacePage() {
  return <Workspace />;
}
