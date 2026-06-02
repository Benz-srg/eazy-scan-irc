import type { Metadata } from "next";
import { History } from "@/components/app/History";

export const metadata: Metadata = {
  title: "ประวัติการวิเคราะห์",
  description: "คลังเอกสารการวิเคราะห์ทั้งหมด ค้นหา กรอง และเปิดดูผล SOW และ Manday ที่เคยสร้าง",
};

export default function HistoryPage() {
  return <History />;
}
